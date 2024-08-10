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

interface UserAuthFormProps extends React.HTMLAttributes<HTMLDivElement> { }

export function UserAuthForm({ className, formType, ...props }: UserAuthFormProps) {
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
      </div>
    </div>
  );

}
