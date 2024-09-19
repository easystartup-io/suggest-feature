import AttachmentComponent from '@/components/AttachmentComponent';
import MultiAttachmentUploadButton from '@/components/MultiAttachmentUploadButton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Calendar, CheckCircle, ChevronUp, Circle, Eye, Flag, Loader, Play, Reply, Star, XCircle } from 'lucide-react';
import { useState } from 'react';
import { Icons } from './icons';
import Voters from './Voters';

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

function PostDetails({ params, data, refetch }) {
  const [status, setStatus] = useState(data.status || 'OPEN');
  const [priority, setPriority] = useState(data.priority || 'Medium');

  const { toast } = useToast()


  return (<div className='px-4 my-4 w-full' >
    <Voters voters={data.voters} />
  </div>)
}

function TitleHeader({ params, data, refetch }) {
  const { verifyLoginOrPrompt } = useAuth()
  const user = data.user;
  if (!user) return null;


  const upVote = (upvote) => {
    if (verifyLoginOrPrompt()) {
      return;
    }

    fetch(`/api/portal/auth/posts/upvote-post?postId=${data.id}&upvote=${upvote}`, {
      method: "POST",
      headers: {
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
        <div className="m-4 ml-0 flex items-center h-full flex-1">
          <div className={(data.selfVoted ? "bg-indigo-600 text-white" : "") + " flex items-center flex-col justify-center border px-4 py-2  text-lg rounded-xl cursor-pointer font-bold"}
            onClick={() => upVote(!data.selfVoted)}
          >
            <ChevronUp />
            {data.votes}
          </div>
          <div className='ml-4'>
            <h1 className="text-lg font-semibold">{data.title}</h1>
            <div className='flex gap-2'>
              <div className='flex items-center'>
                <div className={cn('p-2 rounded-lg text-sm',
                  statusConfig[data.status].bgColor
                )}>
                  {data.status && statusConfig[data.status].icon}
                  {data.status && statusConfig[data.status].label}
                </div>
              </div>
              <div className='text-sm'>
                {data.priority && <div className={cn("flex items-center p-2 rounded-lg",
                  data.priority === "High" && "text-red-500 bg-red-100 dark:bg-red-800",
                  data.priority === "Medium" && "text-yellow-500 bg-yellow-100 dark:bg-yellow-800",
                  data.priority === "Low" && "text-green-500 bg-green-100 dark:bg-green-800"
                )}>
                  <Flag className='w-4 h-4 inline-block mr-2' /> {data.priority}
                </div>
                }
              </div>
            </div>
          </div>
        </div>
      </div>
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
      <PostContent data={comment} refetch={refetch} params={params} />
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
                const name = user.name || '';
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

function PostContent({ data, refetch, params }) {

  const [openReplyComment, setOpenReplyComment] = useState(false);
  const { verifyLoginOrPrompt } = useAuth()

  return (
    <div >
      <div className="ml-16">
        <p className=''>
          {
            data.newStatus ?
              <div className='flex items-center space-x-2'>
                Status changed to
                <div className={cn('p-2 rounded-lg text-sm ml-2',
                  statusConfig[data.newStatus].bgColor
                )}>
                  {data.newStatus && statusConfig[data.newStatus].icon}
                  {data.newStatus && statusConfig[data.newStatus].label}
                </div>
              </div>
              : (data.description || data.content)
          }
        </p>

        <AttachmentComponent
          attachments={data.attachments}
        />
        <div className='flex items-center space-x-2'>
          <div
            className={cn(
              "text-xs text-muted-foreground flex items-center",
            )}
          >
            {formatDistanceToNow(new Date(data.createdAt), {
              addSuffix: true,
            })}
          </div>
          {
            !data.title &&
            <div className='flex items-center text-xs'>
              <Button variant='ghost' className='' size="sm"
                onClick={() => {
                  verifyLoginOrPrompt();
                  setOpenReplyComment(true)
                }}>
                <Reply className='h-4 w-4 mr-2' />
                Reply
              </Button>
            </div>
          }
        </div>
      </div>
      {openReplyComment && !data.title &&
        <NewCommentInputOld
          postSubmitAction={() => setOpenReplyComment(false)}
          inReplyToComment={true}
          data={data}
          refetch={refetch}
          params={params}
        />
      }
    </div>
  )
}

function NewCommentInputOld({ data, params, refetch, inReplyToComment, postSubmitAction = null }) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast()
  const { user, verifyLoginOrPrompt } = useAuth()
  const [uploading, setUploading] = useState(false);
  const [attachments, setAttachments] = useState([]);

  const submitComment = async (e) => {
    if (verifyLoginOrPrompt()) {
      return;
    }
    if (loading) {
      return;
    }
    setLoading(true)
    try {
      const resp = await fetch(`/api/portal/auth/posts/create-comment`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          postId: inReplyToComment ? data.postId : data.id,
          replyToCommentId: inReplyToComment ? data.id : null,
          content: content,
          attachments: attachments
        })
      })
      const outputData = resp.json()
      if (resp.ok) {
        setTimeout(() => {
          setContent('');
          setAttachments([]);
          if (postSubmitAction) {
            postSubmitAction();
          }
        }, 1000)

        refetch()
        toast({
          title: 'Comment added',
        })


      } else {
        toast({
          title: 'Error adding comment',
          description: outputData.message,
          variant: 'destructive'
        })
      }
      console.log(outputData)
    } catch (e) {
      console.log(e)
    }

    setTimeout(() => {
      setLoading(false);
    }, 1000)
  }


  return (<div className='mx-14 mt-2 flex flex-col'>
    <Textarea placeholder="Add a comment" value={content}
      disabled={loading}
      onChange={(e) => {
        setContent(e.target.value)
        if (e.target.value.trim().length > 0) {
          if (verifyLoginOrPrompt()) {
            return;
          }
        }
      }} />

    <AttachmentComponent
      attachments={attachments}
      setAttachments={setAttachments}
      allowDelete={true}
    />

    <div className='mt-2 flex justify-end space-x-2'>
      <MultiAttachmentUploadButton
        attachments={attachments}
        setAttachments={setAttachments}
        loading={loading}
        uploading={uploading}
        setUploading={setUploading}
      />

      <Button onClick={submitComment} disabled={loading || uploading || content.trim().length === 0}>
        {(loading || uploading) && <Icons.spinner
          className={
            cn("h-4 w-4 animate-spin",
              loading ? 'mx-4' : 'mr-2')
          } />}
        {
          uploading ? 'Uploading...' : (loading ? '' : 'Submit')
        }
      </Button>
    </div>
  </div>)
}

export const PostCard = ({ post, params, disableExpand = false, refetch }) => {

  if (post.length === 0 || Object.keys(post).length === 0) {
    return (
      <div className='flex h-full w-full justify-center items-center'>
        < Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
        Loading...
      </div >
    )
  }
  return (
    <div className='grid md:grid-cols-3 gap-2'>
      <div className='md:col-span-2 md:border-r order-2 md:order-1'>
        <TitleHeader data={post} refetch={refetch} params={params} />
        <div>
          <UserHeader user={post.user} />
          <PostContent data={post} refetch={refetch} params={params} />
          <NewCommentInputOld data={post} params={params} refetch={refetch} inReplyToComment={false} />
          <Separator className='my-6' />
          {/* <ActionButtons data={post} /> */}
          <CommentSection comments={post.comments} refetch={refetch} params={params} />
        </div>
      </div>
      <div className='md:col-span-1 order-1 md:order-2'>
        <PostDetails data={post} params={params} refetch={refetch} key={post.id} />
      </div>
    </div>
  );
};
