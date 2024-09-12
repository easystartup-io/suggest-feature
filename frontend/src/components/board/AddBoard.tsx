
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { useState } from "react";
import slugify from 'slugify';

slugify.extend({ '@': 'at' })

export default function AddBoardDialog({ params }) {
  const [isLoading, setLoading] = useState(false)
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [slug, setSlug] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const updateSlug = (value: string) => {
    // Set org slug based on the org name, all lower case and all special characters removed and spaces replaced with -
    // Example: "Example Org" => "example-org"
    // Example: "Example Org" => "example-org"
    // Example: "hello-how-do-you-do" => "hello-how-do-you-do"
    // Example: "-hello-how-do-you-do" => "hello-how-do-you-do"
    // Example: "-hello-how-do-you-do-" => "hello-how-do-you-do"
    // Limit max length to 35 characters 
    // replace all special characters with - and replace multiple - with single -
    // setSlug(value.toLowerCase().replace(/[^a-zA-Z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-/g, '').slice(0, 35))
    const finalSlug = slugify(value, {
      lower: true,
      trim: false,
      strict: true
    })
    setSlug(finalSlug.slice(0, 35))
  }

  const { toast } = useToast()

  const onSubmit = async (e) => {
    console.log(params)
    e.preventDefault();
    setLoading(true)
    try {
      const response = await fetch('/api/auth/boards/create-board', {
        method: 'POST',
        headers: {
          "x-org-slug": params.slug,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, description, slug })
      })
      const respData = await response.json();

      if (response.ok) {
        setIsOpen(false)
        router.push(`/${params.slug}/boards/${respData.slug}`)
        toast({
          title: 'Board created',
        })
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
        <Button onClick={() => setIsOpen(true)}>Add Board</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add board</DialogTitle>
          <DialogDescription>
            Add board to your organization
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              value={name}
              placeholder="Feature requests"
              onChange={(e) => {
                setName(e.target.value);
                updateSlug(e.target.value);
              }}
              disabled={isLoading}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Description
            </Label>
            <Input
              id="description"
              value={description}
              placeholder="Features which you want"
              onChange={(e) => setDescription(e.target.value)}
              disabled={isLoading}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="slug" className="text-right">
              Slug
            </Label>
            <Input
              id="slug"
              value={slug}
              placeholder="Board slug"
              onChange={(e) => updateSlug(e.target.value)}
              disabled={isLoading}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={onSubmit} disabled={isLoading}>
            {isLoading && (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            )}
            Create board
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
