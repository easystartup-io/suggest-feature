"use client"
import React, { useState } from 'react';
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
import withAuth from "@/hoc/withAuth"
import { API_BASE_URL } from "@/context/AuthContext"
import { Icons } from "@/components/icons"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { ImageIcon } from 'lucide-react';
import FileUploadButton from '@/components/FileButton';

const ImageComponent = ({ src, alt, className }) => {
  if (!src) {
    return <ImagePlaceholder className={className} />;
  }
  return (
    <img
      src={src}
      alt={alt}
      className={`object-contain ${className}`}
      onError={(e) => {
        e.target.onerror = null;
        e.target.style.display = 'none';
        e.target.nextSibling.style.display = 'flex';
      }}
    />
  );
};

const ImagePlaceholder = ({ className }) => (
  <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
    <ImageIcon className="w-1/2 h-1/2 text-gray-400" />
  </div>
);

const CreateOrgForm: React.FC = () => {
  const [orgName, setOrgName] = useState('')
  const [orgSlug, setOrgSlug] = useState('')
  const [orgUrl, setOrgUrl] = useState('')
  const [isLoading, setLoading] = useState(false)
  const [isFetching, setFetching] = useState(false)
  const [favicon, setFavicon] = useState('')
  const [logo, setLogo] = useState('')

  const [uploadingFavicon, setUploadingFavicon] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)

  const router = useRouter();
  const { toast } = useToast();

  const submit = async () => {
    setLoading(true)
    const fixedOrgSlug = orgSlug.replace(/-$/g, '');
    setOrgSlug(fixedOrgSlug)
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/user/create-org`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationName: orgName,
          organizationSlug: fixedOrgSlug,
          favicon: favicon,
          logo: logo,
          websiteUrl: orgUrl
        })
      });

      if (response.ok) {
        const { slug } = await response.json();
        if (slug && slug.length > 0) {
          router.push(`/${slug}/dashboard`);
        } else {
          router.push(`/create-org`);
        }
      } else {
        const { message } = await response.json();
        toast({
          variant: "destructive",
          title: message,
        });
      }
    } catch (error) {
      console.error('Error creating organization:', error);
      toast({
        variant: "destructive",
        title: "An error occurred. Please try again.",
      });
    } finally {
      setLoading(false)
    }
  };

  const updateSlug = (value: string) => {
    setOrgSlug(value.toLowerCase().replace(/[^a-zA-Z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-/g, '').slice(0, 35))
  }

  const fetchOrgDetails = async () => {
    setFetching(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/user/fetch-web-page-details`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: orgUrl })
      });

      if (response.ok) {
        const data = await response.json();

        if (!data.favicon && !data.logo && !data.title) {
          toast({
            title: "Sorry, could not extract any data!"
          });
        }

        setFavicon(data.favicon || '');
        setLogo(data.logo || '');
        if (data.title) {
          setOrgName(data.title);
          updateSlug(data.title);
        }
      } else {
        toast({
          variant: "destructive",
          title: "Failed to fetch organization details",
        });
      }
    } catch (error) {
      console.error('Error fetching org details:', error);
      toast({
        variant: "destructive",
        title: "An error occurred while fetching details",
      });
    } finally {
      setFetching(false);
    }
  };

  return (
    <Card className="mx-auto max-w-2xl mt-20">
      <CardHeader>
        <CardTitle className="text-2xl">Create new organization</CardTitle>
        <CardDescription>
          Create new organization to manage your feedback and roadmap.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6">
          <div className="grid gap-2">
            <Label htmlFor="orgUrl">
              Your Organization Website URL (To auto populate logo and favicon) <span className='text-muted-foreground'>(Optional)</span>

            </Label>
            <div className="flex gap-2">
              <Input
                id="orgUrl"
                type="url"
                value={orgUrl}
                onChange={(e) => setOrgUrl(e.target.value)}
                placeholder="example.com"
              />
              <Button onClick={fetchOrgDetails} disabled={isFetching}>
                {isFetching ? <Icons.spinner className="h-4 w-4 animate-spin" /> : "Auto Fetch"}
              </Button>
            </div>
          </div>
          {(favicon || logo) && (
            <div className="grid gap-4">
              <div>
                <Label className="block mb-2">
                  Logo <span className='text-muted-foreground'>(Optional)</span>
                </Label>
                <div className='flex items-center space-x-4'>
                  <div className="min-w-20 h-20">
                    <ImageComponent src={logo} alt="Logo" className="w-full h-full" />
                    <ImagePlaceholder className="w-full h-full hidden" />
                  </div>
                  <div>
                    <FileUploadButton
                      uploading={uploadingLogo}
                      setUploading={setUploadingLogo}
                      setUploadedFileUrl={setLogo}
                      uploadedFileUrl={logo}
                    />
                  </div>
                </div>
              </div>
              <div>
                <Label className="block mb-2">
                  Favicon <span className='text-muted-foreground'>(Optional)</span>
                </Label>
                <div className='flex items-center space-x-4'>
                  <div className="w-20 h-20">
                    <ImageComponent src={favicon} alt="Favicon" className="w-full h-full" />
                    <ImagePlaceholder className="w-full h-full hidden" />
                  </div>
                  <div>
                    <FileUploadButton
                      uploading={uploadingFavicon}
                      setUploading={setUploadingFavicon}
                      setUploadedFileUrl={setFavicon}
                      uploadedFileUrl={favicon}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
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

export default withAuth(CreateOrgForm);
