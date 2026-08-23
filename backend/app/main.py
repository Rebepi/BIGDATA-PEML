from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from app.config import get_settings
from app.database import engine, Base, SessionLocal
from app.routers import gasto, regiones, alertas, auth, prediccion, modelo_metricas
from app.routers import etl_pipeline

from app.models import Usuario
from app.auth_utils import hash_password

settings = get_settings()


def seed_admin_user():
    db = SessionLocal()
    try:
        admin_email = getattr(settings, "admin_email", "renzobendezu51@gmail.com").strip().lower()
        user = db.query(Usuario).filter(Usuario.email == admin_email).first()
        if not user:
            user = Usuario(
                email=admin_email,
                hashed_password=hash_password("admin123"),
                nombre="Renzo Bendezú (Administrador MEF)",
                is_active=True
            )
            db.add(user)
            db.commit()
        else:
            if not user.is_active:
                user.is_active = True
                db.commit()
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    import threading
    from app.scheduler import start_scheduler, stop_scheduler, run_etl_pipeline, ensure_initial_etl_log
    from app.models import GastoPublico
    Base.metadata.create_all(bind=engine)
    seed_admin_user()
    ensure_initial_etl_log()
    start_scheduler()
    db = SessionLocal()
    try:
        count = db.query(GastoPublico).count()
        if count == 0:
            threading.Thread(target=run_etl_pipeline, daemon=True).start()
    finally:
        db.close()
    yield
    stop_scheduler()


app = FastAPI(
    title="API — Gasto Público Perú",
    description="Sistema de monitoreo de ejecución presupuestal del MEF.",
    version="1.0.0",
    lifespan=lifespan,
)

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]
for org in settings.origins_list:
    if org and org not in origins:
        origins.append(org)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"^(https?://(localhost|127\.0\.0\.1)(:\d+)?|https://.*\.vercel\.app|https://.*\.onrender\.com)$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



app.include_router(auth.router)
app.include_router(gasto.router)
app.include_router(regiones.router)
app.include_router(alertas.router)
app.include_router(prediccion.router)
app.include_router(modelo_metricas.router)
app.include_router(etl_pipeline.router)



@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    return JSONResponse(status_code=404, content={"detail": "Recurso no encontrado"})


@app.exception_handler(500)
async def server_error_handler(request: Request, exc):
    return JSONResponse(status_code=500, content={"detail": "Error interno del servidor"})


@app.get("/")
def root():
    return {"message": "API Gasto Público Perú — v1.0.0", "docs": "/docs"}


@app.get("/api/health")
@app.get("/health")
def health_check():
    db = SessionLocal()
    try:
        from app.models import GastoPublico, Region, Alerta
        total_gastos = db.query(GastoPublico).count()
        total_regiones = db.query(Region).count()
        total_alertas = db.query(Alerta).count()
        return {
            "status": "healthy",
            "database": "connected",
            "total_registros_gasto": total_gastos,
            "total_regiones": total_regiones,
            "total_alertas": total_alertas,
            "version": "1.0.0",
        }
    except Exception as e:
        return JSONResponse(status_code=500, content={"status": "unhealthy", "error": str(e)})
    finally:
        db.close()

