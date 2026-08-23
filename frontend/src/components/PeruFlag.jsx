export default function PeruFlag({ width = 42, height = 28, className = '' }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 90 60"
      className={`peru-flag ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Bandera del Perú"
      style={{ display: 'inline-block', verticalAlign: 'middle', borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.25)' }}
    >
      <defs>
        <clipPath id="peru-flag-clip">
          <rect width="90" height="60" rx="3" />
        </clipPath>
        <clipPath id="shield-clip">
          <path d="M-8,-7.5 L8,-7.5 Q8.5,2 7,6 Q4,10 0,11.5 Q-4,10 -7,6 Q-8.5,2 -8,-7.5 Z" />
        </clipPath>
        <linearGradient id="flag-shimmer" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.08" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.15" />
        </linearGradient>
      </defs>

      <g clipPath="url(#peru-flag-clip)">
        <rect x="0" y="0" width="30" height="60" fill="#D91023" />
        <rect x="30" y="0" width="30" height="60" fill="#FFFFFF" />
        <rect x="60" y="0" width="30" height="60" fill="#D91023" />
        <rect x="0" y="0" width="90" height="60" fill="url(#flag-shimmer)" />

        <g transform="translate(45, 30)">
          <g transform="translate(0, -9.5)">
            <ellipse cx="0" cy="0" rx="3.5" ry="2" fill="none" stroke="#2E7D32" strokeWidth="0.9" />
            <circle cx="-2" cy="-0.5" r="0.6" fill="#1B5E20" />
            <circle cx="0" cy="-1.2" r="0.6" fill="#1B5E20" />
            <circle cx="2" cy="-0.5" r="0.6" fill="#1B5E20" />
            <circle cx="-1" cy="0.8" r="0.5" fill="#D91023" />
            <circle cx="1" cy="0.8" r="0.5" fill="#D91023" />
          </g>

          <g transform="translate(-10, 0)">
            <path d="M0,8 Q-3,2 -2,-4 Q-1.5,-7 0,-8" fill="none" stroke="#2E7D32" strokeWidth="0.8" />
            <path d="M-1.5,-6 Q-3.5,-7 -4,-6" fill="none" stroke="#388E3C" strokeWidth="0.7" />
            <path d="M-2,-3 Q-4.5,-3.5 -5,-2" fill="none" stroke="#388E3C" strokeWidth="0.7" />
            <path d="M-2,0 Q-4.5,0.5 -5,2" fill="none" stroke="#388E3C" strokeWidth="0.7" />
            <path d="M-1.5,3 Q-3.5,4.5 -4,6" fill="none" stroke="#388E3C" strokeWidth="0.7" />
            <path d="M-0.5,6 Q-2,7.5 -2.5,9" fill="none" stroke="#388E3C" strokeWidth="0.7" />
          </g>

          <g transform="translate(10, 0) scale(-1, 1)">
            <path d="M0,8 Q-3,2 -2,-4 Q-1.5,-7 0,-8" fill="none" stroke="#1B5E20" strokeWidth="0.8" />
            <ellipse cx="-2.5" cy="-5" rx="1.2" ry="0.6" fill="#2E7D32" transform="rotate(-25)" />
            <ellipse cx="-3" cy="-1.5" rx="1.2" ry="0.6" fill="#2E7D32" transform="rotate(-10)" />
            <ellipse cx="-3" cy="2" rx="1.2" ry="0.6" fill="#2E7D32" transform="rotate(15)" />
            <ellipse cx="-2.2" cy="5.5" rx="1.2" ry="0.6" fill="#2E7D32" transform="rotate(35)" />
            <circle cx="-1" cy="-3.5" r="0.5" fill="#D91023" />
            <circle cx="-1.5" cy="0.5" r="0.5" fill="#D91023" />
            <circle cx="-1" cy="4" r="0.5" fill="#D91023" />
          </g>

          <g clipPath="url(#shield-clip)">
            <rect x="-8.5" y="-8" width="8.5" height="9" fill="#4A90E2" />
            <rect x="0" y="-8" width="8.5" height="9" fill="#FFFFFF" />
            <rect x="-8.5" y="1" width="17" height="11" fill="#D91023" />

            <g transform="translate(-4, -3.2)">
              <ellipse cx="0" cy="0.2" rx="1.8" ry="1.1" fill="#C87D20" />
              <path d="M-0.8,-0.5 L-1.4,-2.8 L-0.7,-3.1 L0,-1 L0.5,-0.2" fill="#C87D20" />
              <circle cx="-1.4" cy="-3" r="0.6" fill="#C87D20" />
              <path d="M-1.7,-3.6 L-1.4,-2.8 L-1.2,-3.6" stroke="#C87D20" strokeWidth="0.3" fill="none" />
              <line x1="-1.2" y1="0.8" x2="-1.4" y2="2.4" stroke="#8D5B10" strokeWidth="0.4" />
              <line x1="-0.6" y1="0.8" x2="-0.7" y2="2.4" stroke="#8D5B10" strokeWidth="0.4" />
              <line x1="0.6" y1="0.8" x2="0.6" y2="2.4" stroke="#8D5B10" strokeWidth="0.4" />
              <line x1="1.2" y1="0.8" x2="1.3" y2="2.4" stroke="#8D5B10" strokeWidth="0.4" />
            </g>

            <g transform="translate(4, -3.2)">
              <line x1="0" y1="0" x2="0" y2="2.4" stroke="#5D4037" strokeWidth="0.6" />
              <circle cx="0" cy="-0.6" r="2.1" fill="#1B5E20" />
              <circle cx="-0.8" cy="-0.2" r="1.3" fill="#2E7D32" />
              <circle cx="0.8" cy="-0.2" r="1.3" fill="#2E7D32" />
              <circle cx="0" cy="-1.4" r="1.4" fill="#388E3C" />
            </g>

            <g transform="translate(0, 5.2)">
              <path d="M-4.2,0.8 Q-2.5,-1.2 2.5,-0.2 Q4.2,0.4 4.5,1.8 Q2.5,2.6 -1,2 Q-3.5,1.6 -4.2,0.8 Z" fill="#DAA520" stroke="#B8860B" strokeWidth="0.3" />
              <ellipse cx="3.8" cy="1.2" rx="0.9" ry="1.4" fill="#8B6508" />
              <circle cx="3.2" cy="0.8" r="0.5" fill="#FFD700" />
              <circle cx="3.9" cy="0.4" r="0.45" fill="#FFD700" />
              <circle cx="4.5" cy="0.9" r="0.45" fill="#FFD700" />
              <circle cx="3.6" cy="1.6" r="0.45" fill="#FFD700" />
              <circle cx="4.3" cy="1.7" r="0.45" fill="#FFD700" />
              <circle cx="4.9" cy="1.3" r="0.4" fill="#FFD700" />
              <circle cx="3.8" cy="2.3" r="0.4" fill="#FFD700" />
              <circle cx="4.5" cy="2.4" r="0.35" fill="#FFD700" />
            </g>
          </g>

          <path d="M-8,-7.5 L8,-7.5 Q8.5,2 7,6 Q4,10 0,11.5 Q-4,10 -7,6 Q-8.5,2 -8,-7.5 Z" fill="none" stroke="#D4AF37" strokeWidth="0.7" />
          <line x1="-8" y1="1" x2="8" y2="1" stroke="#D4AF37" strokeWidth="0.6" />
          <line x1="0" y1="-7.5" x2="0" y2="1" stroke="#D4AF37" strokeWidth="0.6" />

          <g transform="translate(0, 9.5)">
            <path d="M-1.8,0 Q0,1.2 1.8,0 Q1,2 -1,2 Z" fill="#D91023" />
            <rect x="-0.6" y="0.2" width="1.2" height="1.4" fill="#FFFFFF" />
          </g>
        </g>
      </g>
    </svg>
  )
}
