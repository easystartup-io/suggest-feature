"use client"
import { useEffect } from 'react';

const WistiaEmbed = () => {
  useEffect(() => {
    const script1 = document.createElement('script');
    script1.src = "https://fast.wistia.com/embed/medias/5cby51y17q.jsonp";
    script1.async = true;

    const script2 = document.createElement('script');
    script2.src = "https://fast.wistia.com/assets/external/E-v1.js";
    script2.async = true;

    document.body.appendChild(script1);
    document.body.appendChild(script2);

    return () => {
      document.body.removeChild(script1);
      document.body.removeChild(script2);
    };
  }, []);

  return (
    <div className="wistia_responsive_padding" style={{ padding: '56.25% 0 0 0', position: 'relative' }}>
      <div className="wistia_responsive_wrapper" style={{ height: '100%', left: 0, position: 'absolute', top: 0, width: '100%' }}>
        <span className="wistia_embed wistia_async_5cby51y17q popover=true videoFoam=true" style={{ display: 'inline-block', height: '100%', position: 'relative', width: '100%' }}>
          &nbsp;
        </span>
      </div>
    </div>
  );
};

export default WistiaEmbed;
