import ImageEditor from "@/components/ImageEditor";
import { Metadata } from "next";


export const metadata: Metadata = {
  title: 'Screenshot Beautifier - Suggest Feature',
  description: 'Take your borin screenshots and make them pop with free Suggest Feature Screenshot Beautifier. Share them on social media and get more likes and shares.',
  keywords: [
    'supabase',
    'screenshot',
    'screenshot editor',
    'beautify screenshot',
    'screenshot beautifier',
    'screenshot enhancer',
  ]
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
