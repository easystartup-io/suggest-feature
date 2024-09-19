"use client"
import { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { UserAuthForm } from "@/components/user-auth-form"
import Script from "next/script";
import { useEffect } from "react"

export default function AuthenticationPage() {
  let id = "d1ae1735-cd77-47c8-8a33-87835620295b";

  useEffect(() => {
    // Check if the script is already in the head of the dom
    let script = document.querySelector(
      `script[src="https://static.senja.io/dist/platform.js"]`
    );

    if (script) return;

    script = document.createElement("script")
    script.src = "https://static.senja.io/dist/platform.js";
    script.async = true
    script.type = "text/javascript"
    document.body.append(script);
  }, []);

  return (
    <>
      <title>Sign Up</title>
      <div className="h-[800px] items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
        <Link
          href="/login"
          className={cn(
            buttonVariants({ variant: "ghost" }),
            "absolute right-4 top-4 md:right-8 md:top-8"
          )}
        >
          Login
        </Link>
        <div className="lg:min-h-screen h-full flex flex-col bg-gradient-to-b from-white to-yellow-400">
          <div className="flex items-center text-xl font-bold p-8">
            <img src="/logo-light.jpeg" alt="Suggest Feature" className="h-8 w-auto mr-2" />
            Suggest Feature
          </div>
          <div className="hidden lg:block w-full h-full">
            <div className="">
              <div className="senja-embed block" data-id={id} data-mode="shadow" data-lazyload="true" ></div>
            </div>
          </div>
        </div>
        <div className="lg:p-8">
          <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
            <UserAuthForm />
            <p className="px-8 text-center text-sm text-muted-foreground">
              By continuing, you agree to our{" "}
              <Link
                href="https://suggestfeature.com/terms"
                target="_blank"
                className="underline underline-offset-4 hover:text-primary"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="https://suggestfeature.com/privacy"
                target="_blank"
                className="underline underline-offset-4 hover:text-primary"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
