"use client"

import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/AuthContext"
import { Mail, X } from "lucide-react"
import { useEffect, useState } from "react"

export default function SubscribeToChangelog() {
  const { user, loading, verifyLoginOrPrompt } = useAuth()
  const [subscribed, setSubscribed] = useState(false)
  const [finishedFetching, setFinishedFetching] = useState(false)

  useEffect(() => {
    if (user) {
      const host = window.location.host
      const protocol = window.location.protocol // http: or https:
      const path = 'api/portal/auth/changelog/get-changelog-subscription';

      fetch(`${protocol}//${host}/${path}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.userId) {
            setSubscribed(true)
          }
          setFinishedFetching(true)
        }).catch((e) => {
          console.log(e)
        })

    } else if (!loading) {
      setFinishedFetching(true)
    }
  }, [user, loading])

  const subscribe = () => {
    if (verifyLoginOrPrompt()) {
      return;
    }

    const unsubscribe = subscribed;

    fetch(`/api/portal/auth/changelog/subscribe-to-changelog?unsubscribe=${unsubscribe}`, {
      method: "GET",
      headers: {
        'Content-Type': 'application/json'
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setSubscribed(!unsubscribe)
      })
  }

  if (loading || !finishedFetching) {
    // to prevent flickering
    return <Button size="sm" className="ml-2 bg-transparent text-transparent" variant="ghost">
      <Mail className="mr-2 h-5 w-5" />
      {subscribed ? 'Unsubscribe from Changelog' : 'Subscribe to Changelog'}
    </Button>

  }

  return (
    <div>
      <Button size="sm" onClick={() => subscribe()} className="ml-2" variant="outline">
        {subscribed ? <X className="mr-2 h-5 w-5" /> : <Mail className="mr-2 h-5 w-5" />}
        {subscribed ? 'Unsubscribe from Changelog' : 'Subscribe to Changelog'}
      </Button>
    </div>)

}
