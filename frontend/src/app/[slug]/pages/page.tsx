"use client"

import { Button } from "@/components/ui/button"
import withAuth from '@/hoc/withAuth';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from "next/navigation"
import { useContext, useEffect, useState } from "react";
import { SidebarContext } from "../layout";
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
  const router = useRouter();

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
      const respData = await response.json();

      if (response.ok) {
        setIsOpen(false)
        router.push(`/${params.slug}/pages/${respData.id}`)
        toast({
          title: 'Page created',
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

  const updateSlug = (value: string) => {
    // Set org slug based on the org name, all lower case and all special characters removed and spaces replaced with -
    // Example: "Example Org" => "example-org"
    // Example: "Example Org" => "example-org"
    // Example: "hello-how-do-you-do" => "hello-how-do-you-do"
    // Example: "-hello-how-do-you-do" => "hello-how-do-you-do"
    // Example: "-hello-how-do-you-do-" => "hello-how-do-you-do"
    // Limit max length to 35 characters 
    // replace all special characters with - and replace multiple - with single -
    setSlug(value.toLowerCase().replace(/[^a-zA-Z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-/g, '').slice(0, 35))
  }

  return (
    <Dialog open={isOpen} onClose={() => setIsOpen(false)} onOpenChange={setIsOpen} >
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
              onChange={(e) => updateSlug(e.target.value)}
              disabled={isLoading}
              className="col-span-3"
            />
          </div>
          {
            slug && slug.length > 2 && slug.trim().length > 2 &&
            <div className="text-sm text-muted-foreground items-center gap-4 flex justify-end">
              <div>
                <p>{slug}.suggestfeature.com</p>
              </div>
            </div>
          }
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
  }, [params.slug])


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
                      href={`https://${page.customDomain || `${page.slug}.suggestfeature.com`}`}
                      target="_blank"
                      className={`flex items-center gap-4 hover:text-indigo-700`}
                    >
                      {page.customDomain || `${page.slug}.suggestfeature.com`}
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

