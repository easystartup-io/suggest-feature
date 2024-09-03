"use client"

import { Button } from "@/components/ui/button"
import withAuth from '@/hoc/withAuth';
import { useContext, useEffect, useState } from "react";
import { SidebarContext } from "@/app/[slug]/layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input"
import router from "next/router";
import { useFieldArray, useForm } from "react-hook-form"
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Icons } from "@/components/icons";
import { useToast } from "@/components/ui/use-toast"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import FileUploadButton from "@/components/FileButton";

const Dashboard: React.FC = ({ params }) => {
  const { toast } = useToast()

  const [data, setData] = useState(null)
  const [isLoading, setLoading] = useState(true)
  const [defaultValues, setDefaultValues] = useState({})
  const form = useForm({ defaultValues })
  const [profilePic, setProfilePic] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadedFileUrl, setUploadedFileUrl] = useState('')
  const { reset } = form; // Get reset function from useForm

  useEffect(() => {
    fetch(`/api/auth/user`, {
      headers: {
        "x-org-slug": params.slug
      }
    })
      .then((res) => res.json())
      .then((data) => {
        setData(data)
        setProfilePic(data.profilePic)
        reset(data)
        setLoading(false)
      })
  }, [params.id, params.slug, reset])

  async function onSubmit(data) {
    setLoading(true)
    try {

      const reqData = {
        ...data,
        profilePic: uploadedFileUrl || profilePic
      }
      const resp = await fetch(`/api/auth/user/update-user`, {
        method: 'POST',
        headers: {
          "x-org-slug": params.slug,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reqData)
      });
      const respData = await resp.json();
      if (resp.ok) {
        setData(respData)
        setProfilePic(respData.profilePic)
        reset(respData)
        toast({
          title: 'Profile updated successfully',
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
        description: 'Please try again by reloading the page, if the problem persists contact support',
        variant: 'destructive'
      })
    }
    setTimeout(() => { setLoading(false) }, 1000)
  }


  if (!data) return <p>No profile data</p>


  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Profile settings</h1>
      </div>
      <div
        className="flex flex-1 justify-center rounded-lg border border-dashed shadow-sm"
      >
        <div className="w-full p-4">
          <div className="flex items-center space-x-4 my-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={uploadedFileUrl || data.profilePic} alt="Profile" />
              <AvatarFallback>
                {(() => {
                  const name = data.name || data.email.split('@')[0];
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
            <FileUploadButton uploading={uploading} setUploading={setUploading} uploadedFileUrl={uploadedFileUrl} setUploadedFileUrl={setUploadedFileUrl} />
            {/* <Button variant="outline">Upload image</Button> */}
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input disabled={isLoading} placeholder="Name" {...field} />
                    </FormControl>
                    <FormDescription>
                      Your full name
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input disabled={true} placeholder="Email" {...field} />
                    </FormControl>
                    <FormDescription>
                      Your registerd email
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div
                className="flex justify-end"
              >
                <Button
                  type="submit" disabled={isLoading || uploading}>
                  {(isLoading || uploading) &&
                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                  }
                  {uploading ? 'Uploading...' : 'Update profile'}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </main>
  )
}
export default withAuth(Dashboard);

