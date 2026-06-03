import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'AstraNova — Explore the Universe'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #030712 0%, #0f0a2e 50%, #030712 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Stars */}
        {[...Array(60)].map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: Math.random() * 3 + 1,
              height: Math.random() * 3 + 1,
              borderRadius: '50%',
              background: 'white',
              left: `${(i * 37.3) % 100}%`,
              top: `${(i * 61.7) % 100}%`,
              opacity: 0.6,
            }}
          />
        ))}

        {/* Glow */}
        <div style={{
          position: 'absolute',
          width: 600, height: 300,
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(99,102,241,0.35), transparent 70%)',
          filter: 'blur(40px)',
        }} />

        {/* Logo */}
        <div style={{ fontSize: 72, marginBottom: 24 }}>🔭</div>

        {/* Title */}
        <div style={{
          fontSize: 72,
          fontWeight: 900,
          color: 'white',
          letterSpacing: '-2px',
          marginBottom: 16,
        }}>
          Astra<span style={{ color: '#818cf8' }}>Nova</span>
        </div>

        {/* Subtitle */}
        <div style={{ fontSize: 28, color: '#94a3b8', marginBottom: 40 }}>
          Explore the Universe
        </div>

        {/* Planet orbs */}
        <div style={{ display: 'flex', gap: 20 }}>
          {['#f97316','#fbbf24','#34d399','#f87171','#818cf8','#67e8f9'].map((color) => (
            <div key={color} style={{
              width: 20, height: 20, borderRadius: '50%',
              background: color,
              boxShadow: `0 0 20px ${color}`,
            }} />
          ))}
        </div>

        {/* Domain */}
        <div style={{ position: 'absolute', bottom: 40, color: '#4b5563', fontSize: 22 }}>
          astranova.uz
        </div>
      </div>
    ),
    size,
  )
}
