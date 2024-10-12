"use client"
import { useEffect, useState } from 'react';

export default function PopulateOgUrl() {
  const [ogUrl, setOgUrl] = useState('')

  useEffect(() => {
    setOgUrl(window.location.href)
  }, [])


  if (!ogUrl) {
    return null;
  }

  return <div>
    <meta property="og:url" content={ogUrl} />
  </div>;
}
