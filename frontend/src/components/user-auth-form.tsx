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

interface UserAuthFormProps extends React.HTMLAttributes<HTMLDivElement> { }

export function UserAuthForm({ className, ...props }: UserAuthFormProps) {
  const [isLoading, setIsLoading] = React.useState<boolean>(false)
  const [step, setStep] = useState<'email' | 'verification'>('email');
  const [verificationCode, setVerificationCode] = useState('');
  const { login, verifyCode } = useAuth();
  const [username, setUsername] = useState('');


  async function onSubmit(event: React.SyntheticEvent) {
    event.preventDefault()
    setIsLoading(true)

    if (step === 'email') {
      await login(username);
      setStep('verification');
    } else {
      await verifyCode(username, verificationCode);
    }

    setTimeout(() => {
      setIsLoading(false)
    }, 1000)
  }
  return (
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
            <Button disabled={isLoading}>
              {isLoading && (
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
              )}
              Sign In with Email
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
                onChange={(value) => setVerificationCode(value)}
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
    </div >
  );

  // return (
  //   <div className={cn("grid gap-6", className)} {...props}>
  //     <form onSubmit={onSubmit}>
  //       <div className="grid gap-2">
  //         <div className="grid gap-1">
  //           <Label className="sr-only" htmlFor="email">
  //             Email
  //           </Label>
  //           <Input
  //             id="email"
  //             placeholder="name@example.com"
  //             type="email"
  //             value={username}
  //             onChange={(e) => setUsername(e.target.value)}
  //             autoCapitalize="none"
  //             autoComplete="email"
  //             autoCorrect="off"
  //             disabled={isLoading}
  //           />
  //         </div>
  //         <Button disabled={isLoading}>
  //           {isLoading && (
  //             <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
  //           )}
  //           Sign In with Email
  //         </Button>
  //       </div>
  //     </form>
  //     {/* <div className="relative"> */}
  //     {/*   <div className="absolute inset-0 flex items-center"> */}
  //     {/*     <span className="w-full border-t" /> */}
  //     {/*   </div> */}
  //     {/*   <div className="relative flex justify-center text-xs uppercase"> */}
  //     {/*     <span className="bg-background px-2 text-muted-foreground"> */}
  //     {/*       Or continue with */}
  //     {/*     </span> */}
  //     {/*   </div> */}
  //     {/* </div> */}
  //     {/* <Button variant="outline" type="button" disabled={isLoading}> */}
  //     {/*   {isLoading ? ( */}
  //     {/*     <Icons.spinner className="mr-2 h-4 w-4 animate-spin" /> */}
  //     {/*   ) : ( */}
  //     {/*     <Icons.gitHub className="mr-2 h-4 w-4" /> */}
  //     {/*   )}{" "} */}
  //     {/*   GitHub */}
  //     {/* </Button> */}
  //   </div>
  // )
}
