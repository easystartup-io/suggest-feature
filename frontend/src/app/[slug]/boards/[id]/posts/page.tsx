"use client"

import { Button } from "@/components/ui/button"
import withAuth from '@/hoc/withAuth';
import { ComponentProps, useContext, useEffect, useState } from "react";
import { Input } from "@/components/ui/input"
import { useForm } from "react-hook-form"
import { Icons } from "@/components/icons";
import { useToast } from "@/components/ui/use-toast"
import { DialogHeader, DialogFooter } from "@/components/ui/dialog";
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Badge, Calendar, CheckCircle, Circle, Eye, Loader, Play, Search, Settings, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import { PostCard } from "@/components/post/PostCard";
import Cookies from 'js-cookie';

function AddPostDialog({ params, refetch }) {
  const [isLoading, setLoading] = useState(false)
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState('OPEN');

  const { toast } = useToast()

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
        body: JSON.stringify({ title, description, boardId: params.id, status })
      })
      const respData = await response.json();

      if (response.ok) {
        setIsOpen(false)
        toast({
          title: 'Post created',
        })
      } else {
        toast({
          title: respData.message,
          variant: 'destructive'
        })
      }
      refetch();

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
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Add post</DialogTitle>
          <DialogDescription>
            Create a new post
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-4">
            <Label htmlFor="title" >
              Title
            </Label>
            <Input
              id="title"
              value={title}
              placeholder="Dark mode"
              onChange={(e) => setTitle(e.target.value)}
              disabled={isLoading}
              className="col-span-3"
            />
          </div>
          <div className="grid gap-4">
            <Label htmlFor="description" >
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              placeholder="Dark mode is required for the app to look cool"
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
                <SelectItem value="OPEN">
                  <Circle className="w-4 h-4 inline-block mr-2 text-blue-500" />
                  OPEN
                </SelectItem>
                <SelectItem value="UNDER REVIEW">
                  <Eye className="w-4 h-4 inline-block mr-2 text-yellow-500" />
                  UNDER REVIEW
                </SelectItem>
                <SelectItem value="PLANNED">
                  <Calendar className="w-4 h-4 inline-block mr-2 text-blue-500" />
                  PLANNED
                </SelectItem>
                <SelectItem value="IN PROGRESS">
                  <Loader className="w-4 h-4 inline-block mr-2 text-orange-500" />
                  IN PROGRESS
                </SelectItem>
                <SelectItem value="LIVE">
                  <Play className="w-4 h-4 inline-block mr-2 text-green-500" />
                  LIVE
                </SelectItem>
                <SelectItem value="COMPLETE">
                  <CheckCircle className="w-4 h-4 inline-block mr-2 text-green-500" />
                  COMPLETE
                </SelectItem>
                <SelectItem value="CLOSED">
                  <XCircle className="w-4 h-4 inline-block mr-2 text-red-500" />
                  CLOSED
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={onSubmit} disabled={isLoading}>
            {isLoading && (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            )}
            Create post
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


const Dashboard: React.FC = ({ params }) => {
  const { toast } = useToast()

  const [data, setData] = useState(null)
  const [isLoading, setLoading] = useState(true)
  const [defaultValues, setDefaultValues] = useState({})
  const form = useForm({ defaultValues })
  const { reset } = form; // Get reset function from useForm
  const [currentPost, setCurrentPost] = useState(null)
  const [board, setBoard] = useState(null)
  const router = useRouter()
  const layout = Cookies.get('react-resizable-panels:layout:sf:boards');

  const defaultLayout = layout ? JSON.parse(layout) : [35, 65]

  function refetchPosts() {
    fetch(`/api/auth/posts/fetch-posts`, {
      method: "POST",
      headers: {
        "x-org-slug": params.slug,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ boardId: params.id })
    })
      .then((res) => res.json())
      .then((data) => {
        setData(data)
        if (data && data.length > 0) {
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

    fetch(`/api/auth/boards/fetch-board?boardId=${params.id}`, {
      headers: {
        "x-org-slug": params.slug,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setBoard(data)
      })
  }, [params.id, params.slug, reset])

  // if (isLoading) return <p>Loading...</p>
  if (!data) return <p>No post data</p>


  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 h-full">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Board - {board && board.name}</h1>
        <div className="flex gap-2 items-center">
          <Button onClick={() => router.push(`/${params.slug}/boards/${params.id}`)}
            variant="destructive"
            size="icon"
          >
            <Settings />
          </Button>
          <AddPostDialog params={params} refetch={refetchPosts} />
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
            <div className="bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <form>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search" className="pl-8" />
                </div>
              </form>
            </div>
            <ScrollArea className="h-full overflow-y-auto">
              <div className="flex flex-col gap-2 px-4 pt-0">
                {data && data.length > 0 && data.map((item) => (
                  <button
                    key={item.id}
                    className={cn(
                      "flex flex-col items-start gap-2 rounded-lg border p-3 text-left text-sm transition-all hover:bg-accent",
                      currentPost && currentPost.id === item.id && "bg-muted"
                    )}
                    onClick={() =>
                      setCurrentPost({
                        post: item,
                        id: item.id
                      })}
                  >
                    <div className="flex w-full flex-col gap-1">
                      <div className="flex items-center">
                        <div className="flex items-center gap-2">
                          <div className="font-semibold">{item.title}</div>
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
                  </button>
                ))}
              </div>
            </ScrollArea>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={defaultLayout[1]} minSize={30}>
            {
              currentPost && currentPost.id &&
              <PostCard id={currentPost && currentPost.id} params={params} />
            }
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </main>
  )
}

function getBadgeVariantFromLabel(
  label: string
): ComponentProps<typeof Badge>["variant"] {
  if (["under_review"].includes(label.toLowerCase())) {
    return "default"
  }

  if (["in_progress"].includes(label.toLowerCase())) {
    return "outline"
  }

  return "secondary"
}
export default withAuth(Dashboard);

