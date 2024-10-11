
import { ImageResponse } from 'next/og';

export async function GET(req) {
  const { searchParams } = new URL(req.url);

  // Extract dynamic parameters from the query string.
  const logoUrl = searchParams.get('logo') || 'https://yourdomain.com/default-logo.svg';
  const companyName = searchParams.get('company') || 'Your Company Name';
  const title = searchParams.get('title') || 'Your Title Here';


  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 48,
          color: '#333',
          background: '#ffffff',
          width: '100%',
          height: '100%',
          padding: '40px',
          textAlign: 'center',
        }}
      >
        {/* Render SVG as background if available */}
        <img
          src={logoUrl}
          style={{
            width: 100,
            height: 100,
            marginBottom: 20,
          }}
        />
        <div style={{ fontWeight: 'bold', fontSize: 60 }}>
          {companyName}
        </div>
        <div style={{ marginTop: 20, fontSize: 36, color: '#555' }}>
          {title}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}

