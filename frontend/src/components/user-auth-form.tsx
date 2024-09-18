"use client"

import * as React from "react"
import { useState } from 'react';
import { cn } from "@/lib/utils"
import { Icons } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from '../context/AuthContext';
import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@/components/ui/input-otp";
import { Mail } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";

interface UserAuthFormProps extends React.HTMLAttributes<HTMLDivElement> { }

export function UserAuthForm({ className, formType, ...props }: UserAuthFormProps) {
  const [isLoading, setIsLoading] = React.useState<boolean>(false)
  const [step, setStep] = useState<'email' | 'verification'>('email');
  const [verificationCode, setVerificationCode] = useState('');
  const { login, verifyCode } = useAuth();
  const [username, setUsername] = useState('');
  const router = useRouter()
  const { toast } = useToast()


  async function onSubmit(event: React.SyntheticEvent) {
    event.preventDefault()
    if (username.trim().length === 0) {
      return;
    }
    setIsLoading(true)


    try {
      if (step === 'email') {
        await login(username);
        setStep('verification');
      } else {
        await verifyCode(username, verificationCode);
      }
    } catch (e) {
      toast({
        title: "Error",
        description: e.message,
        variant: "destructive"
      })
    }

    setTimeout(() => {
      setIsLoading(false)
    }, 1000)
  }
  return (
    <div className="space-y-6">
      {formType === 'login' ? (
        <div className="flex flex-col text-center space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Sign In
          </h1>
          <p className="text-sm text-muted-foreground">
            {step === 'email' ? (
              'Enter your email below to sign in') : (
              `Enter the otp received on ${username}`
            )}
          </p>
        </div>) : (
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Create an account
          </h1>
          <p className="text-sm text-muted-foreground">
            {step === 'email' ? (
              'Enter your email below to create your account') : (
              `Enter the otp received on ${username}`
            )}
          </p>
        </div>
      )}
      <div className={cn("grid gap-6", className)} {...props}>
        <form onSubmit={onSubmit}>
          {step === 'email' ? (
            <div className="grid gap-2">
              <div className="grid gap-1">
                <Label className="sr-only" htmlFor="email">
                  Email
                </Label>
                <Input
                  id="email"
                  placeholder="name@example.com"
                  type="email"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect="off"
                  disabled={isLoading}
                />
              </div>
              <Button disabled={isLoading || !username.trim()}>
                {isLoading && (
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                )}
                <Mail className="mr-2 h-4 w-4" />
                {formType === 'login' ? 'Sign In with Email' : 'Sign Up with Email'}
              </Button>
              <Separator />
              <Button variant="outline" className="w-full"
                type="button"
                onClick={() => {
                  router.push(`/api/unauth/oauth2/start/GOOGLE?host=${window.location.href}`)
                }}>
                <div className="flex items-center gap-2">
                  <div>
                    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5"><title>Google</title><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" /></svg>
                  </div>
                  <div>
                    {formType === 'login' ? 'Sign In with Google' : 'Sign Up with Google'}
                  </div>
                </div>
              </Button>
              <Button variant="outline"
                type="button"
                className="w-full" onClick={() => {
                  router.push(`/api/unauth/oauth2/start/FACEBOOK?host=${window.location.href}`)
                }}
              >
                <div className="flex items-center gap-2">
                  <div>
                    <svg role="img" className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Facebook</title><path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z" /></svg>
                  </div>
                  <div>
                    {formType === 'login' ? 'Sign In with Facebook' : 'Sign Up with Facebook'}
                  </div>
                </div>
              </Button>
            </div>
          ) : (
            <div className="grid gap-2">
              <div className="flex justify-center items-center">
                <Label className="sr-only" htmlFor="verificationCode">
                  Verification Code
                </Label>
                <InputOTP
                  id="verificationCode"
                  maxLength={6} pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
                  value={verificationCode}
                  onChange={(value) => setVerificationCode(value.toUpperCase())}
                  disabled={isLoading}
                >
                  <InputOTPGroup >
                    <InputOTPSlot index={0}
                      className="h-14 w-14 text-lg text-medium"
                    />
                    <InputOTPSlot index={1}
                      className="h-14 w-14 text-lg"
                    />
                    <InputOTPSlot index={2}
                      className="h-14 w-14 text-lg"
                    />
                    <InputOTPSlot index={3}
                      className="h-14 w-14 text-lg"
                    />
                    <InputOTPSlot index={4}
                      className="h-14 w-14 text-lg"
                    />
                    <InputOTPSlot index={5}
                      className="h-14 w-14 text-lg"
                    />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <Button disabled={isLoading}>
                {isLoading && (
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                )}
                Verify Code
              </Button>
            </div>
          )
          }
        </form >
      </div>
    </div>
  );

}
