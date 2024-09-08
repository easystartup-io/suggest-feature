"use client"
import { Calendar, CheckCircle, Circle, Eye, Loader, Play, Search, XCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { useInit } from "@/context/InitContext"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import FileUploadButton from "@/components/FileButton"
import { useDebouncedCallback } from 'use-debounce';
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

const PostList = ({ posts, params }) => {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-2 px-4 pt-0 w-full">
      {posts && posts.length > 0 && posts.map((item) => (
        <button
          key={item.id}
          className={cn(
            "flex flex-col items-start gap-2 rounded-lg border p-3 text-left text-sm transition-all hover:bg-accent"
          )}
          onClick={() => {
            router.push(`/b/${params.slug}/p/${item.slug}`)
          }}
        >
          <div className="flex w-full flex-col gap-1">
            <div className="flex items-center" >
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
  )
}

export default function Dashboard({ params }) {
  const [posts, setPosts] = useState([]);
  const [tempPosts, setTempPosts] = useState([]);
  const { org, boards } = useInit()
  const router = useRouter();
  const [board, setBoard] = useState({})
  const { toast } = useToast()
  const { verifyLoginOrPrompt } = useAuth()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadedFileUrl, setUploadedFileUrl] = useState('')
  const [suggestedPostsScreen, setSuggestedPostsScreen] = useState(false)

  useEffect(() => {
    const host = window.location.host
    const protocol = window.location.protocol // http: or https:

    fetch(`${protocol}//${host}/api/portal/unauth/posts/get-posts-by-board?slug=${params.slug}`)
      .then((res) => res.json())
      .then((data) => {
        setPosts(data)
        setTempPosts(data)
      }).catch((e) => {
        console.log(e)
      })

    if (boards) {
      const b = boards.find((item) => item.slug === params.slug);
      setBoard(b)
    }
  }, [params, boards])

  const onSubmitPost = async (e) => {
    console.log(params)
    if (verifyLoginOrPrompt()) {
      return;
    }
    e.preventDefault();
    setLoading(true)
    try {
      const response = await fetch('/api/portal/auth/posts/add-post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title, description, boardSlug: params.slug })
      })
      const respData = await response.json();

      if (response.ok) {
        toast({
          title: 'Post created',
        })
        setSuggestedPostsScreen(false)
      } else {
        toast({
          title: respData.message,
          variant: 'destructive'
        })
      }

    } catch (err) {
      console.log(err)
    }

    setTimeout(() => {
      setLoading(false);
    }, 1000)
  }

  const searchOnDb = useDebouncedCallback((value) => {
    if (value.trim() === '') {
      setPosts(tempPosts)
      return
    }
    fetch(`/api/portal/unauth/posts/search-post`, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ boardSlug: params.slug, query: value })
    })
      .then((res) => res.json())
      .then((data) => {
        setPosts(data)
        setLoading(false)
      })
  }, 300);


  return (
    <main className="flex min-h-[calc(100vh_-_theme(spacing.16))] flex-col gap-4 p-4 md:gap-8 md:p-10 w-full">
      <div className="w-full">
        <div className="w-full">
          <div className="w-full">
            <div className="font-bold text-xl">
              {board && board.name}
            </div>
            <div className="w-full mt-6 grid md:grid-cols-3 gap-4">
              <div className="w-full">
                <div className="bg-white dark:bg-background flex flex-col p-6 rounded-lg gap-4 w-full">
                  <div>
                    <Label>
                      Title
                    </Label>
                    <Input disabled={loading} value={title} onChange={(e) => {
                      if (verifyLoginOrPrompt()) {
                        return;
                      }
                      setSuggestedPostsScreen(true)
                      setTitle(e.target.value)
                      searchOnDb(e.target.value)
                    }
                    }
                    />
                  </div>
                  <div>
                    <Label>
                      Description
                    </Label>
                    <Textarea disabled={loading} value={description} onChange={(e) => {
                      if (verifyLoginOrPrompt()) {
                        return;
                      }
                      setDescription(e.target.value)
                    }
                    }
                    />
                  </div>
                  <FileUploadButton uploading={uploading} setUploading={setUploading} uploadedFileUrl={uploadedFileUrl} setUploadedFileUrl={setUploadedFileUrl} />
                  <div className="flex justify-end w-full">
                    <Button onClick={onSubmitPost} disabled={loading}
                    >Submit</Button>
                  </div>
                </div>
              </div>
              <div className="md:col-span-2 w-full">
                {
                  suggestedPostsScreen &&
                  <div className="bg-background p-4 backdrop-blur supports-[backdrop-filter]:bg-background mb-2 rounded-lg px-8">
                    <div className="font-medium">
                      Similar posts - Add vote instead of creating new post
                    </div>
                  </div>
                }
                {
                  !suggestedPostsScreen &&
                  <div className="bg-background p-4 backdrop-blur supports-[backdrop-filter]:bg-background mb-2 rounded-lg px-8">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Search" className="pl-8"
                        onChange={(e) => {
                          searchOnDb(e.target.value)
                        }}
                      />
                    </div>
                  </div>
                }
                <div className="bg-white dark:bg-background p-4 rounded-lg md:col-span-2 w-full">
                  {
                    posts && <PostList posts={posts} params={params} />
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

