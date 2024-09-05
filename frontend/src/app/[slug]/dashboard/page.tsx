"use client"

import { Button } from "@/components/ui/button"
import withAuth from '@/hoc/withAuth';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from "next/navigation"
import { useContext, useEffect, useState } from "react";
import { SidebarContext } from "../layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Loading from "@/components/Loading";


const Dashboard: React.FC = ({ params }) => {
  const { logout } = useAuth();
  const router = useRouter();

  const [data, setData] = useState(null)
  const [isLoading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/auth/boards/fetch-boards', {
      headers: {
        "x-org-slug": params.slug
      }
    })
      .then((res) => res.json())
      .then((data) => {
        setData(data)
        setLoading(false)
      })
  }, [params.slug])

  if (isLoading) return <Loading />


  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 h-full">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Dashboard</h1>
      </div>
      <div
        className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm" x-chunk="dashboard-02-chunk-1 h-full"
      >
        <div className="flex flex-col items-center gap-1 h-[calc(100vh/2)]">
          <div className="grid md:grid-cols-3 gap-4 w-full">
            {data && data.map((board) => {
              return (
                <div key={board.id} className="">
                  {board.name}
                  {/* <Button */}
                  {/*   onClick={() => router.push(`/${params.slug}/boards/${board.slug}/posts`)} */}
                  {/*   variant="outline" */}
                  {/*   className="flex items-center gap-2" */}
                  {/* > */}
                  {/*   View Posts */}
                  {/* </Button> */}
                </div>
              )
            })
            }
          </div>
        </div>
      </div>
    </main>
  )
}
export default withAuth(Dashboard);

