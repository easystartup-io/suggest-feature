"use client"
import { Calendar, CheckCircle, Circle, Eye, Loader, Play, XCircle } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useInit } from "@/context/InitContext"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { useTheme } from "next-themes"

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

const PostList = ({ posts }) => {
  const router = useRouter();

  return (
    <ScrollArea className="h-full overflow-y-auto">
      <div className="flex flex-col gap-2 px-4 pt-0">
        {posts && posts.length > 0 && posts.map((item) => (
          <button
            key={item.id}
            className={cn(
              "flex flex-col items-start gap-2 rounded-lg border p-3 text-left text-sm transition-all hover:bg-accent"
            )}
            onClick={() => {
              router.push(`/b/${item.boardSlug}/p/${item.slug}`)
            }}
          >
            <div className="flex w-full flex-col gap-1">
              <div className="flex items-center">
                <div className="flex items-center gap-2">
                  <div className="font-semibold">
                    {(() => {
                      const st = statusConfig[item.status || 'OPEN'] || statusConfig['OPEN'];
                      return st.icon
                    })()
                    }
                    {item.title}
                  </div>
                </div>
                <div
                  className={cn(
                    "ml-auto text-xs",
                    "text-muted-foreground"
                  )}
                >
                  {formatDistanceToNow(new Date(item.createdAt), {
                    addSuffix: true,
                  })}
                  {/* <Badge className="ml-2">{item.votes}</Badge> */}
                </div>
              </div>
            </div>
            <div className="line-clamp-2 text-xs text-muted-foreground">
              {item.description.substring(0, 300)}
            </div>
          </button>
        ))}
      </div>
    </ScrollArea>
  )
}

export default function Dashboard({ params }) {
  const [posts, setPosts] = useState([]);
  const { org, boards } = useInit()
  const router = useRouter();
  const searchParams = useSearchParams()
  const roadmapOnly = searchParams.get('roadmapOnly')
  const theme = searchParams.get('theme')
  const { setTheme } = useTheme()

  useEffect(() => {
    if (theme) {
      setTheme(theme)
    }
  }, [theme])

  useEffect(() => {
    const host = window.location.host
    const protocol = window.location.protocol // http: or https:

    fetch(`${protocol}//${host}/api/portal/unauth/posts/get-roadmap-posts`)
      .then((res) => res.json())
      .then((data) => {
        if (Object.keys(data).length === 0) {
        } else {
          setPosts(data)
        }
      }).catch((e) => {
        console.log(e)
      })
  }, [params]);

  return (
    <main className="flex min-h-[calc(100vh_-_theme(spacing.16))] flex-col gap-4 p-4 pt-2 md:gap-8 md:p-10 md:pt-6 w-full">
      <div className="w-full items-center justify-center flex">
        <div className="w-full">
          <div className="w-full">
            {
              !roadmapOnly &&
              <div className="flex items-center font-semibold pb-4 text-lg">
                Boards
              </div>
            }
            {
              !roadmapOnly &&
              <div className="grid md:grid-cols-3 gap-6 w-full md:justify-between">
                {boards && boards.map((board) => {
                  return (
                    <div key={board.id} className="bg-white dark:bg-background border border-gray-100 dark:border-0 rounded-lg p-4 w-full cursor-pointer hover:bg-gray-100" onClick={() => {
                      router.push(`/b/${board.slug}`)
                    }}>
                      <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold">{board.name}</h2>
                        <Badge>{board.postCount || '0'}</Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            }
            {
              org && ((org.roadmapSettings && org.roadmapSettings.enabled) || (!org.roadmapSettings)) && <div className="w-full h-full">
                {
                  !roadmapOnly &&
                  <div className="flex items-center font-semibold pt-8 text-lg">
                    {(org && org.roadmapSettings && org.roadmapSettings.title) || 'Roadmap'}
                  </div>
                }
                <div className="grid md:grid-cols-3 gap-6 mt-6">
                  {
                    posts && Object.keys(posts).map((key) => {
                      return (<div key={key} className="bg-white dark:bg-background border border-gray-100 dark:border-0 rounded-lg p-4 flex flex-1 flex-col h-[calc(max(100vh/2,24rem))]">
                        <div className="flex items-center justify-center font-semibold pb-4">
                          {key} {posts[key].length > 0 ? `(${posts[key].length})` : ''}
                        </div>
                        {posts[key] && posts[key].length > 0 ? <PostList posts={posts[key]} /> : (
                          <div className="flex flex-col items-center justify-center h-full">
                            <div className="text-2xl font-semibold text-muted-foreground">No posts found</div>
                          </div>
                        )}
                      </div>
                      );
                    })
                  }
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    </main>
  )
}
