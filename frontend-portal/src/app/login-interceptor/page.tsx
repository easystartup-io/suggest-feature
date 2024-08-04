"use client"
import { useAuth } from "@/context/AuthContext";
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { useEffect } from "react";

function AuthenticationPage() {
  const { oauth2Login } = useAuth();
  const searchParams = useSearchParams()

  useEffect(() => {
    if (searchParams.get('response') != null) {
      oauth2Login(searchParams.get('response') || '', searchParams.get('redirectToPage') || '/')
    }
  }, [searchParams])
  return <div></div>
}


export default function LoginInterceptor() {
  return (
    // Need to do this because nextjs throwing error if trying to read searchparams client side
    <Suspense>
      <AuthenticationPage />
    </Suspense>
  )
}
