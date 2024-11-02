"use client";
import { useSearchParams } from 'next/navigation';
import { Suspense, useMemo } from 'react';

// Function to generate random color
const randomColor = () => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

// Function to get random angle
const randomAngle = () => Math.floor(Math.random() * 360);

function OgImagePage() {
  const searchParams = useSearchParams();
  const title = searchParams.get('title') || 'Feedback';

  // Generate gradient colors and angle using useMemo to keep them stable
  const gradient = useMemo(() => ({
    color1: randomColor(),
    color2: randomColor(),
    angle: randomAngle()
  }), []);

  const gradientStyle = {
    background: `linear-gradient(${gradient.angle}deg, ${gradient.color1}, ${gradient.color2})`
  };

  return (
    <div
      className="flex flex-col justify-between p-12 w-[1200px] h-[630px]"
      style={gradientStyle}
    >
      <div className="flex flex-col items-start">
        <h2 className="text-8xl mt-5 text-white font-bold">{title}</h2>
      </div>
      <div className="flex items-center">
        <div className="bg-white/90 text-gray-900 px-6 py-3 font-bold text-2xl rounded-lg hover:bg-white transition-colors">
          Read more
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense>
      <OgImagePage />
    </Suspense>
  );
}
