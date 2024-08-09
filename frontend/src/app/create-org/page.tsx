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

const CreateOrgForm: React.FC = ({ }) => {
  const [orgName, setOrgName] = useState('')
  const [orgSlug, setOrgSlug] = useState('')

  useEffect(() => {
    // Set org slug based on the org name, all lower case and all special characters removed and spaces replaced with -
    // Example: "Example Org" => "example-org"
    // Limit max length to 20 characters
    setOrgSlug(orgName.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s/g, '-').slice(0, 35))

    // allow to edit slug if user has entered manually
    if (orgSlug !== orgName.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s/g, '-').slice(0, 35)) {
      setOrgSlug(orgName.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s/g, '-').slice(0, 35))
    }

  }), [orgName]

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
              onChange={(e) => setOrgName(e.target.value)}
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
              onChange={(e) => setOrgSlug(e.target.value)}
              placeholder="example-org"
              required
            />
          </div>
          <Button type="submit" className="w-full">
            Create Organization
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default withAuth(CreateOrgForm)
