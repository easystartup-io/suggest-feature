"use client"

import { Button } from "@/components/ui/button"
import withAuth from '@/hoc/withAuth';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from "next/navigation"
import { useContext, useEffect } from "react";
import { SidebarContext } from "../layout";


const Dashboard: React.FC = ({ }) => {
  const { logout } = useAuth();
  const router = useRouter();


  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 h-full">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Dashboard</h1>
      </div>
      <div
        className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm" x-chunk="dashboard-02-chunk-1 h-full"
      >
        <div className="flex flex-col items-center gap-1 text-center h-[calc(100vh/2)] justify-center">
          Let&apos;s get started by creating your first post
        </div>
      </div>
    </main>
  )
}
export default withAuth(Dashboard);

