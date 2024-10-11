"use client"
import { Calendar, CheckCircle, Circle, Eye, Loader, Play, XCircle } from "lucide-react"
import { PostCard } from "@/components/PostCard"
import { useEffect, useState } from "react"
import { useAuth } from "@/context/AuthContext"

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
  const { user } = useAuth()

  function refetchPost() {
    const host = window.location.host
    const protocol = window.location.protocol // http: or https:
    const path = user ? 'api/portal/auth/posts/fetch-post' : 'api/portal/unauth/posts/fetch-post';

    fetch(`${protocol}//${host}/${path}?boardSlug=${params.slug}&postSlug=${params.postSlug}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.priority) {
          data.priority = "Medium"
        }
        setPost(data)
      }).catch((e) => {
        console.log(e)
      })
  }

  useEffect(() => {
    if (params.postSlug) {
      refetchPost()
    }
  }, [params.postSlug, user])

  return (
    <main className="flex min-h-[calc(100vh_-_theme(spacing.16))] flex-col gap-4 p-4 pt-2 md:gap-8 md:p-10 md:pt-2 w-full">
      <div className="w-full">
        <PostCard params={params} post={post} refetch={refetchPost} />
      </div>
    </main>
  )
}

