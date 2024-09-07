"use client"

import Loading from "@/components/Loading";
import { useAuth } from '@/context/AuthContext';
import withAuth from '@/hoc/withAuth';
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from 'react';
import ActivityOverview from "./ActivityOverview";
import ExpandedDashboard from "./ExpandedDashboard";
import Roadmap from "./Roadmap";


const Dashboard: React.FC = ({ params }) => {
  const { logout } = useAuth();
  const router = useRouter();

  const [boards, setBoards] = useState([{ name: "All Boards", value: "ALL" }])
  const [isLoading, setLoading] = useState(true)

  useEffect(() => {
    if (!params.slug) {
      return;
    }
    fetch('/api/auth/boards/fetch-boards', {
      headers: {
        "x-org-slug": params.slug,
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.json())
      .then((data) => {
        // set boards as an array of objects with name and value properties
        // e.g. { name: "Board 1", value: 10 }
        const boardList = data.map((board) => ({
          name: board.name,
          value: board.id
        }));
        setBoards([
          { name: 'All Boards', value: 'ALL' }, ...boardList])
      })
  }, [params.slug])

  return (
    <div className="p-4 space-y-8">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <ExpandedDashboard params={params} boards={boards} />
      {/* <ActivityOverview params={params} boards={boards} /> */}
      <Roadmap />
    </div>
  );
}
export default withAuth(Dashboard);

