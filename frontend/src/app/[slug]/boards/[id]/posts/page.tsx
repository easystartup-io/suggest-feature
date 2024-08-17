"use client"

import { Button } from "@/components/ui/button"
import withAuth from '@/hoc/withAuth';
import { ComponentProps, useContext, useEffect, useState } from "react";
import { SidebarContext } from "@/app/[slug]/layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input"
import { useFieldArray, useForm } from "react-hook-form"
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Icons } from "@/components/icons";
import { useToast } from "@/components/ui/use-toast"
import { DialogHeader, DialogFooter } from "@/components/ui/dialog";
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Badge, Search, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";


function DialogDemo({ params, setData }) {
  const [isLoading, setLoading] = useState(false)
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState('UNDER_REVIEW');

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
        setData(respData)
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
      setLoading(false)
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
            <Select
              value={status}
              onValueChange={(value) => setStatus(value)}
            >
              <SelectTrigger className="col-span-3 w-full">
                {status.split('_').map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="IN_PROGRESS">In progress</SelectItem>
                <SelectItem value="UNDER_REVIEW">Under review</SelectItem>
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

const Dashboard: React.FC = ({ params,
  defaultLayout = [40, 60]
}) => {
  const { toast } = useToast()

  const [data, setData] = useState(null)
  const [isLoading, setLoading] = useState(true)
  const [defaultValues, setDefaultValues] = useState({})
  const form = useForm({ defaultValues })
  const { reset } = form; // Get reset function from useForm
  const [currentPost, setCurrentPost] = useState(null)
  const [board, setBoard] = useState(null)
  const router = useRouter()

  useEffect(() => {
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
        if (data && data.length) {
          setCurrentPost(data[0])
        }
        reset(data)
        setLoading(false)
      })

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

  async function onSubmit(data) {
    setLoading(true)
    try {

      const resp = await fetch(`/api/auth/posts/create-post`, {
        method: 'POST',
        headers: {
          "x-org-slug": params.slug,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      const respData = await resp.json();
      if (resp.ok) {
        setData(respData)
        reset(respData)
        toast({
          title: 'Post updated successfully',
        })
      } else {
        toast({
          title: respData.message,
          variant: 'destructive'
        })
      }
      setLoading(false)
    } catch (err) {
      console.log(err)
      toast({
        title: 'Something went wrong',
        description: 'Please try again by reloading the post, if the problem persists contact support',
        variant: 'destructive'
      })
    }
    setTimeout(() => { setLoading(false) }, 1000)
  }


  // if (isLoading) return <p>Loading...</p>
  if (!data) return <p>No profile data</p>


  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Board - {board && board.name}</h1>
        <div className="flex gap-2 items-center">
          <Button onClick={() => router.push(`/${params.slug}/boards/${params.id}`)}
            variant="destructive"
            size="icon"
          >
            <Settings />
          </Button>
          <DialogDemo params={params} setData={setData} />
        </div>
      </div>
      <div
        className="flex flex-1 justify-center rounded-lg border border-dashed shadow-sm"
      >
        <ResizablePanelGroup
          direction="horizontal"
          onLayout={(sizes: number[]) => {
            document.cookie = `react-resizable-panels:layout:mail=${JSON.stringify(
              sizes
            )}`
          }}
          className="h-full max-h-[800px] items-stretch"
        >
          <ResizablePanel defaultSize={defaultLayout[0]} minSize={30}>
            <div className="bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <form>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search" className="pl-8" />
                </div>
              </form>
            </div>
            <ScrollArea className="h-screen">
              <div className="flex flex-col gap-2 p-4 pt-0">
                {data && data.length && data.map((item) => (
                  <button
                    key={item.id}
                    className={cn(
                      "flex flex-col items-start gap-2 rounded-lg border p-3 text-left text-sm transition-all hover:bg-accent",
                      currentPost && currentPost.id === item.id && "bg-muted"
                    )}
                    onClick={() =>
                      setCurrentPost(item)
                    }
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
                    {item.status ? (
                      <div className="flex items-center gap-2">
                        <Badge variant={getBadgeVariantFromLabel(item.status)}>
                          {item.status.split('_').map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')}
                        </Badge>
                      </div>
                    ) : null}
                  </button>
                ))}
              </div>
            </ScrollArea>

          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={defaultLayout[1]} minSize={30}>
            {/* <MailDisplay */}
            {/*   mail={mails.find((item) => item.id === mail.selected) || null} */}
            {/* /> */}
          </ResizablePanel>
        </ResizablePanelGroup>
        <div className="w-full p-4">
        </div>
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

