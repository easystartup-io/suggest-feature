"use client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp"
import { useRouter } from 'next/navigation'
import { useState } from "react"
import { Icons } from "./icons"
import { useAuth } from "@/context/AuthContext"
import { useInit } from "@/context/InitContext"

function AuthDialog({ openLoginDialog, setOpenLoginDialog, userData }) {
  const { verifyCode, updateUserName, user } = useAuth()
  const { org } = useInit();
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [currentState, setCurrentState] = useState(((userData && !userData.name) || user && !user.name) ? "name" : "email")
  const [verificationCode, setVerificationCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const sendMagicLink = async (email) => {
    try {
      const res = await fetch("/api/unauth/magic-link-generator", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, firstName, lastName })
      })
      if (res.ok) {
        toast({
          title: "Verification code sent",
        })
      } else {
        const { message } = await res.json();
        toast({
          title: "Error",
          description: message,
          variant: "destructive",
        })
      }
      setCurrentState("otp")
    } catch (e) {
      toast({
        title: "Error",
        description: "Failed to send verification code. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      if (currentState === "email") {
        await sendMagicLink(email)
      } else if (currentState === "otp") {
        const user = await verifyCode(email, verificationCode)
        console.log(user)
        if (user && !user.name) {
          setCurrentState("name")
          console.log(user)
        }
      } else if (currentState === "name") {
        const name = lastName ? `${firstName} ${lastName}` : firstName;
        await updateUserName(name)
        // User updated successfully
        setOpenLoginDialog(false, true)
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

  const socialLogin = (provider) => {
    router.push(`/api/unauth/oauth2/start/${provider}?host=${window.location.href}`)
  }
  const getDescription = () => {
    if (currentState === "email") {
      return isLogin
        ? 'Enter your email below to login to your account'
        : 'Enter your information to create an account'
    } else if (currentState === "otp") {
      return 'Enter the verification code sent to your email'
    } else if (currentState === "name") {
      return 'Please provide your name to complete the sign-up process'
    }
  }

  return (
    <Dialog open={openLoginDialog} onOpenChange={setOpenLoginDialog}>
      <DialogTrigger asChild>
        <Button variant="outline"
          onClick={() => {
            setOpenLoginDialog(true)
            // // Reset all
            // setIsLogin(true);
            // setLastName('')
            // setFirstName('')
            // setCurrentState('email')
            // setVerificationCode('')
            // setEmail('')
            setIsLoading(false)
          }}
        >Log in</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isLogin ? 'Login' : 'Sign Up'}</DialogTitle>
          {org?.ssoSettings?.exclusiveSSO ? null :
            <DialogDescription>
              {getDescription()}
            </DialogDescription>
          }
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4">
            {org?.ssoSettings?.exclusiveSSO ? null : (
              !isLogin && currentState === "email" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="first-name">First name</Label>
                    <Input
                      id="first-name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Tony"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="last-name">Last name</Label>
                    <Input
                      id="last-name"
                      placeholder="Stark"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                </div>
              ))
            }
            {org?.ssoSettings?.exclusiveSSO ? null : (
              currentState === "email" && (
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tony@stark.com"
                    required
                  />
                </div>
              ))}
            {org?.ssoSettings?.exclusiveSSO ? null : (
              currentState === "otp" && (
                <div className="flex items-center justify-center">
                  <InputOTP
                    id="verificationCode"
                    maxLength={6}
                    pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
                    inputMode="text"
                    value={verificationCode}
                    onChange={(value) => setVerificationCode(value.toUpperCase())}
                    disabled={isLoading}
                  >
                    <InputOTPGroup>
                      {[...Array(6)].map((_, index) => (
                        <InputOTPSlot key={index} index={index} className="h-14 w-14 text-lg" />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              ))
            }
            {currentState === "name" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="first-name">First name</Label>
                  <Input
                    id="first-name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Tony"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="last-name">Last name</Label>
                  <Input
                    id="last-name"
                    placeholder="Stark"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}
            {org?.ssoSettings?.exclusiveSSO ? null :
              <Button
                type="submit"
                disabled={
                  isLoading ||
                  (currentState === "email" && email.trim().length === 0) ||
                  (currentState === "otp" && verificationCode.trim().length !== 6)
                }
                className="w-full"
              >
                {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
                {isLogin ? (currentState === 'name' ? 'Finish Sign up' : "Login") : "Sign up"}
              </Button>
            }
            {currentState === "email" && (
              <>
                {
                  org?.ssoSettings?.enableCustomSSO &&
                  <Button variant="outline"
                    type="button"
                    className="w-full" onClick={() => {
                      router.push(`/api/unauth/customSSO/start?host=${window.location.href}`)
                      return
                    }}>
                    <div className="flex items-center gap-2">
                      {org?.logo && <img src={org.logo} className="h-5" />}
                      <span>{isLogin ? `Login with ${org?.name}` : `Sign up with ${org?.name}`}</span>
                    </div>
                  </Button>
                }
                {org?.ssoSettings?.exclusiveSSO ? null :
                  <Button variant="outline"
                    type="button"
                    className="w-full" onClick={() => {
                      socialLogin("GOOGLE")
                    }}>
                    <div className="flex items-center gap-2">
                      <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5">
                        <title>Google</title>
                        <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
                      </svg>
                      <span>{isLogin ? "Login with Google" : "Sign up with Google"}</span>
                    </div>
                  </Button>
                }
                {org?.ssoSettings?.exclusiveSSO ? null :
                  <Button variant="outline"
                    type="button"
                    className="w-full" onClick={() => socialLogin("FACEBOOK")}>
                    <div className="flex items-center gap-2">
                      <svg role="img" className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <title>Facebook</title>
                        <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z" />
                      </svg>
                      <span>{isLogin ? "Login with Facebook" : "Sign up with Facebook"}</span>
                    </div>
                  </Button>
                }
              </>
            )}
          </div>
          {currentState === "email" && (
            <div className="mt-4 text-center text-sm">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <span className="underline cursor-pointer" onClick={() => setIsLogin(!isLogin)}>
                {isLogin ? "Sign up" : "Sign in"}
              </span>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default AuthDialog
