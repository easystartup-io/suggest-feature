
import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"

function Login({ setCurrentTab }) {
  return (
    <>
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="m@example.com"
            required
          />
        </div>
        <div className="grid gap-2">
          <div className="flex items-center">
            <Label htmlFor="password">Password</Label>
            <Link href="#" className="ml-auto inline-block text-sm underline">
              Forgot your password?
            </Link>
          </div>
          <Input id="password" type="password" required />
        </div>
        <Button type="submit" className="w-full">
          Login
        </Button>
        <Button variant="outline" className="w-full">
          Login with Google
        </Button>
      </div>
      <div className="mt-4 text-center text-sm">
        Don&apos;t have an account?{" "}
        <div className="underline inline-block cursor-pointer" onClick={() => setCurrentTab("sign-up")}>
          Sign up
        </div>
      </div>
    </>
  )
}

function SignUp({ setCurrentTab }) {
  return (
    <>
      <div className="grid gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="first-name">First name</Label>
            <Input id="first-name" placeholder="Max" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="last-name">Last name</Label>
            <Input id="last-name" placeholder="Robinson" required />
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="m@example.com"
            required
          />
        </div>
        <div className="grid gap-2">
          <div className="flex items-center">
            <Label htmlFor="password">Password</Label>
            <Link href="#" className="ml-auto inline-block text-sm underline">
              Forgot your password?
            </Link>
          </div>
          <Input id="password" type="password" required />
        </div>
        <Button type="submit" className="w-full">
          Login
        </Button>
        <Button variant="outline" className="w-full">
          Login with Google
        </Button>
      </div>
      <div className="mt-4 text-center text-sm">
        Already have an account?{" "}
        <div className="underline inline-block cursor-pointer" onClick={() => setCurrentTab("login")}>
          Sign in
        </div>
      </div>
    </>
  )
}


export default function DialogCloseButton() {
  const [currentTab, setCurrentTab] = useState("login")
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" >Log in</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{currentTab === "login" ? 'Login' : 'Sign Up'}</DialogTitle>
          <DialogDescription>
            {currentTab === "login" ? 'Enter your email below to login to your account' : 'Enter your information to create an account'}
          </DialogDescription>
        </DialogHeader>
        <div className="">
          {currentTab === "login" ? <Login setCurrentTab={setCurrentTab} /> : <SignUp setCurrentTab={setCurrentTab} />}
        </div>
      </DialogContent>
    </Dialog>
  )
}

