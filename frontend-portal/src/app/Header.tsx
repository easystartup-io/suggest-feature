"use client"
import LoginDialog from "@/components/LoginDialog";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { ArrowLeft, History } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import ModeToggle from "./ModeToggle";
import Link from 'next/link';

function Custom404() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-b from-blue-400 to-blue-300 text-center">
      <div className="text-8xl font-bold text-white">404</div>
      <div className="mt-4 text-2xl font-medium text-white">
        Oops! Page not found!
      </div>
      <div className="relative w-24 h-24 mt-8">
      </div>
      <div className="mt-8 text-lg text-white underline">
        <a href="https://suggestfeature.com">Go Back to Suggest Feature</a>
      </div>
    </div>
  );
}


export default function Header({ params, initMetadata, userData }) {

  const { user: clientUser, logout, registerSetOpenLoginDialog } = useAuth()
  const user = clientUser ? clientUser : userData;
  const org = initMetadata.org
  const pathname = usePathname();
  const searchParams = useSearchParams()

  const hideNavBar = searchParams.get('hideNavBar')

  const [openLoginDialog, setOpenLoginDialog] = useState(false)

  const mainContentRef = useRef(null);

  useEffect(() => {
    if (mainContentRef.current) {
      try {
        window.scroll(0, 0);
      } catch (e) {
        console.log(e)
      }
    }
  }, [params, pathname]);

  useEffect(() => {
    registerSetOpenLoginDialog(setOpenLoginDialog)
  }, [])

  if (!org) {
    return <Custom404 />
  }

  if (hideNavBar) {
    return null
  }

  return (
    <div className="w-full px-4 md:px-10"
      ref={mainContentRef}
    >
      <header className="flex h-16 items-center justify-between gap-4 w-full">
        <Link href={'/'}>
          <div
            className="cursor-pointer flex items-center"
          >
            {org.logo ? <img
              className="h-12 mr-2"
              src={org.logo}
            /> : null}
            {
              org.hideOrgName ? null :
                <h1 className="text-xl font-semibold">{org.name}</h1>
            }
          </div>
        </Link>
        <div className="flex items-center justify-end gap-4 md:ml-auto md:gap-2 lg:gap-4">
          {
            org.enableReturnToSiteUrl && org.returnToSiteUrl &&
            <Button
              variant="ghost"
              type="button"
              className="text-xs text-muted-foreground"
              onClick={() => {
                window.open(org.returnToSiteUrl, '_blank');
              }}
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              {org.returnToSiteUrlText || `Return to ${org.name}`}
            </Button>
          }
          {
            (!org.changelogSettings || (org.changelogSettings && org.changelogSettings.enabled)) &&
            <Link href="/changelog">
              <div className="flex cursor-pointer hover:bg-gray-100 px-2 hover:py-4 hover:text-indigo-400 rounded-lg text-sm"
              >
                <History className="mr-1 h-5 w-5" />
                Changelog
              </div>
            </Link>
          }
          <ModeToggle />
          {user && user.name ?
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="icon" className="rounded-full">
                  <Avatar>
                    <AvatarImage src={`${user.profilePic}`} />
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
                  <span className="sr-only">Toggle user menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{user.name}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <Link
                  href="/settings"
                >
                  <DropdownMenuItem className="cursor-pointer">
                    Settings
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => logout()} className="cursor-pointer">Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            :
            <LoginDialog openLoginDialog={openLoginDialog} setOpenLoginDialog={setOpenLoginDialog} />}
        </div>
      </header>
    </div>
  )
}
