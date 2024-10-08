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
        content: "{}",
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
        className="flex flex-1 justify-center rounded-lg border border-dashed shadow-sm" x-chunk="dashboard-02-chunk-1"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead className="text-center">Content</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data && data.map((board) => {
              return (
                <TableRow key={board.id} className="">
                  <TableCell>{board.title}</TableCell>

                  <TableCell className="text-center">
                    {board.content}
                  </TableCell>
                  <TableCell className="text-right items-center">
                    <div className="flex items-center justify-end gap-4">
                      <Button
                        onClick={() => router.push(`/${params.slug}/changelog/${board.id}`)}
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <Edit className="" />
                        Edit Changelog
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </main>
  )
}
export default withAuth(Dashboard);

