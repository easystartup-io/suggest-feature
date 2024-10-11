import { ImageResponse } from 'next/og';

export async function GET(req) {
  const { searchParams } = new URL(req.url);

  const logoUrl = searchParams.get('logo') || 'https://suggestfeature.com/logo-light.jpeg';
  const companyName = searchParams.get('company') || 'Suggest feature';
  const title = searchParams.get('title') || 'Feedback';

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          fontSize: 48,
          color: '#333',
          background: '#ffffff',
          width: '100%',
          height: '100%',
          padding: '40px',
        }}
      >
        {/* Render SVG as background if available */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
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
        <div style={{ fontSize: 24, color: '#888' }}>
          Powered by Suggest Feature
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}

