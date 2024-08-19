"use client"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useEffect, useState } from "react"
import withAuth from "@/hoc/withAuth"
import { log } from "console"
import { API_BASE_URL, useAuth } from "@/context/AuthContext"
import { Icons } from "@/components/icons"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"

const CreateOrgForm: React.FC = ({ }) => {
  const [orgName, setOrgName] = useState('')
  const [orgSlug, setOrgSlug] = useState('')
  const [isLoading, setLoading] = useState(false)
  const router = useRouter();
  const { toast } = useToast();


  const submit = async () => {
    setLoading(true)
    const fixedOrgSlug = orgSlug.replace(/-$/g, '');
    setOrgSlug(fixedOrgSlug)
    const response = await fetch(`${API_BASE_URL}/api/auth/user/create-org`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // credentials: 'include',
      body: JSON.stringify({ organizationName: orgName, organizationSlug: fixedOrgSlug })
    });

    if (response.ok) {
      const { slug } = await response.json();
      if (slug && slug.length > 0) {
        router.push(`/${slug}/dashboard`);
      } else {
        router.push(`/create-org`);
      }
    } else {
      toast({
        variant: "destructive",
        title: "Slug already exists. Try a different slug.",
      });

      console.error('Slug already exists')
    }

    setTimeout(() => {
      setLoading(false)
    }, 1000)
  };

  const updateSlug = (value: string) => {
    // Set org slug based on the org name, all lower case and all special characters removed and spaces replaced with -
    // Example: "Example Org" => "example-org"
    // Example: "Example Org" => "example-org"
    // Example: "hello-how-do-you-do" => "hello-how-do-you-do"
    // Example: "-hello-how-do-you-do" => "hello-how-do-you-do"
    // Example: "-hello-how-do-you-do-" => "hello-how-do-you-do"
    // Limit max length to 35 characters 
    // replace all special characters with - and replace multiple - with single -
    setOrgSlug(value.toLowerCase().replace(/[^a-zA-Z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-/g, '').slice(0, 35))
  }

  return (
    <Card className="mx-auto max-w-sm mt-20">
      <CardHeader>
        <CardTitle className="text-2xl">Create new organization</CardTitle>
        <CardDescription>
          Create new organization to manage your feedback and roadmap.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="orgName">Organization Name</Label>
            <Input
              id="orgName"
              type="text"
              value={orgName}
              onChange={(e) => {
                setOrgName(e.target.value)
                updateSlug(e.target.value)
              }}
              placeholder="Example Org"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="orgSlug">Organization Slug</Label>
            <Input
              id="orgSlug"
              type="text"
              value={orgSlug}
              onChange={(e) => updateSlug(e.target.value)}
              placeholder="example-org"
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading} onClick={submit}>
            {isLoading && (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            )}
            Create Organization
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default withAuth(CreateOrgForm)
