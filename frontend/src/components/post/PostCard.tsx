import { useEffect, useState } from 'react';
import { Icons } from '../icons';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ChevronUp, Expand } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { DialogHeader, DialogFooter } from '../ui/dialog';

function FullScreenPostDialog({ id, params }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onClose={() => setIsOpen(false)} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button onClick={() => setIsOpen(true)} variant="ghost" size="icon">
          <Expand />
        </Button>
      </DialogTrigger>
      <DialogContent className="h-[600px] max-w-screen-xl flex flex-col items-center justify-between">
        <PostCard id={id} params={params} disableExpand={true} />
      </DialogContent>
    </Dialog>
  );
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
    <div className="h-full w-full">
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
        {/* { */}
        {/*   !disableExpand && <div className="m-4"> */}
        {/*     <FullScreenPostDialog params={params} id={id} /> */}
        {/*   </div> */}
        {/* } */}
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
      <Button onClick={submitComment} disabled={loading}>
        {loading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
        Submit
      </Button>
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
        <div className='w-4/5'>
          <ScrollArea className="h-full overflow-y-auto">
            <div className='h-full'>
              <UserHeader user={data.user} />
              <PostContent data={data} />
              <NewCommentInput data={data} params={params} refetch={refetch} />
              <Separator className='my-6' />
              {/* <ActionButtons data={data} /> */}
              <CommentSection comments={data.comments} refetch={refetch} params={params} />
            </div>
          </ScrollArea>
        </div>
        <div className='flex-1'>
          <ScrollArea className="h-full overflow-y-auto">
            Voters
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};
