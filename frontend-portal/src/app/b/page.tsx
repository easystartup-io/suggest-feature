"use client"

import { useRouter } from "next/navigation";

export default function Board() {
  const router = useRouter();
  router.push('/');
  return (
    <div>

    </div>
  )
}
