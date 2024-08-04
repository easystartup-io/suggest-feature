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

const Dashboard: React.FC = ({ params }) => {
  const { toast } = useToast()

  const [data, setData] = useState(null)
  const [isLoading, setLoading] = useState(true)
  const [defaultValues, setDefaultValues] = useState({})
  const form = useForm({ defaultValues })
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
        reset(data)
        setLoading(false)
      })
  }, [params.id, params.slug, reset])

  async function onSubmit(data) {
    setLoading(true)
    try {

      const resp = await fetch(`/api/auth/user/update-user`, {
        method: 'POST',
        headers: {
          "x-org-slug": params.slug,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      const respData = await resp.json();
      if (resp.ok) {
        setData(respData)
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
              <Button type="submit" disabled={isLoading}>
                {isLoading &&
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                }
                Update profile
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </main>
  )
}
export default withAuth(Dashboard);

