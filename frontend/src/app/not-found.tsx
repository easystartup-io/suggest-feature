"use client";
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function NotFound() {
  const router = useRouter();

  // Need to do this because else giving error that location is not defined. Might be because trying to run router before its mounted
  useEffect(() => {
    if (typeof window !== "undefined") {
      router.push('/');
    }
  }, [router]);

  return <div></div>;
}

