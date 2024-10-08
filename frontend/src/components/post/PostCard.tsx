import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertTriangle, Edit, FileAudio, FileImage, FileText, FileVideo, File, Paperclip, Trash, Reply } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { Calendar, CheckCircle, ChevronUp, Circle, Expand, Eye, Flag, Loader, Play, Star, XCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Icons } from '../icons';
import { Button } from '../ui/button';
import { ScrollArea, ScrollBar } from '../ui/scroll-area';
import { Textarea } from '../ui/textarea';
import { useToast } from "@/components/ui/use-toast"
import Voters from '../Voters';
import AttachmentComponent from '@/components/AttachmentComponent';
import MultiAttachmentUploadButton from '../MultiAttachmentUploadButton';
import { statusConfig } from '@/components/post/PostsScreen';
import AutoLink from '../Autolink';


export function FullScreenPostDialog({ id, params, deleteFromParentRender }) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!id) {
      return
    }
    // Open dialog automatically on mobile
    if (window.innerWidth < 768) {
      setIsOpen(true);
    }
  }, [id]);

  return (
    <Dialog open={isOpen} onClose={() => setIsOpen(false)} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button onClick={() => setIsOpen(true)} variant="ghost" size="icon">
          <Expand />
        </Button>
      </DialogTrigger>
      <DialogContent className="h-[90vh] max-w-5xl p-0 w-[95vw]">
        <ScrollArea className="h-full w-full">
          <div className="p-6 min-w-[50vw]">
            <PostCard id={id} params={params} disableExpand={true} deleteFromParentRender={deleteFromParentRender} />
          </div>
          <ScrollBar orientation="vertical" />
          <ScrollBar orientation="horizontal" />
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
          className={cn(statusConfig[status].bgColor, "px-3")}
        >
          <SelectValue placeholder="Status">
            <div className="flex items-center justify-start">
              {statusConfig[status].icon}
              {statusConfig[status].label}
            </div>
          </SelectValue>
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

function TitleHeader({ params, data, refetch, id, disableExpand, deleteFromParentRender }) {
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
            <FullScreenPostDialog params={params} id={id} deleteFromParentRender={deleteFromParentRender} />
          </div>
        }
      </div>
      <Separator />
    </div>
  )
}


function CommentSection({ params, refetch, comments, deleteFromParentRender }) {

  return (
    <div className="flex flex-col">
      {comments && comments.length > 0 && comments.map(comment => (
        <CommentCard key={comment.id} comment={comment} params={params} refetch={refetch} deleteFromParentRender={deleteFromParentRender} />
      ))}
    </div>
  )
}

function CommentCard({ comment, refetch, params, deleteFromParentRender }) {
  return (
    <div className="ml-8">
      <UserHeader user={comment.user} />
      <PostContent data={comment} params={params} refetch={refetch} deleteFromParentRender={deleteFromParentRender} />
      {/* <CommentContent content={comment.content} /> */}
      {/* <CommentActions commentId={comment.id} /> */}
      {comment.comments && comment.comments.length > 0 &&
        <CommentSection comments={comment.comments} params={params} refetch={refetch} deleteFromParentRender={deleteFromParentRender} />}
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

function PostContent({ data, params, refetch, deleteFromParentRender }) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSpamDialogOpen, setIsSpamDialogOpen] = useState(false);
  const [editTitle, setEditTitle] = useState(data.title);
  const [editDescription, setEditDescription] = useState(data.description || data.content);
  const [attachments, setAttachments] = useState(data.attachments);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [replyToCommentOpen, setReplyToCommentOpen] = useState(false);
  const { toast } = useToast()

  const handleEdit = async () => {
    setLoading(true)
    try {
      let payload = {
        title: editTitle,
        description: editDescription,
        postId: data.id,
        attachments: attachments
      };
      if (!data.title) {
        payload = {
          content: editDescription,
          commentId: data.id
        }
      }
      const response = await fetch(`/api/auth/posts/update-${data.title ? 'post' : 'comment'}-details`, {
        method: 'POST',
        headers: {
          "x-org-slug": params.slug,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })
      const respData = await response.json();

      if (response.ok) {
        toast({
          title: `${data.title ? 'Post' : 'Comment'} updated`,
        })
        refetch();
        setIsEditDialogOpen(false);
      } else {
        toast({
          title: `Error updating ${data.title ? 'post' : 'comment'}`,
          description: respData.message,
          variant: 'destructive'
        })
      }
    } catch (err) {
      toast({
        title: err.message,
        variant: 'destructive'
      })
    }

    setTimeout(() => {
      setLoading(false);
    }, 1000)
  };

  const handleDelete = async () => {
    setLoading(true)
    try {
      // data.title means post vs comment
      let payload = {}
      if (data.title) {
        payload = { postId: data.id }
      } else {
        payload = { commentId: data.id }
      }
      const response = await fetch(`/api/auth/posts/delete-${data.title ? 'post' : 'comment'}`, {
        method: 'POST',
        headers: {
          "x-org-slug": params.slug,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })
      const respData = await response.json();

      if (response.ok) {
        toast({
          title: `${data.title ? 'Post' : 'Comment'} deleted`,
        })
        setIsDeleteDialogOpen(false);
        if (data.title) {
          deleteFromParentRender();
        } else {
          refetch();
        }
      } else {
        toast({
          title: `Error deleting ${data.title ? 'post' : 'comment'}`,
          description: respData.message,
          variant: 'destructive'
        })
      }
    } catch (err) {
      console.log(err)
      toast({
        title: err.message,
        variant: 'destructive'
      })
    }

    setTimeout(() => {
      setLoading(false);
    }, 1000)
  };

  const handleMarkSpam = () => {
    // Implement mark as spam logic here
    console.log("Post marked as spam");
    setIsSpamDialogOpen(false);
  };

  return (
    <div>
      <div className="ml-16">
        {/* One for post and another for comment  description vs content */}
        <p className='break-words'>
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
              : <AutoLink text={(data.description || data.content)} />
          }
        </p>

        <AttachmentComponent
          attachments={attachments}
        />

        <div
          className={cn(
            "text-xs text-muted-foreground",
            "flex items-center space-x-2"
          )}
        >
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className='inline-block'>
                  {formatDistanceToNow(new Date(data.createdAt), {
                    addSuffix: true,
                  })}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <span className="text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200">
                  {format(data.createdAt, "MMMM d, yyyy 'at' h:mm a")}
                </span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button variant="ghost" size="icon" onClick={() => setIsEditDialogOpen(true)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setIsDeleteDialogOpen(true)}>
            <Trash className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setIsSpamDialogOpen(true)}>
            <Flag className="h-4 w-4" />
          </Button>
          {
            !data.title && <Button variant="ghost" size="icon" onClick={() => setReplyToCommentOpen(true)}>
              <Reply className="h-4 w-4" />
            </Button>
          }
        </div>
      </div>
      {
        replyToCommentOpen && <NewCommentInputOld
          postSubmitAction={() => setReplyToCommentOpen(false)}
          isReplyToComment={true}
          data={data}
          params={params}
          refetch={refetch} />
      }
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold mb-4 flex items-center">
              <Edit className="text-blue-500 mr-2" />
              Edit {data.title ? 'Post' : 'Comment'}
            </DialogTitle>
            <DialogDescription>
              Make changes to your {data.title ? 'post' : 'comment'} below. Click save when you&apos;re done.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 my-4">
            {data.title &&
              <div className="space-y-2">
                <label htmlFor="edit-title" className="text-sm font-medium">Title</label>
                <Input
                  id="edit-title"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
              </div>
            }
            <div className="space-y-2">
              <label htmlFor="edit-description" className="text-sm font-medium">
                {data.title ? 'Description' : 'Comment'}
              </label>
              <Textarea
                id="edit-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <AttachmentComponent attachments={attachments} setAttachments={setAttachments} allowDelete={true} />
          <DialogFooter className="mt-6 space-x-2">
            <MultiAttachmentUploadButton
              attachments={attachments}
              setAttachments={setAttachments}
              loading={loading}
              uploading={uploading}
              setUploading={setUploading}
            />
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleEdit}
              disabled={loading || data.title && ((!editTitle || editTitle.trim().length === 0) || (!editDescription || editDescription.trim().length === 0)) || (!data.title && (!editDescription || editDescription.trim().length === 0))}
            >
              {loading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold mb-4 flex items-center">
              <AlertTriangle className="text-yellow-500 mr-2" />
              Confirm Deletion
            </DialogTitle>
            <DialogDescription>
              <p className="mb-4">Are you sure you want to delete this {data.title ? 'post' : 'comment'}? This action cannot be undone.</p>
              <p className="text-sm text-gray-600 italic">Deleting this {data.title ? 'post' : 'comment'} will remove all associated comments and reactions.</p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 space-x-2">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete {data.title ? 'Post' : 'Comment'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isSpamDialogOpen} onOpenChange={setIsSpamDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold mb-4 flex items-center">
              <AlertTriangle className="text-yellow-500 mr-2" />
              Confirm Spam Report
            </DialogTitle>
            <DialogDescription className="space-y-4">
              <p className="font-medium text-red-600">
                You&apos;re about to report this content as spam. Are you certain?
              </p>
              <p>Taking this action will have significant consequences:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>All content from this user will be removed, including posts, comments, and votes</li>
                <li>The user&apos;s account will be suspended, preventing future interactions</li>
              </ul>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 space-x-2">
            <Button variant="outline" onClick={() => setIsSpamDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleMarkSpam}>Confirm Spam Report</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function NewCommentInputOld({ data, params, refetch, isReplyToComment = false, postSubmitAction = null }) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isEditorFocused, setIsEditorFocused] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const { toast } = useToast()

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
          postId: isReplyToComment ? data.postId : data.id,
          replyToCommentId: isReplyToComment ? data.id : null,
          content: content,
          attachments: attachments
        })
      })
      const outputData = resp.json()
      if (resp.ok) {
        toast({
          title: 'Comment added successfully'
        })
        setTimeout(() => {
          setContent('');
          setAttachments([])
          if (postSubmitAction) {
            postSubmitAction()
          };
        }, 1000)
        refetch()
      } else {
        toast({
          title: 'Failed to add comment',
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

  return (<div className='mx-14 mt-2 flex flex-col'
    onFocus={() => setIsEditorFocused(true)}
  // onBlur={() => setIsEditorFocused(false)}
  >
    <Textarea placeholder="Add a comment" value={content}
      disabled={loading}
      onChange={(e) => setContent(e.target.value)} />

    <AttachmentComponent attachments={attachments} setAttachments={setAttachments} allowDelete={true} />

    {(content.trim().length === 0 && !isEditorFocused) ? '' :
      <div className='mt-2 flex justify-end items-center space-x-2'>
        <MultiAttachmentUploadButton
          attachments={attachments}
          setAttachments={setAttachments}
          uploading={uploading}
          setUploading={setUploading}
          loading={loading}
        />
        <Button onClick={submitComment}
          disabled={loading || content.trim().length === 0 || uploading}
        >
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
    }
  </div>)
}

export const PostCard = ({ id, params, disableExpand = false, deleteFromParentRender }) => {
  const [data, setData] = useState([]);
  const { toast } = useToast()

  useEffect(() => {
    if (!id || id.length === 0) {
      return;
    }
    refetch()
  }, [params.id, params.slug, id])

  const refetch = async () => {
    try {
      const resp = await fetch(`/api/auth/posts/fetch-post?postId=${id}`, {
        method: "GET",
        headers: {
          "x-org-slug": params.slug,
        },
      })
      const respData = await resp.json()
      if (resp.ok) {
        setData(respData)
      } else {
        toast({
          title: 'Failed to fetch post',
          description: respData.message,
          variant: 'destructive'
        })
      }
    } catch (e) {
      console.log(e)
    }
  }

  if (!data || data.length === 0) {
    return (
      <div className='flex h-full w-full justify-center items-center'>
        < Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
        Loading...
      </div >
    )
  }
  return (
    <div className="flex flex-col w-full h-full">
      <TitleHeader data={data} refetch={refetch} params={params} id={id} disableExpand={disableExpand} deleteFromParentRender={deleteFromParentRender} />
      <div className='flex-grow overflow-auto'>
        <div className='grid gap-2 md:grid-cols-4 min-w-[50vw]'>
          <div className='order-2 md:order-1 md:col-span-3 h-full'>
            <UserHeader user={data.user} />
            <PostContent data={data} params={params} refetch={refetch} deleteFromParentRender={deleteFromParentRender} />
            <NewCommentInputOld data={data} params={params} refetch={refetch} />
            <Separator className='my-6' />
            {/* <ActionButtons data={data} /> */}
            <CommentSection comments={data.comments} refetch={refetch} params={params} deleteFromParentRender={deleteFromParentRender} />
          </div>
          <div className='order-1 md:order-2 md:flex md:justify-center'>
            <PostDetails data={data} params={params} refetch={refetch} key={data.id} />
          </div>
        </div>
      </div>
    </div>
  );
};
