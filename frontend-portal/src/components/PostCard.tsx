import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Calendar, CheckCircle, ChevronUp, Circle, Expand, Eye, Flag, Loader, Play, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useToast } from "@/components/ui/use-toast"
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Icons } from './icons';

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

function PostDetails({ params, data, refetch }) {
  const [status, setStatus] = useState(data.status || 'OPEN');
  const [priority, setPriority] = useState(data.priority || 'Medium');

  const { toast } = useToast()


  const updatePost = async ({ updatedStatus, updatedPriority }) => {
    fetch(`/api/auth/posts/update-post-details`, {
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
      .then((res) => res.json())
      .then((data) => {
        toast({
          title: 'Post updated successfully'
        })
        refetch()
        console.log(data)
      })
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
      <Select onValueChange={val => {
        setPriority(val);
        updatePost({ updatedPriority: val })
      }} value={priority} >
        <SelectTrigger
          id="priority"
          aria-label="Select priority"
        >
          <SelectValue placeholder="Priority" >
            <div className={cn("flex items-center",
              priority === "High" && "text-red-500",
              priority === "Medium" && "text-yellow-500",
              priority === "Low" && "text-green-500"
            )}>
              <Flag className='w-4 h-4 inline-block mr-2' /> {priority}
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
  </div>)
}

function TitleHeader({ params, data, refetch }) {
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
      </div>
      <Separator />
    </div>
  )
}


function CommentSection({ params, refetch, comments }) {

  return (
    <div className="">
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
        <h1 className="mx-2 text-sm font-semibold">{user.name}</h1>
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

export const PostCard = ({ post, params, disableExpand = false }) => {

  const refetch = () => {
    fetch(`/api/auth/posts/fetch-post?postId=${id}`, {
      method: "GET",
      headers: {
        "x-org-slug": params.slug,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        // setData(data)
      })
  }

  if (post.length === 0 || Object.keys(post).length === 0) {
    return (
      <div className='flex h-full w-full justify-center items-center'>
        < Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
        Loading...
      </div >
    )
  }
  return (
    <div className="flex flex-1 w-full flex-col h-full">
      <TitleHeader data={post} refetch={refetch} params={params} disableExpand={disableExpand} />
      <div className="flex flex-1 w-full h-full">
        <div className='h-full w-full'>
          <div className='flex gap-2 flex-col md:flex-row w-full'>
            <div className='flex-1'>
              <UserHeader user={post.user} />
              <PostContent data={post} />
              <NewCommentInput data={post} params={params} refetch={refetch} />
              <Separator className='my-6' />
              {/* <ActionButtons data={post} /> */}
              <CommentSection comments={post.comments} refetch={refetch} params={params} />
            </div>
            <div className='md:w-1/4 md:flex md:justify-center'>
              <PostDetails data={post} params={params} refetch={refetch} key={post.id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
