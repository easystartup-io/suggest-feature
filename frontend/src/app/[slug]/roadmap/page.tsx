"use client"

import { Icons } from "@/components/icons";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import withAuth from '@/hoc/withAuth';
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox"
import { ExternalLink } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Elsie_Swash_Caps } from "next/font/google";


const Dashboard: React.FC = ({ params }) => {
  const { toast } = useToast()

  const [data, setData] = useState(null)
  const [isLoading, setLoading] = useState(true)
  const [defaultValues, setDefaultValues] = useState({})
  const form = useForm({ defaultValues })
  const [disabledBoards, setDisabledBoards] = useState([])
  const [boards, setBoards] = useState([])
  const [enableRoadmap, setEnableRoadmap] = useState(true)
  const [title, setTitle] = useState('')
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
        if (data.roadmapSettings) {
          setDisabledBoards(data.roadmapSettings.disabledBoards || [])
          setEnableRoadmap(data.roadmapSettings.enabled)
          setTitle(data.roadmapSettings.title || '')
        } else {
          setEnableRoadmap(true)
        }
        reset(data)
        setLoading(false)
      })

    fetch(`/api/auth/boards/fetch-boards`, {
      headers: {
        "x-org-slug": params.slug
      }
    })
      .then((res) => res.json())
      .then((data) => {
        setBoards(data)
        setLoading(false)
      })

  }, [params.id, params.slug, reset])

  async function onSubmit(data) {
    setLoading(true)
    try {

      const reqPayload = { ...data }
      if (reqPayload.roadmapSettings) {
        reqPayload.roadmapSettings.disabledBoards = disabledBoards || []
        reqPayload.roadmapSettings.enabled = enableRoadmap
        reqPayload.roadmapSettings.title = title
      } else {
        reqPayload.roadmapSettings = { disabledBoards: disabledBoards, enabled: enableRoadmap, title: title }
      }

      const resp = await fetch(`/api/auth/pages/edit-roadmap`, {
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
        if (respData.roadmapSettings) {
          setDisabledBoards(respData.roadmapSettings.disabledBoards || [])
          setEnableRoadmap(data.roadmapSettings.enabled)
          setTitle(data.roadmapSettings.title || '')
        } else {
          setEnableRoadmap(true)
        }
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
              <div className="flex items-center space-x-2">
                <Label htmlFor="enabel-roadmap">Enable Roadmap</Label>
                <Switch id="enable-roadmap"
                  disabled={isLoading}
                  checked={enableRoadmap}
                  onCheckedChange={(checked) => setEnableRoadmap(checked)}
                  className="ml-4" />
              </div>
              <div className="space-y-2">
                <FormLabel>Roadmap Title</FormLabel>
                <Input disabled={isLoading} placeholder="Roadmap"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <FormDescription>
                  The homepage is called the Roadmap. Select a different title for your homepage.
                </FormDescription>
              </div>
              <div className="space-y-2">
                <FormLabel>Include boards</FormLabel>
                {
                  boards && boards.map((board) => (
                    <div className="flex items-center space-x-2" key={board.id}>
                      <Checkbox
                        id={board.id}
                        onCheckedChange={(checked) => {
                          checked ? setDisabledBoards(disabledBoards.filter((id) => id !== board.id)) : setDisabledBoards([...disabledBoards, board.id])
                        }}
                        checked={!disabledBoards.includes(board.id)}
                        disabled={isLoading}
                      />
                      <label
                        htmlFor={board.id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {board.name}
                      </label>
                    </div>
                  ))
                }
              </div>
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

