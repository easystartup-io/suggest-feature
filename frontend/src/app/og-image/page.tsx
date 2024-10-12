"use client";
import { useSearchParams } from 'next/navigation';

export default function OgImagePage() {
  const searchParams = useSearchParams();
  const logo = searchParams.get('logo') || 'https://suggestfeature.com/logo-light.jpeg';
  const company = searchParams.get('company') || 'Suggest Feature';
  const title = searchParams.get('title') || 'Feedback';

  return (
    <div className="flex flex-col justify-between p-12 bg-white w-[1200px] h-[630px] border border-gray-300">
      <div className="flex flex-col items-start">
        {logo && (
          <img
            src={logo}
            alt="Company Logo"
            width={100}
            height={100}
            className="mb-5"
          />
        )}
        <h1 className="text-6xl font-bold text-gray-800">{company}</h1>
        <h2 className="text-4xl mt-5 text-gray-600">{title}</h2>
      </div>
      <div className="text-2xl text-gray-500">
        Powered by Suggest Feature
      </div>
    </div>
  );
}

