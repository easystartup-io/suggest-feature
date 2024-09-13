"use client"

import Loading from "@/components/Loading";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from '@/context/AuthContext';
import withAuth from '@/hoc/withAuth';
import { Ban } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";



const Dashboard: React.FC = ({ params }) => {
  const { user, logout } = useAuth();
  const router = useRouter();

  const { toast } = useToast()

  const [data, setData] = useState(null)
  const [isLoading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/auth/customer/fetch-customers', {
      method: 'POST',
      headers: {
        "x-org-slug": params.slug,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    })
      .then((res) => res.json())
      .then((data) => {
        setData(data)
        setLoading(false)
      })
  }, [params.slug])

  const onMarkCustomerSpam = async (customerId, spam) => {
    // setLoading(true)
    try {
      const response = await fetch(`/api/auth/customer/mark-spam?customerId=${customerId}&spam=${spam}`, {
        method: 'POST',
        headers: {
          "x-org-slug": params.slug,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      })
      const respData = await response.json();

      if (response.ok) {
        console.log(respData)
        toast({
          title: 'Customer ' + (spam ? 'banned' : 'unbanned') + ' successfully'
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
  if (!data) return <p>No data</p>

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Customers</h1>
      </div>
      <div
        className="flex flex-1 justify-center rounded-lg border border-dashed shadow-sm" x-chunk="dashboard-02-chunk-1"
      >
        <Table>
          <TableCaption>Customers who have registered</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Avatar</TableHead>
              <TableHead className="w-[100px]">Details</TableHead>
              <TableHead>Banned</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data && data.length ? data.map((item, index) => {
              if (!item || !item.user) {
                return null;
              }

              return <TableRow key={index}>
                <TableCell className="font-medium">
                  <Avatar>
                    <AvatarImage src={`${item.user.profilePic}`} />
                    <AvatarFallback>
                      {(() => {
                        const name = item.user.name || item.user.email.split('@')[0];
                        const words = name.split(' ');

                        let initials;

                        if (words.length > 1) {
                          // If the name has multiple words, take the first letter of each word
                          initials = words.map(word => word[0]).join('').toUpperCase();
                        } else {
                          // If it's a single word, take the first two characters
                          initials = name.slice(0, 2).toUpperCase();
                        }

                        // Ensure it returns exactly 2 characters
                        return initials.length >= 2 ? initials.slice(0, 2) : initials.padEnd(2, initials[0]);
                      })()}
                    </AvatarFallback>
                  </Avatar>
                </TableCell>
                <TableCell>
                  {/* if name is blank use the first part of email  */}
                  <p className="text-sm font-medium leading-none">{item.user.name || item.user.email.split('@')[0]}</p>
                  <p className="text-sm text-muted-foreground">{item.user.email}</p>
                </TableCell>
                <TableCell>
                  {item.spam ? 'Yes' : 'No'}
                </TableCell>
                <TableCell className="text-right ">
                  <Button
                    variant="outline" onClick={() => {
                      onMarkCustomerSpam(item.id, !item.spam);
                      item.spam = !item.spam;
                      setData([...data]);
                    }} >
                    <Ban className="w-5 h-5 mr-2" />
                    {item.spam ? 'Unban' : 'Ban'}
                  </Button>
                </TableCell>
              </TableRow>
            }) : <TableRow className="text-center">
              <TableCell colSpan={4} >
                No customers yet
              </TableCell>
            </TableRow>}
          </TableBody>
        </Table>
      </div>
    </main>
  )
}
export default withAuth(Dashboard);

