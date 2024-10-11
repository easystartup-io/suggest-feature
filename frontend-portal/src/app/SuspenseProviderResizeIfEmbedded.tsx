"use client"
import { cn } from "@/lib/utils";
import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

export default function SuspenseProvider({ children }) {
  const [isEmbedded, setIsEmbedded] = useState(false)
  const searchParams = useSearchParams()

  useEffect(() => {
    setIsEmbedded(searchParams.get('isEmbedded'))
  }, []);

  return (
    <div className={cn("w-full",
      isEmbedded ? '' : 'max-w-screen-xl'
    )}>
      {children}
    </div>
  );
};
