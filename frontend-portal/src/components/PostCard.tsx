import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Calendar, CheckCircle, ChevronUp, Circle, Expand, Eye, Flag, Loader, Paperclip, Play, Star, XCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useToast } from "@/components/ui/use-toast"
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Icons } from './icons';
import Voters from './Voters';
import { useAuth } from '@/context/AuthContext';
import NewCommentInput from './NewCommentInput';
import { Card, CardContent } from './ui/card';
import { handleFileClick, getFileIcon } from '@/app/b/[slug]/page';

export const statusConfig = {
  "OPEN": {
    icon: <Circle className="w-4 h-4 inline-block mr-2 text-blue-500" />,
    label: "OPEN",
    bgColor: "bg-blue-100 dark:bg-blue-800"
  },
  "UNDER REVIEW": {
    icon: <Eye className="w-4 h-4 inline-block mr-2 text-yellow-500" />,
    label: "UNDER REVIEW",
    bgColor: "bg-yellow-100 dark:bg-yellow-800"
  },
  "PLANNED": {
    icon: <Calendar className="w-4 h-4 inline-block mr-2 text-blue-500" />,
    label: "PLANNED",
    bgColor: "bg-blue-100 dark:bg-blue-800"
  },
  "IN PROGRESS": {
    icon: <Loader className="w-4 h-4 inline-block mr-2 text-orange-500" />,
    label: "IN PROGRESS",
    bgColor: "bg-orange-100 dark:bg-orange-800"
  },
  "LIVE": {
    icon: <Play className="w-4 h-4 inline-block mr-2 text-green-500" />,
    label: "LIVE",
    bgColor: "bg-green-100 dark:bg-green-800"
  },
  "COMPLETE": {
    icon: <CheckCircle className="w-4 h-4 inline-block mr-2 text-green-500" />,
    label: "COMPLETE",
    bgColor: "bg-green-100 dark:bg-green-800"
  },
  "CLOSED": {
    icon: <XCircle className="w-4 h-4 inline-block mr-2 text-red-500" />,
    label: "CLOSED",
    bgColor: "bg-red-100 dark:bg-red-800"
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
        <div className="m-4 flex items-center h-full flex-1">
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

function PostContent({ data }) {
  const [expandedImage, setExpandedImage] = useState(null)
  return (
    <div className="ml-16">
      <p className=''>{data.description || data.content}</p>

      <div className="grid grid-cols-4 gap-2 mt-2">
        {data.attachments && data.attachments.length > 0 &&
          data.attachments.map((attachment, index) => (
            <div key={index} className="overflow-hidden rounded-md">
              {attachment.type === 'image' ? (
                <img
                  src={attachment.url}
                  alt="attachment"
                  onClick={() => setExpandedImage(attachment.url)}
                  className="h-24 w-full object-cover cursor-pointer"
                />
              ) :
                <Card
                  className="h-24 cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleFileClick(attachment.url)}
                >
                  <CardContent className="flex flex-col items-center justify-center h-full p-2">
                    {getFileIcon(attachment.type)}
                    <p className="text-xs mt-2 truncate w-full text-center">
                      {attachment.name || attachment.url.split('/').pop()}
                    </p>
                  </CardContent>
                </Card>
              }
            </div>
          ))}
      </div>

      <Dialog open={!!expandedImage} onOpenChange={() => setExpandedImage(null)}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] w-fit h-fit p-0">
          <div className="relative w-full h-full max-w-[80vw] max-h-[80vh]">
            <img
              src={expandedImage}
              alt="Expanded view"
              className="w-full h-full object-contain"
            />
            <Button
              variant="ghost"
              className="absolute top-2 right-2 p-1 h-auto bg-black bg-opacity-50 hover:bg-opacity-75 transition-opacity"
              onClick={() => setExpandedImage(null)}
            >
              <XCircle className="h-6 w-6 text-white" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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

function NewCommentInputOld({ data, params, refetch }) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast()
  const { user, verifyLoginOrPrompt } = useAuth()
  const [uploading, setUploading] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const fileInputRef = useRef(null);

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
          postId: data.id,
          content: content,
          attachments: attachments
        })
      })
      const outputData = resp.json()
      if (resp.ok) {
        setTimeout(() => {
          setContent('');
          setAttachments([]);
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

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 5MB

  const handleFileChange = async (e) => {
    const file = e.target.files[0];

    if (verifyLoginOrPrompt()) {
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: 'File is too large',
        description: 'Please upload a file that is less than 10MB in size',
        variant: 'destructive'
      })
      return
    }

    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`/api/auth/upload/upload-file`, {
        method: 'POST',
        body: formData,
      });


      const respData = await response.json();

      if (!response.ok) {
        toast({
          title: respData.message,
          variant: 'destructive'
        })
        throw new Error('Upload failed');
      }

      setAttachments([
        ...attachments,
        {
          "type": respData.type,
          "url": respData.url,
          "name": respData.name,
          "contentType": respData.contentType,
        }
      ]);
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setUploading(false);
    }

  }

  const handleButtonClick = () => {

    if (verifyLoginOrPrompt()) {
      return;
    }

    if (loading || uploading) return;
    if (attachments.length >= 50) {
      toast({
        title: 'Too many attachments',
        variant: 'destructive'
      })
      return;
    }
    fileInputRef.current.click();
  };

  const handleRemoveFile = (index) => {
    setAttachments((prevFiles) => {
      const newFiles = [...prevFiles];
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

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


    <div className="grid grid-cols-4 gap-2 mt-2">
      {attachments.length > 0 &&
        attachments.map((attachment, index) => (
          <div key={index} className="relative overflow-hidden rounded-md">
            {attachment.type === 'image' ? (
              <img
                src={attachment.url}
                alt="attachment"
                className="h-24 w-full object-cover"
              />
            ) :
              <Card
                className="h-24 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleFileClick(attachment.url)}
              >
                <CardContent className="flex flex-col items-center justify-center h-full p-2">
                  {getFileIcon(attachment.type)}
                  <p className="text-xs mt-2 truncate w-full text-center">
                    {attachment.name || attachment.url.split('/').pop()}
                  </p>
                </CardContent>
              </Card>
            }
            <Button
              variant="ghost"
              className="absolute top-1 right-1 p-1 h-auto bg-black bg-opacity-50 hover:bg-opacity-75 transition-opacity"
              onClick={() => handleRemoveFile(index)}
            >
              <XCircle className="h-4 w-4 text-white" />
            </Button>
          </div>
        ))}
    </div>
    <div className='mt-2 flex justify-end space-x-2'>

      <Button variant="outline" size="icon"
        onClick={handleButtonClick}
        disabled={uploading || loading}
      >
        <Paperclip className='h-4 w-4 text-gray-500' />
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
        />
      </Button>
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
          <PostContent data={post} />
          <NewCommentInputOld data={post} params={params} refetch={refetch} />
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
