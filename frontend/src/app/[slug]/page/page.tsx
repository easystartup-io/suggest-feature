"use client"

import { Icons } from "@/components/icons";
import Loading from "@/components/Loading";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import withAuth from '@/hoc/withAuth';
import { ExternalLink, ImageIcon, Sun, Lock, ChevronLeft, ChevronRight, Home, RotateCw, Moon } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import FileUploadButton from "@/components/FileButton";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/context/AuthContext";

const ImagePlaceholder = ({ className }) => (
  <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
    <ImageIcon className="w-1/2 h-1/2 text-gray-400" />
  </div>
);

const BrowserAddressBar = ({ customDomain, slug }) => {
  const displayUrl = customDomain || `${slug}.suggestfeature.com`;

  return (
    <div className="w-full bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-2 rounded-t-lg">
      <div className="flex items-center w-full">
        <div className="flex items-center space-x-1 mr-2">
          {[ChevronLeft, ChevronRight, RotateCw, Home].map((Icon, index) => (
            <Button
              key={index}
              size="icon"
              variant="ghost"
              className="w-6 h-6 text-gray-500 dark:text-gray-400"
              type="button"
            >
              <Icon className="h-3 w-3" />
            </Button>
          ))}
        </div>
        <div className="flex-grow flex items-center bg-white dark:bg-gray-700 rounded-full px-3 py-1">
          <Lock className="h-4 w-4 text-green-600 dark:text-green-400 mr-2 flex-shrink-0" />
          <span className="text-sm text-gray-600 dark:text-gray-300 truncate">
            https://{displayUrl}
          </span>
        </div>
      </div>
    </div>
  );
};

const Navbar = ({ logo, orgName, hideOrgName, customDomain, slug }) => {

  const { user } = useAuth();
  return (
    <div className="w-full rounded-lg overflow-hidden border border-gray-200 shadow-md">
      <BrowserAddressBar customDomain={customDomain} slug={slug} />
      <nav className="flex items-center justify-between p-4 bg-white dark:bg-background text-black dark:text-white shadow-sm">
        <div className="flex items-center">
          {logo && (
            <div className="w-10 h-10 mr-2">
              <ImageComponent src={logo} alt="Logo" className="w-[40px] h-[40px] object-contain" />
            </div>
          )}
          {!hideOrgName && <span className="text-lg font-semibold">{orgName}</span>}
        </div>
        <div className="flex items-center space-x-4">
          <Button size="icon" variant="outline" type="button">
            <Sun className="h-5 w-5 dark:hidden" />
            <Moon className="h-5 w-5 hidden dark:block" />
          </Button>
          <Avatar>
            <AvatarImage src={user.profilePic} alt="User" />
            <AvatarFallback>
              {user.name ? user.name.substring(0, 2).toUpperCase() : 'U'}
            </AvatarFallback>
          </Avatar>
        </div>
      </nav>
    </div>
  );
};

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


const Dashboard: React.FC = ({ params }) => {
  const { toast } = useToast()

  const [data, setData] = useState(null)
  const [isLoading, setLoading] = useState(true)
  const [defaultValues, setDefaultValues] = useState({})
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadedLogoUrl, setUploadedLogoUrl] = useState('')

  const [uploadingFavicon, setUploadingFavicon] = useState(false)
  const [uploadedFaviconUrl, setUploadedFaviconUrl] = useState('')

  const [hideOrgName, setHideOrgName] = useState(false)

  const form = useForm({ defaultValues })
  const { reset } = form; // Get reset function from useForm

  const router = useRouter()

  useEffect(() => {
    fetch(`/api/auth/pages/fetch-org`, {
      headers: {
        "x-org-slug": params.slug
      }
    })
      .then((res) => res.json())
      .then((data) => {
        setData(data)
        setHideOrgName(data.hideOrgName)
        reset(data)
        setLoading(false)
      })

  }, [params.id, params.slug, reset])

  async function onSubmit(data) {
    setLoading(true)
    try {

      const reqData = { ...data, logo: uploadedLogoUrl || data.logo, favicon: uploadedFaviconUrl || data.favicon, hideOrgName }
      console.log(reqData)
      console.log(uploadedLogoUrl)
      const resp = await fetch(`/api/auth/pages/edit-org`, {
        method: 'POST',
        headers: {
          "x-org-slug": params.slug,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reqData)
      });
      const respData = await resp.json();
      if (resp.ok) {
        setData(respData)
        setHideOrgName(respData.hideOrgName)
        reset(respData)
        toast({
          title: 'Updated successfully',
        })
        if (data.slug !== params.slug) {
          router.push(`/${data.slug}/page`)
        }
      } else {
        toast({
          title: 'Failed to save',
          description: `${respData.message}`,
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

  if (!data) return <Loading />


  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 h-full">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Page - {data && data.name}</h1>
      </div>
      <div
        className="flex flex-1 justify-center rounded-lg border border-dashed shadow-sm"
      >
        <div className="w-full p-4">
          <div className="space-y-6 mb-8">
            <div className="flex flex-col space-y-4">
              <div>
                <Label>
                  Logo
                </Label>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 overflow-hidden rounded border border-gray-200">
                  <ImageComponent
                    src={uploadedLogoUrl || data.logo}
                    alt="Logo"
                    className="w-full h-full"
                  />
                  <ImagePlaceholder className="w-full h-full hidden" />
                </div>
                <div>
                  <FileUploadButton
                    uploading={uploadingLogo}
                    setUploading={setUploadingLogo}
                    setUploadedFileUrl={setUploadedLogoUrl}
                    uploadedFileUrl={uploadedLogoUrl}
                  />
                </div>
              </div>
            </div>
            <div className="flex flex-col space-y-4">
              <div>
                <Label>
                  Favicon
                </Label>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 overflow-hidden rounded border border-gray-200">
                  <ImageComponent
                    src={uploadedFaviconUrl || data.favicon}
                    alt="Favicon"
                    className="w-full h-full"
                  />
                  <ImagePlaceholder className="w-full h-full hidden" />
                </div>
                <div>
                  <FileUploadButton
                    uploading={uploadingFavicon}
                    setUploading={setUploadingFavicon}
                    setUploadedFileUrl={setUploadedFaviconUrl}
                    uploadedFileUrl={uploadedFaviconUrl}
                  />
                </div>
              </div>
            </div>
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input disabled={isLoading} placeholder="name" {...field} />
                    </FormControl>
                    <FormDescription>
                      This is the page title.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug</FormLabel>
                    <FormControl>
                      <div className="flex items-center">
                        <div className="flex-1">
                          <Input disabled={isLoading} placeholder="slug" {...field} className="inline-block" />
                        </div>
                        <div className="flex items-center">
                          <div className="text-muted-foreground ml-1">
                            .suggestfeature.com
                          </div>
                          <div>
                            <a href={`https://${field.value}.suggestfeature.com`} target="_blank"
                              className="ml-1 pb-2 inline-block hover:text-indigo-700">
                              <ExternalLink className="h-6 w-6 inline-block" />
                            </a>
                          </div>
                        </div>
                      </div>
                    </FormControl>
                    <FormDescription>
                      <p>
                        This is the org slug. It should be unique and can only contain letters, numbers, and hyphens.
                      </p>
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="customDomain"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custom Domain</FormLabel>
                    <FormControl>
                      <Input disabled={isLoading} placeholder="feature-request.yourdomain.com" {...field} />
                    </FormControl>
                    <FormDescription>
                      This is the custom domain for the page. You have to setup a CNAME mapping in your DNS server to our domain cname.suggestfeature.com before setting it here.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <div className="flex items-center space-x-2 my-4">
                  <Label htmlFor="private-board">Hide org name on navbar</Label>
                  <Switch id="hide-org-name"
                    className="ml-4 data-[state=checked]:bg-yellow-500"
                    disabled={isLoading}
                    checked={hideOrgName}
                    onCheckedChange={(checked) => setHideOrgName(checked)}
                  />
                </div>
                <FormDescription>
                  Select this option if your logo already contains the org name.
                </FormDescription>
              </div>

              <div className="rounded-lg border border-dashed shadow-sm mb-4">
                <h2 className="text-lg font-semibold p-4">Navbar Preview</h2>
                <Navbar
                  logo={uploadedLogoUrl || data?.logo}
                  orgName={data?.name}
                  hideOrgName={hideOrgName}
                  customDomain={form.getValues('customDomain')}
                  slug={form.getValues('slug')}
                />
              </div>
              <Button type="submit" disabled={isLoading || uploadingLogo || uploadingFavicon}>
                {(isLoading || uploadingFavicon || uploadingLogo) &&
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                }
                {
                  (uploadingLogo || uploadingFavicon) ? 'Uploading...' : (isLoading ? 'Saving...' : 'Save')
                }
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </main>
  )
}
export default withAuth(Dashboard);

