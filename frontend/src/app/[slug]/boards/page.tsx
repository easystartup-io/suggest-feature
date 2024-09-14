"use client"

import AddBoardDialog from "@/components/board/AddBoard";
import Loading from "@/components/Loading";
import ReorderBoardsComponent from "@/components/ReorderBoardsComponent";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from '@/context/AuthContext';
import withAuth from '@/hoc/withAuth';
import { Settings, Telescope } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";



const Dashboard: React.FC = ({ params }) => {
  const { logout } = useAuth();
  const router = useRouter();

  const [data, setData] = useState(null)
  const [isLoading, setLoading] = useState(true)
  const { toast } = useToast()

  const refetch = () => {
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
  }

  useEffect(() => {
    refetch();
  }, [params.slug])

  const saveBoardOrder = async (reOrderedBoards) => {
    console.log(reOrderedBoards)
    setLoading(true)

    try {
      const response = await fetch('/api/auth/boards/reorder-boards', {
        method: 'POST',
        headers: {
          "x-org-slug": params.slug,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ boardIds: reOrderedBoards.map(board => board.id) })
      })
      const respData = await response.json();

      if (response.ok) {
        refetch()
        toast({
          title: 'Board reordered',
        })
      } else {
        toast({
          title: respData.message,
          variant: 'destructive'
        })
      }

    } catch (err) {
      console.log(err)
    }

    setTimeout(() => {
      setLoading(false)
    }, 1000)
  }

  if (isLoading) return <Loading />

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Boards</h1>
        <div className="flex items-center justify-end space-x-4">
          <ReorderBoardsComponent boards={data} onSave={saveBoardOrder} />
          <AddBoardDialog params={params} />
        </div>
      </div>
      <div
        className="flex flex-1 justify-center rounded-lg border border-dashed shadow-sm" x-chunk="dashboard-02-chunk-1"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="text-center">Posts</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data && data.map((board) => {
              return (
                <TableRow key={board.id} className="">
                  <TableCell>{board.name}</TableCell>

                  <TableCell className="text-center">
                    {/* <Badge className="text-sm" variant="secondary"> */}
                    {board.postCount || 0}
                    {/* </Badge> */}
                  </TableCell>
                  <TableCell className="text-right items-center">
                    <div className="flex items-center justify-end gap-4">
                      <Button
                        onClick={() => router.push(`/${params.slug}/boards/${board.slug}/posts`)}
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <Telescope className="" />
                        View Posts
                      </Button>
                      <Button
                        onClick={() => router.push(`/${params.slug}/boards/${board.slug}`)}
                        variant="destructive"
                        className="flex items-center gap-2"
                        size="icon"
                      >
                        <Settings className="" />
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

