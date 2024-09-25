"use client"

import AttachmentComponent from "@/components/AttachmentComponent";
import { Icons } from "@/components/icons";
import Loading from "@/components/Loading";
import MultiAttachmentUploadButton from "@/components/MultiAttachmentUploadButton";
import { FullScreenPostDialog, PostCard } from "@/components/post/PostCard";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import withAuth from '@/hoc/withAuth';
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import Cookies from 'js-cookie';
import { ArrowUpDown, Calendar, Check, CheckCircle, ChevronsUpDown, ChevronUp, Circle, Eye, Filter, Loader, MessageSquare, Play, Search, Settings, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useDebouncedCallback } from 'use-debounce';
import { SortOptionsComboBox } from "@/components/SortComboBox";
import { StatusFilterComboBox } from "@/components/StatusFilterComboBox";
import { Badge } from "../ui/badge";

export const statusConfig = {
  "OPEN": {
    icon: <Circle className="w-4 h-4 inline-block mr-2 text-blue-500" />,
    label: "OPEN",
    bgColor: "bg-blue-300 dark:bg-blue-800"
  },
  "UNDER REVIEW": {
    icon: <Eye className="w-4 h-4 inline-block mr-2 text-yellow-500" />,
    label: "UNDER REVIEW",
    bgColor: "bg-yellow-300 dark:bg-yellow-800"
  },
  "PLANNED": {
    icon: <Calendar className="w-4 h-4 inline-block mr-2 text-blue-500" />,
    label: "PLANNED",
    bgColor: "bg-blue-300 dark:bg-blue-800"
  },
  "IN PROGRESS": {
    icon: <Loader className="w-4 h-4 inline-block mr-2 text-orange-500" />,
    label: "IN PROGRESS",
    bgColor: "bg-orange-300 dark:bg-orange-800"
  },
  "LIVE": {
    icon: <Play className="w-4 h-4 inline-block mr-2 text-green-500" />,
    label: "LIVE",
    bgColor: "bg-green-300 dark:bg-green-800"
  },
  "COMPLETE": {
    icon: <CheckCircle className="w-4 h-4 inline-block mr-2 text-green-500" />,
    label: "COMPLETE",
    bgColor: "bg-green-300 dark:bg-green-800"
  },
  "CLOSED": {
    icon: <XCircle className="w-4 h-4 inline-block mr-2 text-red-500" />,
    label: "CLOSED",
    bgColor: "bg-red-300 dark:bg-red-800"
  }
};

function AddPostDialog({ params, refetch, allBoards }) {
  const [isLoading, setLoading] = useState(false)
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState('OPEN');

  const [similarPostData, setSimilarPostData] = useState([])
  const [loadingSimilarPosts, setLoadingSimilarPosts] = useState(false)

  const [uploading, setUploading] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [boardSlug, setBoardSlug] = useState(params.id || (allBoards && allBoards.length > 0 && allBoards[0].slug))
  const [board, setBoard] = useState(null)

  const { toast } = useToast()

  useEffect(() => {
    if (!boardSlug || !allBoards) return;
    setBoard(allBoards.find((board) => board.slug === boardSlug))
  }, [allBoards, boardSlug])

  const searchOnDb = useDebouncedCallback((value) => {
    if (value.trim() === '') {
      setSimilarPostData([])
      return
    }
    setLoadingSimilarPosts(true)
    fetch(`/api/auth/posts/search-post`, {
      method: "POST",
      headers: {
        "x-org-slug": params.slug,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ boardSlug: params.id, query: value })
    })
      .then((res) => res.json())
      .then((data) => {
        setSimilarPostData(data)
        setLoadingSimilarPosts(false)
      })
  }, 300);

  const onSubmit = async (e) => {
    console.log(params)
    e.preventDefault();
    setLoading(true)
    try {
      const response = await fetch('/api/auth/posts/create-post', {
        method: 'POST',
        headers: {
          "x-org-slug": params.slug,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title,
          description,
          boardSlug: boardSlug || params.id,
          status,
          attachments: attachments
        })
      })
      const respData = await response.json();

      if (response.ok) {
        setIsOpen(false)
        toast({
          title: 'Post created',
        })
        refetch();
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

  return (
    <Dialog open={isOpen} onClose={() => setIsOpen(false)} onOpenChange={setIsOpen} >
      <DialogTrigger asChild>
        <Button onClick={() => setIsOpen(true)}>Add Post</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[900px] ">
        <ScrollArea className="max-h-[calc(100dvh-3rem)]">
          <DialogHeader className="px-2">
            <DialogTitle>{board?.boardForm?.heading || 'Create post'}</DialogTitle>
            <DialogDescription>
              {board?.boardForm?.description || ''}
            </DialogDescription>
          </DialogHeader>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-1">
              <div className="grid gap-4 py-4 px-2">
                <div className="grid gap-4">
                  <Label htmlFor="title" >
                    {board?.boardForm?.titleLabel || 'Title'}
                  </Label>
                  <Input
                    id="title"
                    value={title}
                    placeholder={board?.boardForm?.titlePlaceholder || ''}
                    onChange={(e) => {
                      searchOnDb(e.target.value)
                      setTitle(e.target.value)
                    }
                    }
                    disabled={isLoading}
                    className="col-span-3"
                  />
                </div>
                <div className="grid gap-4">
                  <Label htmlFor="description" >
                    {board?.boardForm?.descriptionLabel || 'Description'}
                  </Label>
                  <Textarea
                    id="description"
                    value={description}
                    placeholder={board?.boardForm?.descriptionPlaceholder || ''}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={isLoading}
                    className="col-span-3"
                  />
                </div>
                <div className="grid gap-4">
                  <Label htmlFor="status" >
                    Status
                  </Label>
                  <Select onValueChange={
                    val => {
                      setStatus(val)
                    }} value={status}>
                    <SelectTrigger
                      id="status"
                      aria-label="Select status"
                    >
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(statusConfig).map((key) => {
                        const status = statusConfig[key];
                        return (
                          <SelectItem key={key} value={key}>
                            {status.icon}
                            {status.label}
                          </SelectItem>
                        )
                      })
                      }
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-4">
                  <Label htmlFor="status" >
                    Board
                  </Label>
                  <Select onValueChange={
                    val => {
                      setBoardSlug(val)
                    }} value={boardSlug}>
                    <SelectTrigger
                      id="board"
                      aria-label="Select board"
                    >
                      <SelectValue placeholder="Board" />
                    </SelectTrigger>
                    <SelectContent>
                      {allBoards && allBoards.map((board) => {
                        return (
                          <SelectItem key={board.slug} value={board.slug}>
                            {board.name}
                          </SelectItem>
                        )
                      })
                      }
                    </SelectContent>
                  </Select>
                </div>

                <AttachmentComponent attachments={attachments} setAttachments={setAttachments} allowDelete={true} />

                <div className="flex items-center justify-end">

                  <MultiAttachmentUploadButton
                    attachments={attachments}
                    setAttachments={setAttachments}
                    uploading={uploading}
                    setUploading={setUploading}
                    loading={isLoading}
                  />

                </div>
              </div>
            </div>


            <div className="md:col-span-1">
              <div className="grid px-2">
                <Label className="py-4">
                  Similar posts
                </Label>
                <ScrollArea className="h-[calc(65dvh-3rem)] overflow-y-hidden w-full">
                  {
                    loadingSimilarPosts && (
                      <div className="flex items-center justify-center h-full w-full">
                        <Icons.spinner className="h-12 w-12 animate-spin mt-12" />
                      </div>
                    )
                  }
                  {
                    !loadingSimilarPosts && similarPostData.length > 0 && (
                      <div className="bg-background/95 p-4 pt-0 pl-0 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                        <div className="flex flex-col gap-2">
                          {similarPostData.map((item) => (
                            <div key={item.id} className="flex items-center gap-2 rounded-lg border p-3 text-left text-sm transition-all hover:bg-accent">
                              <div className="font-semibold">
                                {item.title}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(item.createdAt), {
                                  addSuffix: true,
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  }
                </ScrollArea>
              </div>
            </div>
          </div>
          <DialogFooter className="px-2 mt-4">
            <Button type="submit" onClick={onSubmit}
              disabled={isLoading || uploading || title.trim() === ''}
            >
              {(uploading || isLoading) && (
                <Icons.spinner

                  className={
                    cn("h-4 w-4 animate-spin",
                      isLoading ? 'mx-4' : 'mr-2')
                  }
                />
              )}
              {
                uploading ? 'Uploading...' : (isLoading ? '' : board?.boardForm?.buttonText || 'Submit')
              }
            </Button>
          </DialogFooter>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}


const PostsScreen: React.FC = ({ params }) => {
  const { toast } = useToast()

  const [data, setData] = useState(null)
  const [tempData, setTempData] = useState([])
  const [isLoading, setLoading] = useState(true)
  const [defaultValues, setDefaultValues] = useState({})
  const form = useForm({ defaultValues })
  const { reset } = form; // Get reset function from useForm
  const [currentPost, setCurrentPost] = useState(null)
  const [board, setBoard] = useState(null)
  const router = useRouter()
  const layout = Cookies.get('react-resizable-panels:layout:sf:boards');
  const [allPostsScreen, setAllPostsScreen] = useState(false)
  const [allBoards, setAllBoards] = useState([])

  const [postsSort, setPostsSort] = useState('trending')
  const [postsStatusFilter, setPostsStatusFilter] = useState('')
  const [selectedBoardSlug, setSelectedBoardSlug] = useState(params.id || 'all');

  const defaultLayout = layout ? JSON.parse(layout) : [35, 65]

  const refetchPosts = async () => {
    fetch(`/api/auth/posts/fetch-posts`, {
      method: "POST",
      headers: {
        "x-org-slug": params.slug,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        boardSlug: selectedBoardSlug === 'all' ? (params.id ? params.id : undefined) : selectedBoardSlug,
        sortString: postsSort,
        statusFilter: postsStatusFilter
      })
    })
      .then((res) => res.json())
      .then((data) => {
        setData(data)
        setTempData(data)
        if (data && data.length > 0 && window.innerWidth > 768) {
          setCurrentPost({
            post: data[0],
            id: data[0].id
          })
        }
        reset(data)
        setLoading(false)
      })
  }

  useEffect(() => {
    refetchPosts();
  }, [postsSort, postsStatusFilter, selectedBoardSlug])

  useEffect(() => {
    refetchPosts();
    const fetchBoards = async () => {

      try {

        const boardResponse = await fetch(`/api/auth/boards/fetch-boards`, {
          headers: {
            "x-org-slug": params.slug
          }
        });
        if (boardResponse.ok) {
          const boards = await boardResponse.json();
          setAllBoards(boards)

          boards.forEach((board) => {
            if (params.id && board.slug === params.id) {
              setBoard(board)
            }
          });
        }
      } catch (err) {
        console.log(err)
      }
    }

    if (!params.id || params.id.trim() === '') {
      setAllPostsScreen(true)
    }

    fetchBoards();
  }, [params.id, params.slug, reset])


  const searchOnDb = useDebouncedCallback((value) => {
    if (value.trim() === '') {
      setData(tempData)
      if (tempData && tempData.length > 0 && window.innerWidth > 768) {
        setCurrentPost({
          post: tempData[0],
          id: tempData[0].id
        })
      }
      return
    }
    fetch(`/api/auth/posts/search-post`, {
      method: "POST",
      headers: {
        "x-org-slug": params.slug,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        boardSlug: selectedBoardSlug === 'all' ? (params.id ? params.id : undefined) : selectedBoardSlug,
        query: value
      })
    })
      .then((res) => res.json())
      .then((data) => {
        setData(data)
        if (data && data.length > 0 && window.innerWidth > 768) {
          setCurrentPost({
            post: data[0],
            id: data[0].id
          })
        }
        reset(data)
        setLoading(false)
      })
  }, 300);

  const deletePostFromView = (id) => {
    const currentPostIndex = data.findIndex((item) => item.id === id)
    // Delete post from data list where id matches and set the currentPost to previous one if it exists else no post
    const newData = data && data.filter((item) => item.id !== id)
    if (newData && newData.length > 0) {
      setData(newData)
    } else {
      setData([])
    }

    if (currentPostIndex > 0 && newData && newData.length > 0) {
      setCurrentPost({
        post: newData[currentPostIndex - 1],
        id: newData[currentPostIndex - 1].id
      })
    } else if (newData && newData.length > 0) {
      setCurrentPost({
        post: newData[0],
        id: newData[0].id
      })
    } else if (newData && newData.length === 0) {
      setCurrentPost(null)
    }

  }

  if (!data) return <Loading />


  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 h-full">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">{(board && board.name && `Board - ${board.name}`) || 'All posts'}</h1>
        <div className="flex gap-2 items-center">
          <Select value={selectedBoardSlug} onValueChange={(val) => {
            if (params.id) {
              router.push(`/${params.slug}/boards/${val}/posts`)
            }
            setSelectedBoardSlug(val)
          }}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Board" />
            </SelectTrigger>
            <SelectContent>
              {
                params.id ? null :
                  <SelectItem value="all">All Boards</SelectItem>
              }
              {allBoards.map((board) => (
                <SelectItem key={board.slug} value={board.slug}>
                  {board.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {
            allPostsScreen ? null :
              <Button onClick={() => router.push(`/${params.slug}/boards/${params.id}`)}
                variant="destructive"
                size="icon"
              >
                <Settings />
              </Button>
          }
          <AddPostDialog params={params} refetch={refetchPosts} allBoards={allBoards} />
        </div>
      </div>
      <div
        className="rounded-lg border border-dashed shadow-sm h-[calc(100vh-10rem)] "
      >
        <ResizablePanelGroup
          direction="horizontal"
          onLayout={(sizes: number[]) => {
            document.cookie = `react-resizable-panels:layout:sf:boards=${JSON.stringify(
              sizes
            )}; path=/`
          }}
          className="h-full flex-1"
        >
          <ResizablePanel defaultSize={defaultLayout[0]} minSize={30} className="">
            <ScrollArea className="pb-4 h-full overflow-y-auto">
              <div className="bg-background/95 p-4 pb-0 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search" className="pl-8"
                    onChange={(e) => {
                      searchOnDb(e.target.value)
                    }}
                  />
                </div>
              </div>
              <div className="flex items-center justify-end px-4 my-2 space-x-2">
                <StatusFilterComboBox postsStatusFilter={postsStatusFilter} setPostsStatusFilter={setPostsStatusFilter} />
                <SortOptionsComboBox postsSort={postsSort} setPostsSort={setPostsSort} />
              </div>
              <div className="flex flex-col gap-2 px-4 pt-0">
                {data && data.length > 0 && data.map((item) => (
                  <button
                    key={item.id}
                    className={cn(
                      "flex flex-col items-start gap-2 rounded-lg border p-3 text-left text-sm transition-all hover:bg-accent",
                      currentPost && currentPost.id === item.id && "bg-muted"
                    )}
                    onClick={() => {
                      if (window.innerWidth < 768) {
                        setCurrentPost((val) => {
                          return {
                            instanceVersion: val ? val.instanceVersion + 1 : 1,
                            post: item,
                            id: item.id
                          }
                        })
                      } else {
                        setCurrentPost({
                          post: item,
                          id: item.id
                        })
                      }
                    }
                    }
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
                            currentPost && currentPost.id === item.id
                              ? "text-foreground"
                              : "text-muted-foreground"
                          )}
                        >
                          {formatDistanceToNow(new Date(item.createdAt), {
                            addSuffix: true,
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="line-clamp-2 text-xs text-muted-foreground">
                      {item.description.substring(0, 300)}
                    </div>
                    <div className="flex items-center justify-between text-xs w-full">
                      <div className="flex items-center font-semibold text-muted-foreground ">
                        <ChevronUp className="h-3 w-3 mr-1" /> {item.votes || 0}  <MessageSquare className="h-3 w-3 mx-1 ml-3" /> {item.commentCount || 0}
                      </div>
                      <div>
                        {item.boardName}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </ResizablePanel>
          <ResizableHandle withHandle className="hidden md:flex" />
          <ResizablePanel defaultSize={defaultLayout[1]} minSize={30} className="hidden md:flex">
            {
              currentPost && currentPost.id &&
              <PostCard
                key={currentPost.instanceVersion || currentPost.id}
                id={currentPost.id}
                params={params}
                deleteFromParentRender={() => deletePostFromView(currentPost.id)}
              />
            }
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </main>
  )
}

export default withAuth(PostsScreen);

