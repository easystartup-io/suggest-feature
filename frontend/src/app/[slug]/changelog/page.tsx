"use client"

import Loading from "@/components/Loading";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from '@/context/AuthContext';
import withAuth from '@/hoc/withAuth';
import { Edit, Settings, Telescope } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";


const Dashboard: React.FC = ({ params }) => {
  const { logout } = useAuth();
  const router = useRouter();

  const [data, setData] = useState(null)
  const [isLoading, setLoading] = useState(true)
  const { toast } = useToast()

  const refetch = () => {
    fetch('/api/auth/changelog/fetch-changelogs', {
      method: 'POST',
      headers: {
        "x-org-slug": params.slug,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({})
    })
      .then((res) => res.json())
      .then((data) => {
        setData(data)
        setLoading(false)
      })
  }

  const createChangelogAndRedirect = async () => {
    const response = await fetch('/api/auth/changelog/create-changelog', {
      method: 'POST',
      headers: {
        "x-org-slug": params.slug,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: "Enter title here",
        content: "[]",
        html: '',
        draft: true
      })
    })

    const respPayload = await response.json();

    router.push(`/${params.slug}/changelog/${respPayload.id}`)
  }

  useEffect(() => {
    refetch();
  }, [params.slug])


  if (isLoading) return <Loading />

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Changelog</h1>
        <div className="flex items-center justify-end space-x-4">
          <Button onClick={() => {
            createChangelogAndRedirect()
          }}>
            Add changelog
          </Button>
        </div>
      </div>
      <div
        className="flex flex-col rounded-lg border border-dashed shadow-sm" x-chunk="dashboard-02-chunk-1"
      >

        {
          !data || data.length < 1 && <div className="w-full h-full min-h-64 justify-center items-center flex font-medium text-lg">
            No changelog
          </div>
        }

        {data && data.map((board) => {
          return (
            <div key={board.id} className="p-4 border-b hover:bg-primary/10 grid grid-cols-8">
              <div className="col-span-2">
                <div className="font-medium">{board.title}</div>
                <div className='flex items-center space-x-4 mt-2'>
                  <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden h-32">
                    {board.coverImage ? (
                      <img
                        src={board.coverImage}
                        alt="Cover"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        No cover image
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div dangerouslySetInnerHTML={{ __html: board.html }} className="prose dark:prose-invert col-span-5" />
              <div className="col-span-1">
                <Button
                  onClick={() => router.push(`/${params.slug}/changelog/${board.id}`)}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Edit className="" />
                  Edit
                </Button>
              </div>
            </div>
          )
        })}
      </div >
    </main >
  )
}
export default withAuth(Dashboard);

