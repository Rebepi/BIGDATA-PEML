import os
import secrets
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta, timezone
import bcrypt
import jwt
from app.config import get_settings

settings = get_settings()


def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8")
        )
    except Exception:
        return False


def create_token(data: dict, expires_delta: timedelta) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + expires_delta
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode,
        settings.secret_key,
        algorithm=settings.algorithm
    )
    return encoded_jwt


def create_temp_token(email: str, user_id: int) -> str:
    return create_token(
        {"sub": email, "user_id": user_id, "type": "2fa_pending"},
        timedelta(minutes=settings.temp_token_expire_minutes)
    )


def create_access_token(email: str, user_id: int, nombre: str = "") -> str:
    return create_token(
        {"sub": email, "user_id": user_id, "nombre": nombre, "type": "access"},
        timedelta(minutes=settings.access_token_expire_minutes)
    )


def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(
            token,
            settings.secret_key,
            algorithms=[settings.algorithm]
        )
        return payload
    except Exception:
        return None


def generate_otp() -> str:
    return "".join(str(secrets.randbelow(10)) for _ in range(6))


import logging

logger = logging.getLogger("auth_utils")


def _send_via_brevo(to_email: str, subject: str, html_content: str, text_content: str) -> dict:
    """Envía email usando la API REST HTTPS de Brevo (Sendinblue). Funciona 100% en Render free tier."""
    try:
        import requests
        api_key = settings.brevo_api_key.strip()
        sender_email = settings.smtp_from.strip() or "gastope.monitor@gmail.com"
        
        url = "https://api.brevo.com/v3/smtp/email"
        headers = {
            "accept": "application/json",
            "api-key": api_key,
            "content-type": "application/json"
        }
        payload = {
            "sender": {
                "name": "Sistema de Monitoreo MEF",
                "email": sender_email
            },
            "to": [
                {
                    "email": to_email,
                    "name": to_email.split("@")[0]
                }
            ],
            "subject": subject,
            "htmlContent": html_content,
            "textContent": text_content
        }
        
        resp = requests.post(url, json=payload, headers=headers, timeout=12)
        if resp.status_code in (200, 201):
            data = resp.json()
            logger.info(f"Correo 2FA enviado via Brevo desde {sender_email} hacia {to_email}. MessageId: {data.get('messageId')}")
            return {"sent_via_smtp": True, "email": to_email, "dev_code": None, "error": None}
        else:
            err_msg = f"Brevo API error ({resp.status_code}): {resp.text}"
            logger.error(err_msg)
            return {"sent_via_smtp": False, "email": to_email, "dev_code": None, "error": err_msg}
    except Exception as e:
        logger.error(f"Error al enviar via Brevo: {e}")
        return {"sent_via_smtp": False, "email": to_email, "dev_code": None, "error": str(e)}



def _send_via_resend(to_email: str, subject: str, html_content: str, text_content: str) -> dict:
    """Envía email usando la API HTTP de Resend (funciona en Render free tier)."""
    try:
        import resend
        resend.api_key = settings.resend_api_key
        resend_from = f"Sistema Gasto Público Perú <onboarding@resend.dev>"
        actual_recipient = to_email
        actual_subject = subject

        r = resend.Emails.send({
            "from": resend_from,
            "to": [actual_recipient],
            "subject": actual_subject,
            "html": html_content,
            "text": text_content,
        })
        if r and r.get("id"):
            logger.info(f"Correo 2FA enviado via Resend a {actual_recipient}. ID: {r['id']}")
            return {"sent_via_smtp": True, "email": to_email, "dev_code": None, "error": None}
        smtp_from = settings.smtp_from.strip()
        if actual_recipient != smtp_from:
            logger.warning(f"Resend sandbox: redirigiendo de {actual_recipient} a {smtp_from}")
            actual_subject = f"[Para: {to_email}] {subject}"
            r2 = resend.Emails.send({
                "from": resend_from,
                "to": [smtp_from],
                "subject": actual_subject,
                "html": html_content,
                "text": text_content,
            })
            if r2 and r2.get("id"):
                logger.info(f"Correo 2FA redirigido a {smtp_from} (sandbox). ID: {r2['id']}")
                return {"sent_via_smtp": True, "email": to_email, "dev_code": None, "error": None}
        return {"sent_via_smtp": False, "email": to_email, "dev_code": None, "error": "Resend no devolvió ID de envío."}
    except Exception as e:
        err = str(e)
        if "own email address" in err or "verify a domain" in err:
            try:
                smtp_from = settings.smtp_from.strip()
                logger.warning(f"Resend sandbox: redirigiendo 2FA de {to_email} a {smtp_from}")
                r3 = resend.Emails.send({
                    "from": f"Sistema Gasto Público Perú <onboarding@resend.dev>",
                    "to": [smtp_from],
                    "subject": f"[Código para {to_email}] {subject}",
                    "html": html_content,
                    "text": f"DESTINATARIO REAL: {to_email}\n\n{text_content}",
                })
                if r3 and r3.get("id"):
                    return {"sent_via_smtp": True, "email": to_email, "dev_code": None, "error": None}
            except Exception as e2:
                logger.error(f"Error en redirección Resend sandbox: {e2}")
        logger.error(f"Error al enviar via Resend: {e}")
        return {"sent_via_smtp": False, "email": to_email, "dev_code": None, "error": err}


def send_email_otp(to_email: str, code: str) -> dict:
    subject = f"🇵🇪 Código de Seguridad 2FA: {code} — Gasto Público Perú"
    
    formatted_code = " ".join(list(code))
    current_year = datetime.now().year
    
    logger.info(f"🔑 [2FA OTP] Código generado para {to_email}: >>> {code} <<<")

    
    html_content = f"""<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Código de Seguridad 2FA</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;900&family=JetBrains+Mono:wght@700&display=swap');
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #090d16; font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f1f5f9; -webkit-font-smoothing: antialiased;">
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #090d16; padding: 40px 15px;">
        <tr>
            <td align="center">
                <!-- Contenedor Principal -->
                <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background: #111827; border-radius: 20px; overflow: hidden; border: 1px solid #1f293d; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);">
                    
                    <!-- Barra de Acento Bandera / Gobierno -->
                    <tr>
                        <td height="5" style="background: linear-gradient(90deg, #c8000a 0%, #d4af37 50%, #c8000a 100%);"></td>
                    </tr>

                    <!-- Encabezado Institucional -->
                    <tr>
                        <td style="padding: 32px 36px 20px 36px; text-align: center; background: radial-gradient(circle at top, rgba(200, 0, 10, 0.12) 0%, transparent 70%);">
                            <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin: 0 auto 16px auto;">
                                <tr>
                                    <td style="background: rgba(200, 0, 10, 0.15); border: 1px solid rgba(200, 0, 10, 0.3); border-radius: 12px; padding: 8px 16px; text-align: center;">
                                        <span style="font-size: 11px; font-weight: 800; color: #f87171; letter-spacing: 2px; text-transform: uppercase;">
                                            🇵🇪 REPÚBLICA DEL PERÚ · MEF
                                        </span>
                                    </td>
                                </tr>
                            </table>
                            <h1 style="margin: 0 0 6px 0; font-size: 22px; font-weight: 900; color: #ffffff; letter-spacing: -0.5px;">
                                Sistema de Monitoreo de Gasto Público
                            </h1>
                            <p style="margin: 0; font-size: 13px; color: #94a3b8; font-weight: 500;">
                                Plataforma de Big Data y Analítica Presupuestal
                            </p>
                        </td>
                    </tr>

                    <!-- Separador Sutil -->
                    <tr>
                        <td style="padding: 0 36px;">
                            <div style="height: 1px; background: linear-gradient(90deg, transparent, #1f293d, transparent);"></div>
                        </td>
                    </tr>

                    <!-- Cuerpo del Mensaje -->
                    <tr>
                        <td style="padding: 28px 36px 20px 36px;">
                            <p style="margin: 0 0 16px 0; font-size: 15px; color: #e2e8f0; line-height: 1.6;">
                                Estimado/a Administrador/a,
                            </p>
                            <p style="margin: 0 0 24px 0; font-size: 14px; color: #94a3b8; line-height: 1.6;">
                                Se ha detectado una solicitud de inicio de sesión para la cuenta <strong style="color: #ffffff;">{to_email}</strong>. Para completar su acceso seguro mediante autenticación en dos factores (2FA), utilice el siguiente código de verificación:
                            </p>

                            <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 0 0 24px 0;">
                                <tr>
                                    <td style="background: #0b1120; border: 2px solid #c8000a; border-radius: 16px; padding: 26px 20px; text-align: center; box-shadow: 0 0 25px rgba(200, 0, 10, 0.2);">
                                        <div style="font-size: 11px; font-weight: 800; color: #d4af37; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 10px;">
                                            CÓDIGO DE SEGURIDAD TEMPORAL
                                        </div>
                                        <div style="font-family: 'JetBrains Mono', 'Courier New', Courier, monospace; font-size: 38px; font-weight: 900; color: #ffffff; letter-spacing: 12px; margin-left: 12px; text-shadow: 0 0 10px rgba(255,255,255,0.4); -webkit-user-select: all; user-select: all; cursor: pointer;">
                                            {code}
                                        </div>
                                        <div style="margin-top: 18px; margin-bottom: 8px;">
                                            <span style="display: inline-block; background: linear-gradient(135deg, #c8000a 0%, #8b0000 100%); color: #ffffff; font-size: 13px; font-weight: 800; padding: 10px 24px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.2); box-shadow: 0 4px 14px rgba(200,0,10,0.4); letter-spacing: 0.5px; -webkit-user-select: all; user-select: all; cursor: pointer;">
                                                📋 Copiar Código: {code}
                                            </span>
                                        </div>
                                        <div style="font-size: 11px; color: #64748b; margin-top: 10px;">
                                            Toca o selecciona el código para copiarlo · Válido durante <strong style="color: #f87171;">10 minutos</strong>
                                        </div>
                                    </td>
                                </tr>
                            </table>

                            <!-- Ficha de Seguridad Informativa -->
                            <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background: rgba(15, 23, 42, 0.6); border-radius: 12px; border: 1px solid #1e293b; margin: 0 0 20px 0;">
                                <tr>
                                    <td style="padding: 16px 20px;">
                                        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                                            <tr>
                                                <td width="24" valign="top" style="padding-top: 2px;">
                                                    <span style="font-size: 16px;">🛡️</span>
                                                </td>
                                                <td style="padding-left: 10px;">
                                                    <p style="margin: 0; font-size: 12px; color: #cbd5e1; line-height: 1.5;">
                                                        <strong>Aviso de Ciberseguridad:</strong> No comparta este código con nadie. El personal del MEF nunca le solicitará esta clave por teléfono ni mensajería.
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin: 0; font-size: 12px; color: #64748b; line-height: 1.5;">
                                Si usted no solicitó este código de verificación, ignore este correo o comuníquese de inmediato con el equipo de soporte institucional.
                            </p>
                        </td>
                    </tr>

                    <!-- Pie de Página Institucional -->
                    <tr>
                        <td style="padding: 24px 36px 32px 36px; background-color: #0b1120; border-top: 1px solid #1f293d; text-align: center;">
                            <p style="margin: 0 0 6px 0; font-size: 11px; font-weight: 700; color: #94a3b8; letter-spacing: 0.5px;">
                                MINISTERIO DE ECONOMÍA Y FINANZAS — REPÚBLICA DEL PERÚ
                            </p>
                            <p style="margin: 0 0 12px 0; font-size: 11px; color: #475569;">
                                Dirección General de Presupuesto Público · Sistema Integrado de Big Data
                            </p>
                            <p style="margin: 0; font-size: 10px; color: #334155;">
                                © {current_year} Sistema de Monitoreo de Gasto Público. Mensaje confidencial y seguro.
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>"""

    text_content = f"""
===================================================================
REPÚBLICA DEL PERÚ — MINISTERIO DE ECONOMÍA Y FINANZAS
Sistema de Monitoreo de Gasto Público
===================================================================

Estimado/a Administrador/a,

Tu código de verificación de seguridad en dos pasos (2FA) es:

    >>> {code} <<<

Este código es válido por 10 minutos.
Si no has intentado iniciar sesión con tu cuenta ({to_email}), puedes ignorar este mensaje.

===================================================================
© {current_year} Ministerio de Economía y Finanzas · Todos los derechos reservados.
"""

    if settings.brevo_api_key and settings.brevo_api_key.strip().startswith("xkeysib-"):
        return _send_via_brevo(to_email, subject, html_content, text_content)
    if settings.resend_api_key and settings.resend_api_key.strip().startswith("re_"):
        return _send_via_resend(to_email, subject, html_content, text_content)
    sent_via_smtp = False
    error_message = None

    raw_password = settings.smtp_password.strip() if settings.smtp_password else ""
    clean_password = raw_password.replace(" ", "")
    clean_user = settings.smtp_user.strip() if settings.smtp_user else ""

    if not raw_password or raw_password == "tu_contraseña_de_aplicacion_aqui":
        error_message = "SMTP_PASSWORD no está configurado en el archivo .env del backend."
        logger.warning(f"Intento de envío de correo 2FA pero {error_message}")
        return {
            "sent_via_smtp": False,
            "email": to_email,
            "dev_code": None,
            "error": error_message
        }

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"Sistema de Monitoreo MEF <{settings.smtp_from}>"
        msg["To"] = to_email
        msg["X-Priority"] = "1"
        msg.attach(MIMEText(text_content, "plain", "utf-8"))
        msg.attach(MIMEText(html_content, "html", "utf-8"))

        if settings.smtp_port == 465:
            with smtplib.SMTP_SSL(settings.smtp_host, settings.smtp_port, timeout=15) as server:
                server.login(clean_user, clean_password)
                server.sendmail(settings.smtp_from, [to_email], msg.as_string())
        else:
            with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=15) as server:
                server.starttls()
                server.login(clean_user, clean_password)
                server.sendmail(settings.smtp_from, [to_email], msg.as_string())

        sent_via_smtp = True
        logger.info(f"Correo de verificación 2FA enviado exitosamente a {to_email}")
    except smtplib.SMTPAuthenticationError as auth_err:
        error_message = f"Error de autenticación SMTP con Gmail: Verifique que la contraseña de aplicación de 16 caracteres en backend/.env sea correcta. ({str(auth_err)})"
        logger.error(error_message)
    except Exception as e:
        error_message = f"Error al conectar con el servidor SMTP de Gmail: {str(e)}"
        logger.error(error_message)

    return {
        "sent_via_smtp": sent_via_smtp,
        "email": to_email,
        "dev_code": None,
        "error": error_message
    }
