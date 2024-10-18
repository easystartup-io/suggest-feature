"use client"
import React, { useEffect } from 'react';
import Script from 'next/script';

const WistiaVideo = ({ videoId = 'uhvbidxlu9', title = 'Intro to Suggest Feature Video' }) => {
  useEffect(() => {
    if (window.Wistia && window._wq) {
      window._wq = window._wq || [];
      window._wq.push({
        id: videoId,
        onReady: function (video) {
          // You can add any custom behavior here when the video is ready
          console.log("Video " + videoId + " is ready");
        }
      });
    }
  }, [videoId]);

  return (
    <>
      <div className="wistia_responsive_padding" style={{ padding: '56.25% 0 0 0', position: 'relative' }}>
        <div className="wistia_responsive_wrapper" style={{ height: '100%', left: 0, position: 'absolute', top: 0, width: '100%' }}>
          <iframe
            src={`https://fast.wistia.net/embed/iframe/${videoId}?seo=false&videoFoam=true`}
            title={title}
            allow="autoplay; fullscreen"
            allowtransparency="true"
            frameBorder="0"
            scrolling="no"
            className="wistia_embed"
            name="wistia_embed"
            width="100%"
            height="100%"
          ></iframe>
        </div>
      </div>
      <Script
        src="https://fast.wistia.net/assets/external/E-v1.js"
        strategy="lazyOnload"
        onLoad={() => {
          console.log('Wistia script has loaded');
        }}
      />
    </>
  );
};

export default WistiaVideo;
