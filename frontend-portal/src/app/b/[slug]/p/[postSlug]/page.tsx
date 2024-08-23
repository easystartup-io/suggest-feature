"use client"
import { Calendar, CheckCircle, Circle, Eye, Loader, Play, XCircle } from "lucide-react"

import { PostCard } from "@/components/PostCard"
import { useInit } from "@/context/InitContext"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export const statusConfig = {
  "OPEN": {
    icon: <Circle className="w-4 h-4 inline-block mr-2 text-blue-500" />,
    label: "OPEN"
  },
  "UNDER REVIEW": {
    icon: <Eye className="w-4 h-4 inline-block mr-2 text-yellow-500" />,
    label: "UNDER REVIEW"
  },
  "PLANNED": {
    icon: <Calendar className="w-4 h-4 inline-block mr-2 text-blue-500" />,
    label: "PLANNED"
  },
  "IN PROGRESS": {
    icon: <Loader className="w-4 h-4 inline-block mr-2 text-orange-500" />,
    label: "IN PROGRESS"
  },
  "LIVE": {
    icon: <Play className="w-4 h-4 inline-block mr-2 text-green-500" />,
    label: "LIVE"
  },
  "COMPLETE": {
    icon: <CheckCircle className="w-4 h-4 inline-block mr-2 text-green-500" />,
    label: "COMPLETE"
  },
  "CLOSED": {
    icon: <XCircle className="w-4 h-4 inline-block mr-2 text-red-500" />,
    label: "CLOSED"
  }
};

export default function Dashboard({ params }) {
  const [post, setPost] = useState([]);
  const { org, boards } = useInit()
  const router = useRouter();
  const [board, setBoard] = useState({})

  useEffect(() => {
    const host = window.location.host
    const protocol = window.location.protocol // http: or https:

    fetch(`${protocol}//${host}/api/portal/unauth/posts/fetch-post/?boardSlug=${params.slug}&postSlug=${params.postSlug}`)
      .then((res) => res.json())
      .then((data) => {
        setPost(data)
      }).catch((e) => {
        console.log(e)
      })

    if (boards) {
      const b = boards.find((item) => item.slug === params.slug);
      setBoard(b)
    }
  }, [params, boards])

  return (
    <main className="flex min-h-[calc(100vh_-_theme(spacing.16))] flex-col gap-4 bg-muted/40 p-4 md:gap-8 md:p-10 w-full">
      <div className="w-full max-w-screen-xl">
        <div className="w-full">
          <div className="mx-auto w-full max-w-6xl">
            <PostCard params={params} post={post} />
          </div>
        </div>
      </div>
    </main>
  )
}

