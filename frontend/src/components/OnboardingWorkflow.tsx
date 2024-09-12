"use client"
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { Icons } from "@/components/icons";
import slugify from 'slugify';
import { useState } from "react";

slugify.extend({ '@': 'at' });

const OnboardingWorkflow = ({ params }) => {
  const [step, setStep] = useState(1);
  const [isLoading, setLoading] = useState(false);
  const [boardName, setBoardName] = useState('');
  const [boardDescription, setBoardDescription] = useState('');
  const [boardSlug, setBoardSlug] = useState('');
  const [postTitle, setPostTitle] = useState('');
  const [postDescription, setPostDescription] = useState('');
  const router = useRouter();
  const { toast } = useToast();

  const updateBoardSlug = (value) => {
    const finalSlug = slugify(value, {
      lower: true,
      trim: false,
      strict: true
    });
    setBoardSlug(finalSlug.slice(0, 35));
  };

  const createBoard = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/boards/create-board', {
        method: 'POST',
        headers: {
          "x-org-slug": params.slug,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: boardName, description: boardDescription, slug: boardSlug })
      });
      const respData = await response.json();

      if (response.ok) {
        toast({ title: 'Board created successfully!' });
        setBoardSlug(respData.slug)
        setStep(2);
      } else {
        toast({ title: respData.message, variant: 'destructive' });
      }
    } catch (err) {
      console.error(err);
      toast({ title: 'Failed to create board', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const createPost = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/posts/create-post', {
        method: 'POST',
        headers: {
          "x-org-slug": params.slug,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: postTitle,
          description: postDescription,
          boardSlug: boardSlug,
          status: 'OPEN',
          attachments: []
        })
      });
      const respData = await response.json();

      if (response.ok) {
        toast({ title: 'Post created successfully!' });
        router.push(`/${params.slug}/boards/${boardSlug}/posts`);
      } else {
        toast({ title: respData.message, variant: 'destructive' });
      }
    } catch (err) {
      console.error(err);
      toast({ title: 'Failed to create post', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{step === 1 ? "Create Your First Board" : "Create Your First Post"}</DialogTitle>
          <DialogDescription>
            {step === 1 ? "Let's start by creating a board for your projects." : "Great! Now let's add your first post to the board."}
          </DialogDescription>
        </DialogHeader>
        {step === 1 ? (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="boardName" className="text-right">Name</Label>
              <Input
                id="boardName"
                value={boardName}
                onChange={(e) => {
                  setBoardName(e.target.value);
                  updateBoardSlug(e.target.value);
                }}
                placeholder="e.g., 💡 Features"
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="boardDescription" className="text-right">Description</Label>
              <Input
                id="boardDescription"
                value={boardDescription}
                onChange={(e) => setBoardDescription(e.target.value)}
                placeholder="A place to collect all project ideas"
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="boardSlug" className="text-right">Slug</Label>
              <Input
                id="boardSlug"
                value={boardSlug}
                onChange={(e) => setBoardSlug(e.target.value)}
                placeholder="features"
                className="col-span-3"
              />
            </div>
          </div>
        ) : (
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="postTitle">Title</Label>
              <Input
                id="postTitle"
                value={postTitle}
                onChange={(e) => setPostTitle(e.target.value)}
                placeholder="e.g., Dark mode"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="postDescription">Description</Label>
              <Textarea
                id="postDescription"
                value={postDescription}
                onChange={(e) => setPostDescription(e.target.value)}
                placeholder="Dark mode to make it look soothing to eyes."
                rows={4}
              />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button onClick={step === 1 ? createBoard : createPost} disabled={isLoading}>
            {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
            {step === 1 ? "Create Board" : "Create Post"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingWorkflow;
