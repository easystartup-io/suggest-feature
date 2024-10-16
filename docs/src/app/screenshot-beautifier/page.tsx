import ImageEditor from "@/components/ImageEditor";
import { Metadata } from "next";


export const metadata: Metadata = {
  title: 'Free Online Screenshot Beautifier - Suggest Feature',
  description: 'Take your borin screenshots and make them pop with free Suggest Feature Screenshot Beautifier, all features absolutely free. Share them on social media and get more likes and shares. No sign up required. Full HD quality.',
  keywords: [
    'supabase',
    'screenshot',
    'screenshot editor',
    'beautify screenshot',
    'screenshot beautifier',
    'screenshot enhancer',
    'free',
    'high quality',
    'free online screenshot beautifier',
    'free screenshot editor',
    'screenshot editor free',
    'free screenshot enhancer',
    'free screenshot beautifier',
    'free online screenshot editor',
    'hd',
    'hd screenshot editor',
    'editable screenshot',
    'screen capture and edit',
    'screenshot and edit',
  ],
  openGraph: {
    title: 'Free Online Screenshot Beautifier - Suggest Feature',
    description: 'Take your borin screenshots and make them pop with free Suggest Feature Screenshot Beautifier, all features absolutely free. Share them on social media and get more likes and shares. No sign up required. Full HD quality. Free online screenshot editor',
    type: 'website',
    url: 'https://suggestfeature.com/screenshot-beautifier',
    images: [
      {
        url: 'https://assets.suggestfeature.com/screenshot-beautifier/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Free Online Screenshot Beautifier - Suggest Feature',
      }
    ]
  }
}


export default function Page() {
  return (
    <div className="mb-10">
      <a href="/" className="flex items-center p-4">
        <img src="/logo-light.jpeg" className="mr-3 h-6 md:h-9" alt="Suggest Feature Logo" />
        <span className="self-center text-xl font-semibold whitespace-nowrap dark:text-white">Suggest Feature - Screenshot Beautifier</span>
      </a>
      <ImageEditor />
    </div >
  );
}
