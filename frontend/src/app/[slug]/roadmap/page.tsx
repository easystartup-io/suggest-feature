"use client"

import { Icons } from "@/components/icons";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import withAuth from '@/hoc/withAuth';
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { ExternalLink } from "lucide-react";


const Dashboard: React.FC = ({ params }) => {
  const { toast } = useToast()

  const [data, setData] = useState(null)
  const [isLoading, setLoading] = useState(true)
  const [defaultValues, setDefaultValues] = useState({})
  const form = useForm({ defaultValues })
  const { reset } = form; // Get reset function from useForm

  useEffect(() => {
    fetch(`/api/auth/pages/fetch-org`, {
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

      const resp = await fetch(`/api/auth/pages/edit-roadmap`, {
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
          title: 'Updated successfully',
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

  // if (isLoading) return <p>Loading...</p>
  if (!data) return <p>Loading ...</p>


  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 h-full">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Roadmap - {data && data.name}</h1>
      </div>
      <div
        className="flex flex-1 justify-center rounded-lg border border-dashed shadow-sm"
      >
        <div className="w-full p-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="customDomain"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custom Domain</FormLabel>
                    <FormControl>
                      <Input disabled={isLoading} placeholder="feature-request.yourdomain.com" {...field} />
                    </FormControl>
                    <FormDescription>
                      This is the custom domain for the page. You have to setup a CNAME mapping in your DNS server to our domain widget.suggestfeature.com .
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading}>
                {isLoading &&
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                }
                Save
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </main>
  )
}
export default withAuth(Dashboard);

