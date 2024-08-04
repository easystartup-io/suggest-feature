"use client"
import { useInit } from "@/context/InitContext";

export default function Custom404() {
  const { org } = useInit();
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-b from-blue-400 to-blue-300 text-center w-full h-full">
      <div className="text-8xl font-bold text-white">404</div>
      <div className="mt-4 text-2xl font-medium text-white">
        Oops! Page not found!
      </div>
      <div className="relative w-24 h-24 mt-8">
      </div>
      <div className="mt-8 text-lg text-white">
        <a className="hover:text-indigo-500" href="/">Go Back to Homepage</a>
      </div>
    </div>
  );
}

