import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Calendar, CheckCircle, ChevronUp, Circle, Expand, Eye, Flag, Loader, Play, Star, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Icons } from '../icons';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Textarea } from '../ui/textarea';
import { statusConfig } from '@/app/[slug]/boards/[id]/posts/page';
import { useToast } from "@/components/ui/use-toast"
import Voters from '../Voters';

function FullScreenPostDialog({ id, params }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onClose={() => setIsOpen(false)} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button onClick={() => setIsOpen(true)} variant="ghost" size="icon">
          <Expand />
        </Button>
      </DialogTrigger>
      <DialogContent className="h-[600px] max-w-screen-lg xl:max-w-screen-xl 2xl:max-w-screen-2xl flex flex-col items-center justify-between">
        <ScrollArea className="w-full h-full">
          <PostCard id={id} params={params} disableExpand={true} />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function PostDetails({ params, data, refetch }) {
  const [status, setStatus] = useState(data.status || 'OPEN');
  const [priority, setPriority] = useState(data.priority || 'Medium');

  const { toast } = useToast()


  const updatePost = async ({ updatedStatus, updatedPriority }) => {
    try {
      const res = await fetch(`/api/auth/posts/update-post-details`, {
        method: "POST",
        headers: {
          "x-org-slug": params.slug,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          postId: data.id,
          status: updatedStatus || status,
          priority: updatedPriority || priority
        })
      })
      const respData = await res.json()
      if (res.ok) {
        toast({
          title: 'Post updated successfully'
        })
        refetch()
      } else {
        toast({
          title: 'Post failed to update',
          description: respData.message,
          variant: 'destructive'
        })
      }
    } catch (e) {
      toast({
        title: 'Post failed to update'
      })
    }
  }

  return (<div className='border-l px-4 my-4 w-full' >
    <div className="my-4">
      <p className="text-sm font-medium my-2">Status</p>
      <Select onValueChange={
        val => {
          setStatus(val)
          updatePost({ updatedStatus: val })
        }} value={status}>
        <SelectTrigger
          id="status"
          aria-label="Select status"
          className={cn(statusConfig[status].bgColor)}

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
    <div className="my-4">
      <p className="text-sm font-medium my-2"><Flag className='w-4 h-4 inline-block mr-2' />Priority</p>
      <Select
        onValueChange={val => {
          setPriority(val);
          updatePost({ updatedPriority: val })
        }} value={priority} >
        <SelectTrigger
          id="priority"
          aria-label="Select priority"
          className={cn(
            data && data.priority === "High" && "bg-red-800",
            data && data.priority === "Medium" && "bg-yellow-300",
            data && data.priority === "Low" && "bg-green-800"
          )}
        >
          <SelectValue placeholder="Priority" >
            <div className={cn("flex items-center text-white",
              priority === "Medium" && "text-black",
            )}>
              <Flag className={cn('w-4 h-4 inline-block mr-2 ',
                priority === "High" && "text-red-500",
                priority === "Medium" && "text-yellow-500",
                priority === "Low" && "text-green-500"
              )} /> {priority}
            </div>
          </ SelectValue >
        </SelectTrigger>
        <SelectContent className="w-full">
          <SelectItem value="High" className='text-red-500'><Flag className='w-4 h-4 inline-block mr-2 text-red-500' />High</SelectItem>
          <SelectItem value="Medium" className='text-yellow-500'><Flag className='w-4 h-4 inline-block mr-2 text-yellow-500' />Medium</SelectItem>
          <SelectItem value="Low" className='text-green-500'><Flag className='w-4 h-4 inline-block mr-2 text-green-500' />Low</SelectItem>
        </SelectContent>
      </Select>
    </div>
    <Voters voters={data.voters} />
  </div>)
}

function TitleHeader({ params, data, refetch, id, disableExpand }) {
  const user = data.user;
  if (!user) return null;

  const upVote = (upvote) => {
    fetch(`/api/auth/posts/upvote-post?postId=${data.id}&upvote=${upvote}`, {
      method: "POST",
      headers: {
        "x-org-slug": params.slug,
        'Content-Type': 'application/json'
      },
    })
      .then((res) => res.json())
      .then((data) => {
        refetch()
      })
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between h-full w-full">
        <div className="m-4 flex items-center h-full flex-1">
          <div className={(data.selfVoted ? "bg-indigo-600 text-white" : "") + " flex items-center flex-col justify-center border px-4 py-2  text-lg rounded-xl cursor-pointer font-bold"}
            onClick={() => upVote(!data.selfVoted)}
          >
            <ChevronUp />
            {data.votes}
          </div>
          <h1 className="ml-4 text-lg font-semibold">{data.title}</h1>
        </div>
        {
          !disableExpand && <div className="m-4">
            <FullScreenPostDialog params={params} id={id} />
          </div>
        }
      </div>
      <Separator />
    </div>
  )
}


function CommentSection({ params, refetch, comments }) {

  return (
    <div className="flex flex-1 flex-col h-full">
      {comments && comments.length > 0 && comments.map(comment => (
        <CommentCard key={comment.id} comment={comment} params={params} refetch={refetch} />
      ))}
    </div>
  )
}

function CommentCard({ comment, refetch, params }) {
  return (
    <div className="ml-16">
      <UserHeader user={comment.user} />
      <PostContent data={comment} />
      {/* <CommentContent content={comment.content} /> */}
      {/* <CommentActions commentId={comment.id} /> */}
      {comment.comments && comment.comments.length > 0 &&
        <CommentSection comments={comment.comments} params={params} refetch={refetch} />}
    </div>
  )
}

function UserHeader({ user }) {
  if (!user) return null;
  return (
    <div className="">
      <div className="mt-4 mx-4 flex items-center">
        <div className='relative'>
          <Avatar className=''>
            <AvatarImage src={`${user.profilePic}`} />
            <AvatarFallback>
              {(() => {
                const name = user.name || user.email.split('@')[0];
                const words = name.split(' ');

                let initials;

                if (words.length > 1) {
                  // If the name has multiple words, take the first letter of each word
                  initials = words.map(word => word[0]).join('').toUpperCase();
                } else {
                  // If it's a single word, take the first two characters
                  initials = name.slice(0, 2).toUpperCase();
                }

                // Ensure it returns exactly 2 characters
                return initials.length >= 2 ? initials.slice(0, 2) : initials.padEnd(2, initials[0]);
              })()}
            </AvatarFallback>
          </Avatar>
          {user.partOfOrg && (
            <div className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-0.5">
              <Star className="w-3 h-3 text-white" />
            </div>
          )}
        </div>
        <h1 className={cn("mx-2 text-sm font-semibold",
          user.partOfOrg && "text-blue-500"
        )}>{user.name}</h1>
      </div>
    </div>
  )
}

function PostContent({ data }) {
  return (
    <div className="ml-16">
      <p className=''>{data.description || data.content}</p>
      <div
        className={cn(
          "mt-2 text-xs text-muted-foreground"
        )}
      >
        {formatDistanceToNow(new Date(data.createdAt), {
          addSuffix: true,
        })}
      </div>
    </div>
  )
}

function NewCommentInput({ data, params, refetch }) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const submitComment = async (e) => {
    if (loading) {
      return;
    }
    setLoading(true)
    try {
      const resp = await fetch(`/api/auth/posts/create-comment`, {
        method: "POST",
        headers: {
          "x-org-slug": params.slug,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          postId: data.id,
          content: content
        })
      })
      const outputData = resp.json()
      refetch()
      console.log(outputData)
    } catch (e) {
      console.log(e)
    }

    setTimeout(() => {
      setContent('');
      setLoading(false);
    }, 1000)
  }

  return (<div className='mx-14 mt-2 flex flex-col'>
    <Textarea placeholder="Add a comment" value={content}
      disabled={loading}
      onChange={(e) => setContent(e.target.value)} />
    <div className='mt-2 flex justify-end'>
      {content.trim().length === 0 ? '' :
        <Button onClick={submitComment} disabled={loading || content.trim().length === 0}>
          {loading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
          Submit
        </Button>
      }
    </div>
  </div>)
}

export const PostCard = ({ id, params, disableExpand = false }) => {
  const [data, setData] = useState([]);

  useEffect(() => {
    if (!id || id.length === 0) {
      return;
    }
    refetch()
  }, [params.id, params.slug, id])

  const refetch = () => {
    fetch(`/api/auth/posts/fetch-post?postId=${id}`, {
      method: "GET",
      headers: {
        "x-org-slug": params.slug,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setData(data)
      })
  }

  if (data.length === 0) {
    return (
      <div className='flex h-full w-full justify-center items-center'>
        < Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
        Loading...
      </div >
    )
  }
  return (
    <div className="flex flex-1 w-full flex-col h-full">
      <TitleHeader data={data} refetch={refetch} params={params} id={id} disableExpand={disableExpand} />
      <div className="flex flex-1 w-full h-full">
        <ScrollArea className="h-full overflow-y-auto w-full">
          <div className='h-full'>
            <div className='flex gap-2 flex-col md:flex-row h-full'>
              <div className='flex-1 h-full'>
                <UserHeader user={data.user} />
                <PostContent data={data} />
                <NewCommentInput data={data} params={params} refetch={refetch} />
                <Separator className='my-6' />
                {/* <ActionButtons data={data} /> */}
                <CommentSection comments={data.comments} refetch={refetch} params={params} />
              </div>
              <div className='md:w-1/4 md:flex md:justify-center'>
                <PostDetails data={data} params={params} refetch={refetch} key={data.id} />
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};
