"use client"

import { Button } from "@/components/ui/button"
import withAuth from '@/hoc/withAuth';
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input"
import { useForm } from "react-hook-form"
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Icons } from "@/components/icons";
import { useToast } from "@/components/ui/use-toast"
import { ExternalLink, Telescope, Trash2 } from "lucide-react";
import { useRouter } from 'next/navigation'
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils";

const Dashboard: React.FC = ({ params }) => {
  const { toast } = useToast()
  const router = useRouter();

  const [data, setData] = useState(null)
  const [org, setOrg] = useState(null)
  const [isLoading, setLoading] = useState(true)
  const [defaultValues, setDefaultValues] = useState({})
  const form = useForm({ defaultValues })
  const { reset, setValue, watch } = form;
  const watchSlug = watch('slug', "")
  const watchName = watch('name', "")
  const [privateBoard, setPrivateBoard] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deleteConfirmName, setDeleteConfirmName] = useState("")

  const updateSlug = (value: string) => {
    setValue("slug", value.toLowerCase().replace(/[^a-zA-Z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-/g, '').slice(0, 35))
  }

  useEffect(() => {
    updateSlug(watchSlug)
  }, [watchSlug])

  useEffect(() => {
    updateSlug(watchName)
  }, [watchName])

  useEffect(() => {
    fetch(`/api/auth/boards/fetch-board?boardSlug=${params.id}`, {
      headers: {
        "x-org-slug": params.slug
      }
    })
      .then((res) => res.json())
      .then((data) => {
        setData(data)
        setPrivateBoard(data.privateBoard)
        reset(data)
        setLoading(false)
      })

    fetch(`/api/auth/pages/fetch-org`, {
      headers: {
        "x-org-slug": params.slug
      }
    })
      .then((res) => res.json())
      .then((data) => {
        setOrg(data)
      })
  }, [params.id, params.slug, reset])

  async function onSubmit(data) {
    setLoading(true)
    try {
      const reqPayload = { ...data, privateBoard: privateBoard }

      const resp = await fetch(`/api/auth/boards/create-board`, {
        method: 'POST',
        headers: {
          "x-org-slug": params.slug,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reqPayload)
      });
      const respData = await resp.json();
      if (resp.ok) {
        setData(respData)
        setPrivateBoard(respData.privateBoard)
        let toastTitle = 'Board updated successfully'
        if (respData.slug !== params.id) {
          toastTitle = 'Your board url has been updated. You are being redirected'
          setTimeout(() => {
            router.push(`/${params.slug}/boards/${respData.slug}`)
          }, 1000)
        }
        reset(respData)
        toast({
          title: toastTitle
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
        description: 'Please try again by reloading the board, if the problem persists contact support',
        variant: 'destructive'
      })
    }
    setTimeout(() => { setLoading(false) }, 1000)
  }

  const handleDeleteBoard = async () => {
    if (deleteConfirmName !== data.name) {
      toast({
        title: "Board name doesn't match",
        description: "Please enter the correct board name to delete.",
        variant: 'destructive'
      })
      return
    }

    setLoading(true)
    try {
      const resp = await fetch(`/api/auth/boards/delete-board`, {
        method: 'POST',
        headers: {
          "x-org-slug": params.slug,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ boardSlug: data.slug })
      });

      if (resp.ok) {
        toast({
          title: 'Board deleted successfully',
          description: 'You will be redirected to the boards list.'
        })
        setTimeout(() => {
          router.push(`/${params.slug}/boards`)
        }, 1000)
      } else {
        const errorData = await resp.json();
        toast({
          title: 'Failed to delete board',
          description: errorData.message || 'An error occurred while deleting the board.',
          variant: 'destructive'
        })
      }
    } catch (err) {
      console.error(err)
      toast({
        title: 'Something went wrong',
        description: 'Please try again. If the problem persists, contact support.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
      setIsDeleteDialogOpen(false)
    }
  }

  if (!data || !org) return <p>No board data</p>

  return (
    <div>
      <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold md:text-2xl">Board - {data && data.name}</h1>
          <div className="flex gap-2">
            <Button
              onClick={() => router.push(`/${params.slug}/boards/${params.id}/posts`)}
              className="flex items-center gap-2"
            >
              <Telescope className="" />
              View Posts
            </Button>
          </div>
        </div>
        <div
          className="flex flex-1 justify-center rounded-lg border border-dashed shadow-sm"
        >
          <div className="w-full p-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input disabled={isLoading} placeholder="name" {...field} />
                      </FormControl>
                      <FormDescription>
                        This is the board name. It will be displayed for you to identify here
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input disabled={isLoading} placeholder="Please input all your feature requests" {...field} />
                      </FormControl>
                      <FormDescription>
                        This is the board description.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug</FormLabel>
                      <FormControl>
                        <Input disabled={isLoading} placeholder="Please input the slug" {...field} />
                      </FormControl>
                      <FormDescription>
                        <p>
                          This is the board slug. It should be unique in your org and can only contain letters, numbers, and hyphens.
                        </p>

                        <p>
                          Your page will be accessible at {
                            org && org.customDomain ? <a href={`https://${org.customDomain}/b/${field.value}`} target="_blank"
                              className="inline-block hover:text-indigo-700">
                              https://{org.customDomain}/b/{field.value}<ExternalLink className="ml-1 h-4 w-4 inline-block" />
                            </a>
                              : <a href={`https://${org.slug}.suggestfeature.com/b/${field.value}`} target="_blank"
                                className="inline-block hover:text-indigo-700">
                                https://{org.slug}.suggestfeature.com/b/{field.value}<ExternalLink className="ml-1 h-4 w-4 inline-block" />
                              </a>
                          }
                        </p>

                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex items-center space-x-2 my-4">
                  <Label htmlFor="private-board">Public board</Label>
                  <Switch id="private-board"
                    className="ml-4 data-[state=checked]:bg-green-500"
                    disabled={isLoading}
                    checked={!privateBoard}
                    onCheckedChange={(checked) => setPrivateBoard(!checked)}
                  />
                </div>

                <Button type="submit" disabled={isLoading}>
                  {isLoading &&
                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                  }
                  Update board
                </Button>
              </form>
            </Form>
          </div>
        </div>

      </main>
      <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
        <div
          className="flex flex-1 justify-center rounded-lg border border-dashed shadow-sm w-full"
        >
          <div className="flex flex-col w-full p-4">
            <div>
              <Label htmlFor="delete-board">Delete board</Label>
              <p
                className={cn("text-sm text-muted-foreground")}
              >
                This action cannot be undone. This will permanently delete the board and all its associated data.
              </p>
              <Button
                onClick={() => setIsDeleteDialogOpen(true)}
                variant="destructive"
                className="flex items-center gap-2 mt-2 mb-4"
              >
                <Trash2 className="h-4 w-4" />
                Delete Board
              </Button>
            </div>
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the board
                    and all its associated data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="my-4">
                  <Label htmlFor="confirmBoardName">Enter the board name &apos;{data.name}&apos; to confirm deletion:</Label>
                  <Input
                    id="confirmBoardName"
                    value={deleteConfirmName}
                    onChange={(e) => setDeleteConfirmName(e.target.value)}
                    placeholder="Enter board name"
                    className="mt-2"
                  />
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteBoard} disabled={deleteConfirmName !== data.name}>
                    Delete Board
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </main>
    </div>
  )
}

export default withAuth(Dashboard);
