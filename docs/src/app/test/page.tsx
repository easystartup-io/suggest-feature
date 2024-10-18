"use client"
import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    SuggestFeature.init({
      domain: 'https://local-dev-test-suggest-feature.easystartup.io',
      position: 'bottom',
      align: 'left',
      theme: 'light' // options: light (default), dark
    });
  }, [])

  return (
    <div>
      <meta name="robots" content="noindex,nofollow" />
      Hello
      <script src="http://localhost:3002/js/changelog.js" async></script>
      <button data-sf-changelog>Changelog</button>
    </div>
  );
}
