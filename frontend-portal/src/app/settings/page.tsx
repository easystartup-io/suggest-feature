"use client"

import FileUploadButton from "@/components/FileButton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/context/AuthContext"
import { useInit } from "@/context/InitContext"
import { useEffect, useState } from "react"
import Loading from "@/components/Loading"
import { Icons } from "@/components/icons"
import { useToast } from "@/components/ui/use-toast"


export default function Dashboard({ params }) {
  const [posts, setPosts] = useState([]);
  const { org, boards } = useInit()
  const [name, setName] = useState('')
  const [profilePic, setProfilePic] = useState('')
  const { user, loading } = useAuth();
  const [uploading, setUploading] = useState(false)
  const [uploadedFileUrl, setUploadedFileUrl] = useState('')
  const [saveLoading, setSaveLoading] = useState(false)
  const { toast } = useToast()

  const onSubmit = async (e) => {
    e.preventDefault()
    setSaveLoading(true)
    const host = window.location.host
    const protocol = window.location.protocol // http: or https:
    try {
      const res = await fetch(`${protocol}//${host}/api/portal/auth/update-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          profilePic: uploadedFileUrl || profilePic
        }),
      });
      const respData = await res.json()

      if (res.ok) {
        toast({
          title: 'Profile updated',
        })
      } else {
        toast({
          title: 'Failed to update',
          description: respData.message,
          variant: 'destructive'
        })
      }

    } catch (e) {
      console.log(e)
      toast({
        title: 'Failed to update',
        description: e.message,
        variant: 'destructive'
      })
    }
    setTimeout(() => {
      setSaveLoading(false)
    }, 1000)
  }

  useEffect(() => {
    if (!user) {
      return;
    }
    setName(user.name)
    setProfilePic(user.profilePic)
  }, [user])

  if (!user && loading) {
    return <div>
      <Loading />
    </div>
  }

  if (!user && !loading) {
    return <div className="h-screen w-full flex items-center justify-center font-bold text-2xl">
      Not logged in
    </div>
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={uploadedFileUrl || user.profilePic} alt="Profile" />
                <AvatarFallback>
                  {(() => {
                    const name = user.name || user.email.split('@')[0];
                    const words = name.split(' ');

                    let initials;

                    if (words.length > 1) {
                      // If the name has multiple words, take the first letter of each word
                      initials = words.map(word => word[0]).join('').toUpperCase();
                    } else {
                      // If it's a single word, take the first two characters
                      initials = name.slice(0, 2).toUpperCase();
                    }

                    // Ensure it returns exactly 2 characters
                    return initials.length >= 2 ? initials.slice(0, 2) : initials.padEnd(2, initials[0]);
                  })()}
                </AvatarFallback>
              </Avatar>
              <FileUploadButton uploading={uploading} setUploading={setUploading} uploadedFileUrl={uploadedFileUrl} setUploadedFileUrl={setUploadedFileUrl} />
              {/* <Button variant="outline">Upload image</Button> */}
            </div>

            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">NAME</label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">EMAIL</label>
              <Input id="email" type="email" value={user.email} disabled={true} />
            </div>

            {/* <div className="space-y-2"> */}
            {/*   <h3 className="text-lg font-semibold">Language Preferences</h3> */}
            {/*   <p className="text-sm text-gray-500">Note: currently only applies to text in user-generated content (posts, comments, etc).</p> */}
            {/*   <Select defaultValue="browser"> */}
            {/*     <SelectTrigger> */}
            {/*       <SelectValue placeholder="Select language" /> */}
            {/*     </SelectTrigger> */}
            {/*     <SelectContent> */}
            {/*       <SelectItem value="browser">Use browser language</SelectItem> */}
            {/*       <SelectItem value="en">English</SelectItem> */}
            {/*       <SelectItem value="fr">French</SelectItem> */}
            {/*       <SelectItem value="de">German</SelectItem> */}
            {/*     </SelectContent> */}
            {/*   </Select> */}
            {/* </div> */}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={onSubmit}
            disabled={saveLoading || uploading}
          >
            {(saveLoading || uploading) && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
            {saveLoading ? 'Saving' : (uploading ? 'Uploading image' : 'Save')}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
