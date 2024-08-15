"use client"

import { Button } from "@/components/ui/button"
import withAuth from '@/hoc/withAuth';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from "next/navigation"
import { useContext, useEffect, useState } from "react";
import { SidebarContext } from "../layout";
import { TableHeader, TableRow, TableHead, TableBody, TableCell, TableCaption, Table } from "@/components/ui/table";
import { Icons } from "@/components/icons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DialogHeader, DialogFooter } from "@/components/ui/dialog";
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/components/ui/use-toast";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";


function DialogDemo({ params, setData }) {
  const [isLoading, setLoading] = useState(false)
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [role, setRole] = useState('USER');
  const router = useRouter();

  const { toast } = useToast()

  const onSubmit = async (e) => {
    console.log(params)
    e.preventDefault();
    setLoading(true)
    try {
      const response = await fetch('/api/auth/user/create-member', {
        method: 'POST',
        headers: {
          "x-org-slug": params.slug,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, role })
      })
      const respData = await response.json();

      if (response.ok) {
        setIsOpen(false)
        toast({
          title: 'Member added',
        })
        setData(respData)
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
        <Button onClick={() => setIsOpen(true)}>Invite Member</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Invite member</DialogTitle>
          <DialogDescription>
            Invite a member to your organization
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
              placeholder="Tony Stark"
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              placeholder="tony@starkindustries.com"
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Role
            </Label>
            <Select
              value={role}
              onValueChange={(value) => setRole(value)}
            >
              <SelectTrigger className="col-span-3 w-full">
                {role === 'USER' ? 'User' : 'Admin'}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USER">User</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={onSubmit} disabled={isLoading}>
            {isLoading && (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            )}
            Invite member
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


function AlertDialogDemo({ onConfirm }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="icon" > <Trash2 /></Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure you want to remove member?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will delete the member user from your organization and will lose all access to this org.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

const Dashboard: React.FC = ({ params }) => {
  const { user, logout } = useAuth();
  const router = useRouter();

  const { toast } = useToast()

  const [data, setData] = useState(null)
  const [isLoading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/auth/user/fetch-members', {
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

  const onDeleteMember = async (memberId) => {
    // setLoading(true)
    try {
      const response = await fetch(`/api/auth/user/delete-member?memberId=${memberId}`, {
        method: 'POST',
        headers: {
          "x-org-slug": params.slug,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      })
      const respData = await response.json();

      if (response.ok) {
        setData(respData)
        toast({
          title: 'Member removed',
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

  if (isLoading) return <p>Loading...</p>
  if (!data) return <p>No profile data</p>

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Members</h1>
        <DialogDemo params={params} setData={setData} />
      </div>
      <div
        className="flex flex-1 justify-center rounded-lg border border-dashed shadow-sm" x-chunk="dashboard-02-chunk-1"
      >
        <Table>
          <TableCaption>Members of your organization</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data && data.length && data.map((item, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{item.user.name}</TableCell>
                <TableCell>{item.user.email}</TableCell>
                <TableCell>{item.role}</TableCell>
                <TableCell className="text-right ">
                  {user && user.id !== item.userId && <AlertDialogDemo onConfirm={() => onDeleteMember(item.id)} />}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </main>
  )
}
export default withAuth(Dashboard);

