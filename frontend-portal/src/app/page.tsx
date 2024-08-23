"use client"
import { Calendar, CheckCircle, Circle, CircleUser, Eye, Loader, Play, XCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { useEffect, useState } from "react"
import ModeToggle from "./ModeToggle"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"

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

function Custom404() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-b from-blue-400 to-blue-300 text-center">
      <div className="text-8xl font-bold text-white">404</div>
      <div className="mt-4 text-2xl font-medium text-white">
        Oops! Page not found!
      </div>
      <div className="relative w-24 h-24 mt-8">
      </div>
      <div className="mt-8 text-lg text-white underline">
        <a href="https://suggestfeature.com">Go Back to Suggest Feature</a>
      </div>
    </div>
  );
}

const PostList = ({ posts }) => {

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
              // go to post page
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
  const [org, setOrg] = useState({});
  const [boards, setBoards] = useState([]);
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState(false);




  useEffect(() => {
    const host = window.location.host
    const protocol = window.location.protocol // http: or https:
    fetch(`${protocol}//${host}/api/portal/unauth/posts/init-page`)
      .then((res) => res.json())
      .then((data) => {
        if (Object.keys(data).length === 0) {
          setError(true)
        } else {
          setOrg(data.org)
          setBoards(data.boards)
        }
      }).catch((e) => {
        setError(true)
        console.log(e)
      })

    fetch(`${protocol}//${host}/api/portal/unauth/posts/get-posts`)
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

  if (!org || error) {
    return <Custom404 />
  }

  return (
    <div className="flex h-full w-full flex-col items-center">
      <div className="w-full max-w-screen-xl items-center justify-center">
        <header className="flex h-16 items-center justify-between gap-4 bg-background px-4 md:px-6 w-full">
          <div>
            <h1 className="text-xl font-semibold">{org.name}</h1>
          </div>
          <div className="flex items-center justify-end gap-4 md:ml-auto md:gap-2 lg:gap-4">
            <ModeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="icon" className="rounded-full">
                  <CircleUser className="h-5 w-5" />
                  <span className="sr-only">Toggle user menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuItem>Support</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
      </div>
      <Separator />
      <main className="flex min-h-[calc(100vh_-_theme(spacing.16))] flex-col gap-4 bg-muted/40 p-4 md:gap-8 md:p-10 w-full">
        <div className="w-full max-w-screen-xl">
          <div className="w-full">
            <div className="mx-auto grid w-full max-w-6xl items-start">
              <div className="flex items-center font-semibold pb-4 text-lg">
                Boards
              </div>
              <div className="grid md:grid-cols-3 gap-6 w-full md:justify-between">
                {boards && boards.map((board) => {
                  return (
                    <div key={board.id} className="bg-white dark:bg-background border border-gray-100 dark:border-0 rounded-lg p-4 w-full">
                      <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold">{board.name}</h2>
                        <Badge>{board.postCount}</Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center font-semibold pt-8 text-lg">
                Roadmap
              </div>
              <div className="grid md:grid-cols-3 gap-6 w-full justify-between mt-6">
                {
                  posts && Object.keys(posts).map((key) => {
                    return (<div key={key} className="bg-white dark:bg-background border border-gray-100 dark:border-0 rounded-lg p-4 flex flex-1 flex-col h-full h-[calc(100vh/2)]">
                      <div className="flex items-center justify-center font-semibold pb-4">
                        {key} {posts[key].length > 0 ? `(${posts[key].length})` : ''}
                        {/* {key} {posts[key].length > 0 ? <Badge className="mx-2">{posts[key].length}</Badge> : ''} */}
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
          </div>
        </div>
      </main>
    </div>
  )
}
