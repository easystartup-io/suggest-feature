"use client"
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Cookies from 'js-cookie'

export default function Home() {
  const router = useRouter();
  const { user, loading, failed } = useAuth();
  const [orgs, setOrgs] = useState([]);

  // Need to do this because else giving error that location is not defined. Might be because trying to run router before its mounted
  useEffect(() => {
    const fetchOrgs = async () => {
      try {
        const resp = await fetch(`/api/auth/user/fetch-orgs-for-user`, {
          headers: {
            'Content-Type': 'application/json'
          }
        })

        const res = await resp.json();
        if (resp.status !== 200) {
          console.log(res)
          return;
        }
        if (res.length === 0) {
          router.push('/create-org');
        } else if (res.length === 1) {
          router.push(`/${res[0].slug}/dashboard`);
        } else {
          const defaultSlug = Cookies.get('defaultOrg');
          let found = false;
          res.forEach(org => { if (org.slug === defaultSlug) found = true })
          if (!found) {
            router.push(`/${res[0].slug}/dashboard`);
          } else {
            router.push(`/${defaultSlug}/dashboard`);
          }
        }
      } catch (err) {
        console.log(err)
      }
    }

    if (typeof window !== "undefined" && !loading && !user && !failed) {
      router.push('/login');
      return
    }


    if (user) {
      fetchOrgs();
    }


  }, [router, user, loading, failed])


  // Auto redirect to logged in   user to dashboard

  return <div></div>;
}
