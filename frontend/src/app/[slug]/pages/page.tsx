"use client"

import { Button } from "@/components/ui/button"
import withAuth from '@/hoc/withAuth';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from "next/navigation"
import { useContext, useEffect, useState } from "react";
import { SidebarContext } from "@/app/[slug]/layout";
import { TableHeader, TableRow, TableHead, TableBody, TableCell, TableCaption, Table } from "@/components/ui/table";
// Import Link from lucide-react as ExternalLink
import { Link as ExternalLink2, ExternalLink, Settings } from "lucide-react"
import Link from "next/link"
import { DialogHeader, DialogFooter } from "@/components/ui/dialog";
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Icons } from "@/components/icons";

function DialogDemo({ params }) {
  const [isLoading, setLoading] = useState(false)
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter()

  const { toast } = useToast()

  const onSubmit = async (e) => {
    console.log(params)
    e.preventDefault();
    setLoading(true)
    try {
      const response = await fetch('/api/auth/pages/create-page', {
        method: 'POST',
        headers: {
          "x-org-slug": params.slug,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, slug })
      })
      if (response.status === 400) {
        const text = await response.text();
        toast({
          title: text,
          variant: 'destructive'
        })
      }
      if (response.ok) {
        const data = await response.json()
        setIsOpen(false)
        router.push(`/${params.slug}/pages/${data.id}`)
      } else {
        console.log(response)
        throw new Error('Something went wrong')
      }
    } catch (err) {
      console.log(err)
    }

    setTimeout(() => {
      setLoading(false)
    }, 1000)
  }

  return (
    <Dialog open={isOpen} onClose={() => setIsOpen(false)} >
      <DialogTrigger asChild>
        <Button onClick={() => setIsOpen(true)}>Add Page</Button>

      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add page</DialogTitle>
          <DialogDescription>
            Add page to your organization
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
              placeholder="Features"
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="username" className="text-right">
              Slug
            </Label>
            <Input
              id="slug"
              value={slug}
              placeholder="org-name"
              onChange={(e) => setSlug(e.target.value)}
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
            Create page
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const Dashboard: React.FC = ({ params }) => {
  const { logout } = useAuth();
  const router = useRouter();
  let { setCurrentSection } = useContext(SidebarContext);

  useEffect(() => {
    setCurrentSection('pages')
  }, [])

  const [data, setData] = useState(null)
  const [isLoading, setLoading] = useState(true)


  useEffect(() => {
    fetch('/api/auth/pages/fetch-pages', {
      headers: {
        "x-org-slug": params.slug
      }
    })
      .then((res) => res.json())
      .then((data) => {
        setData(data)
        setLoading(false)
      })
  }, [])


  // if (isLoading) return <p>Loading...</p>
  // if (!data) return <p>No profile data</p>

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Pages</h1>
        <DialogDemo params={params} />
      </div>
      <div
        className="flex flex-1 justify-center rounded-lg border border-dashed shadow-sm" x-chunk="dashboard-02-chunk-1"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="flex items-center gap-4">Url<ExternalLink2 className="w-5 h-5"></ExternalLink2></TableHead>
              <TableHead>

              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data && data.map((page) => {
              return (
                <TableRow key={page.id} className="cursor-pointer">
                  <TableCell>{page.name}</TableCell>
                  <TableCell className="">
                    <Link
                      href={`https://google.com`}
                      target="_blank"
                      className={`flex items-center gap-4 hover:text-indigo-700`}
                    >
                      {page.slug}
                      <ExternalLink className="w-5 h-5" />
                    </Link>
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link
                      href={`/${params.slug}/pages/${page.id}`}
                      className="flex items-center gap-4 hover:text-indigo-700"
                    >
                      <Settings className="w-5 h-5" />
                    </Link>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </main>
  )
}
export default withAuth(Dashboard);

