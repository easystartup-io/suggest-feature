"use client"
import { Calendar, CheckCircle, ChevronUp, Circle, Eye, File, FileAudio, FileImage, FileText, FileVideo, Loader, MessageSquare, Paperclip, Play, Search, XCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { useInit } from "@/context/InitContext"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"
import { useDebouncedCallback } from 'use-debounce';
import { useAuth } from "@/context/AuthContext"
import { Icons } from "@/components/icons"
import AttachmentComponent from "@/components/AttachmentComponent"
import MultiAttachmentUploadButton from "@/components/MultiAttachmentUploadButton"
import { SortOptionsComboBox } from "@/components/SortComboBox"
import { StatusFilterComboBox } from "@/components/StatusFilterComboBox"
import { Card, CardContent } from "@/components/ui/card"

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

const PostList = ({ posts, setPosts, params }) => {
  const router = useRouter();
  const { user, verifyLoginOrPrompt } = useAuth()

  const upVote = (upvote, id) => {
    if (verifyLoginOrPrompt()) {
      return;
    }

    fetch(`/api/portal/auth/posts/upvote-post?postId=${id}&upvote=${upvote}`, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json'
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setPosts((prev) => {
          return prev.map((item) => {
            if (item.id === id) {
              return {
                ...item,
                votes: data.votes,
                selfVoted: upvote
              }
            }
            return item
          })
        })
      })
  }

  return (
    <div className="flex flex-col gap-2 px-4 pt-0 w-full">
      {posts && posts.length > 0 && posts.map((item) => (
        <button
          key={item.id}
          className={cn(
            "flex items-center justify-between space-x-8 rounded-lg border dark:border-white p-3 text-left text-sm transition-all hover:bg-accent"
          )}
          onClick={() => {
            router.push(`/b/${params.slug}/p/${item.slug}`)
          }}
        >
          <div>
            <div className={cn(item.selfVoted && "bg-indigo-600 text-white",
              "flex items-center flex-col justify-center border dark:border-white px-4 py-2  text-lg rounded-xl cursor-pointer font-bold",
              "hover:shadow-indigo-600 dark:hover:shadow-red-600 hover:shadow"
            )}
              onClick={(e) => {
                e.stopPropagation()
                upVote(!item.selfVoted, item.id)
              }}
            >
              <ChevronUp />
              {item.votes}
            </div>
          </div>
          <div
            className={cn(
              "flex flex-col items-start gap-2 text-left w-full"
            )}
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
            <div className="flex items-center justify-end w-full text-xs text-muted-foreground">
              <MessageSquare className="w-3 h-3 inline-block mr-1 text-muted-foreground" />
              {item.commentCount}
            </div>
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
  const [board, setBoard] = useState({})
  const { toast } = useToast()
  const { user, verifyLoginOrPrompt, loading: userLoading } = useAuth()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [suggestedPostsScreen, setSuggestedPostsScreen] = useState(false)
  const [attachments, setAttachments] = useState([]);

  const [sortOptions, setSortOptions] = useState('trending');
  const [statusFilter, setStatusFilter] = useState('');

  function refetchBoards() {
    const host = window.location.host
    const protocol = window.location.protocol // http: or https:

    fetch(`${protocol}//${host}/api/portal/${user ? 'auth' : 'unauth'}/posts/get-posts-by-board?slug=${params.slug}&sortString=${sortOptions}&statusFilter=${statusFilter}`)
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
  }


  useEffect(() => {
    if (userLoading) {
      return
    }
    refetchBoards()
  }, [params, boards, user, userLoading, sortOptions, statusFilter]);

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
        body: JSON.stringify({
          title,
          description,
          boardSlug: params.slug,
          attachments: attachments
        })
      })
      const respData = await response.json();

      if (response.ok) {
        toast({
          title: 'Post created',
        })
        setSuggestedPostsScreen(false)
        refetchBoards();
        setTimeout(() => {
          setAttachments([])
          setTitle('')
          setDescription('')
          searchOnDb('')
        }, 1000)
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
    <main className="flex min-h-[calc(100vh_-_theme(spacing.16))] flex-col gap-4 p-4 pt-2 md:gap-8 md:p-10 md:pt-2 w-full">
      <div className="w-full">
        <div className="w-full">
          <div className="w-full">
            <div className="w-full mt-6 grid md:grid-cols-3 gap-4">
              <div>

                <Card
                  className="pt-4 border-0 shadow-none w-full"
                >
                  <CardContent className="space-y-4">
                    <div>
                      <h2 className="text-lg font-bold">{board.boardForm?.heading || 'Create post'}</h2>
                      <p className="text-gray-600">{board.boardForm?.description || ''}</p>
                    </div>
                    <div>
                      <Label htmlFor="previewTitle">{board.boardForm?.titleLabel || 'Title'}</Label>
                      <Input
                        disabled={loading}
                        key={"title"}
                        value={title}
                        onChange={(e) => {
                          if (verifyLoginOrPrompt()) {
                            return;
                          }
                          if (e.target.value.trim() === '') {
                            setSuggestedPostsScreen(false)
                          } else {
                            setSuggestedPostsScreen(true)
                          }
                          setTitle(e.target.value)
                          searchOnDb(e.target.value)
                        }}
                        id="previewTitle"
                        placeholder={board.boardForm?.titlePlaceholder} />
                    </div>
                    <div>
                      <Label htmlFor="previewDescription">{board.boardForm?.descriptionLabel || 'Description'}</Label>
                      <Textarea
                        id="previewDescription"
                        key={"description"}
                        disabled={loading}
                        value={description}
                        onChange={(e) => {
                          if (verifyLoginOrPrompt()) {
                            return;
                          }
                          setDescription(e.target.value)
                        }}
                        placeholder={board.boardForm?.descriptionPlaceholder} className="min-h-[100px]" />
                    </div>

                    <AttachmentComponent
                      attachments={attachments}
                      setAttachments={setAttachments}
                      uploading={uploading}
                      setUploading={setUploading}
                      allowDelete={true}
                    />
                    <div className="flex justify-end space-x-2">

                      <MultiAttachmentUploadButton
                        attachments={attachments}
                        setAttachments={setAttachments}
                        uploading={uploading}
                        setUploading={setUploading}
                        loading={loading}
                      />
                      <Button variant="default"
                        onClick={onSubmitPost}
                        disabled={loading || uploading}
                      >
                        {(loading || uploading) && <Icons.spinner
                          className={
                            cn("h-4 w-4 animate-spin",
                              loading ? 'mx-4' : 'mr-2')
                          } />}
                        {
                          uploading ? 'Uploading...' : (loading ? '' : board.boardForm?.buttonText || 'Submit')
                        }
                      </Button>
                    </div>
                  </CardContent>
                </Card>
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
                  <div className="flex items-center justify-between bg-background p-4 backdrop-blur supports-[backdrop-filter]:bg-background mb-2 rounded-lg px-8 space-x-2">
                    <div className="relative w-full">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Search" className="pl-8"
                        onChange={(e) => {
                          searchOnDb(e.target.value)
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-end space-x-2">
                      <StatusFilterComboBox postsStatusFilter={statusFilter} setPostsStatusFilter={setStatusFilter} />
                      <SortOptionsComboBox postsSort={sortOptions} setPostsSort={setSortOptions} />
                    </div>
                  </div>
                }
                <div className="bg-white dark:bg-background p-4 rounded-lg md:col-span-2 w-full">
                  {
                    posts && <PostList posts={posts} setPosts={setPosts} params={params} />
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

