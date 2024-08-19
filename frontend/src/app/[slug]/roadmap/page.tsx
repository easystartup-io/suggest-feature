"use client"

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from '@/context/AuthContext';
import withAuth from '@/hoc/withAuth';
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Icons } from "@/components/icons";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Eye, Settings, Telescope } from "lucide-react";
import Link from "next/link";

function DialogDemo({ params }) {
  const [isLoading, setLoading] = useState(false)
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

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
        body: JSON.stringify({ name, description })
      })
      const respData = await response.json();

      if (response.ok) {
        setIsOpen(false)
        router.push(`/${params.slug}/boards/${respData.id}`)
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
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="username" className="text-right">
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

const Dashboard: React.FC = ({ params }) => {
  const { logout } = useAuth();
  const router = useRouter();

  const [data, setData] = useState(null)
  const [isLoading, setLoading] = useState(true)


  useEffect(() => {
    fetch('/api/auth/boards/fetch-boards', {
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
        <h1 className="text-lg font-semibold md:text-2xl">Boards</h1>
        <DialogDemo params={params} />
      </div>
      <div
        className="flex flex-1 justify-center rounded-lg border border-dashed shadow-sm" x-chunk="dashboard-02-chunk-1"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data && data.map((board) => {
              return (
                <TableRow key={board.id} className="cursor-pointer">
                  <TableCell>{board.name}</TableCell>
                  <TableCell className="text-right items-center">
                    <div className="flex items-center justify-end gap-4">
                      <Button
                        onClick={() => router.push(`/${params.slug}/boards/${board.id}/posts`)}
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <Telescope className="" />
                        View Posts
                      </Button>
                      <Button
                        onClick={() => router.push(`/${params.slug}/boards/${board.id}`)}
                        variant="destructive"
                        className="flex items-center gap-2"
                        size="icon"
                      >
                        <Settings className="" />
                      </Button>
                    </div>
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

