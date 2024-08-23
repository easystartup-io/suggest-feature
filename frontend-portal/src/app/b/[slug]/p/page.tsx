"use client"

import { useRouter } from "next/navigation";

export default function Board({ params }) {
  const router = useRouter();
  router.push(`/b/${params.slug}`);
  return (
    <div>

    </div>
  )
}
