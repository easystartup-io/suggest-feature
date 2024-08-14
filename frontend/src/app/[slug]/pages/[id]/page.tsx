"use client"

import { Button } from "@/components/ui/button"
import withAuth from '@/hoc/withAuth';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from "next/navigation"
import { useContext, useEffect, useState } from "react";
import { SidebarContext } from "@/app/[slug]/layout";
import { TableHeader, TableRow, TableHead, TableBody, TableCell, TableCaption, Table } from "@/components/ui/table";
import { Link as ExternalLink2, ExternalLink, Settings } from "lucide-react"
import Link from "next/link"

const Dashboard: React.FC = ({ params }) => {
  let { setCurrentSection } = useContext(SidebarContext);

  useEffect(() => {
    setCurrentSection('pages')
  }, [])

  const [data, setData] = useState(null)
  const [isLoading, setLoading] = useState(true)


  useEffect(() => {
    fetch(`/api/auth/pages/fetch-page?pageId=${params.id}`, {
      headers: {
        "x-org-slug": params.slug
      }
    })
      .then((res) => res.json())
      .then((data) => {
        setData(data)
        setLoading(false)
      })
  }, [])


  // if (isLoading) return <p>Loading...</p>
  // if (!data) return <p>No profile data</p>

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Page {data && data.name}</h1>
      </div>
      <div
        className="flex flex-1 justify-center rounded-lg border border-dashed shadow-sm" x-chunk="dashboard-02-chunk-1"
      >
      </div>
    </main>
  )
}
export default withAuth(Dashboard);

