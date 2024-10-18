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
      <script src="http://localhost:3002/js/changelog.js"></script>
      {/* <button data-sf-changelog */}
      {/*   style={{ backgroundColor: 'blue', color: 'white', padding: '10px', borderRadius: '5px', cursor: 'pointer' }} */}
      {/* > */}
      {/*   View Changelog */}
      {/* </button> */}
      <button data-sf-changelog>Changelog</button>

    </div>
  );
}
