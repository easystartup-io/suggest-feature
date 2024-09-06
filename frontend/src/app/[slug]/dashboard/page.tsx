"use client"

import Loading from "@/components/Loading";
import { useAuth } from '@/context/AuthContext';
import withAuth from '@/hoc/withAuth';
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from 'react';
import ActivityOverview from "./ActivityOverview";
import ExpandedDashboard from "./ExpandedDashboard";
import Roadmap from "./Roadmap";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


const PostItem = ({ title, status, votes }) => (
  <div className="flex items-center space-x-2 mb-4">
    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
      <span className="text-sm">^{votes}</span>
    </div>
    <div className="flex-1">
      <h3 className="text-sm font-medium">{title}</h3>
      {status && <p className="text-xs text-gray-500 uppercase">{status}</p>}
    </div>
  </div>
);

const NewAndStalePosts = () => {
  const newPosts = [
    { title: 'test', votes: 1 },
    { title: 'XXXXXXXX XXXX XXXX XXXX XXXX XXXX XXXX XXXXXXXX XXXX XXXX', status: 'IN PROGRESS', votes: 1 },
    { title: 'dm9', votes: 1 },
  ];

  return (
    <Card className="w-full">
      <Tabs defaultValue="new-posts" className="w-full">
        <CardHeader className="flex items-center justify-start w-full">
          <TabsList>
            <TabsTrigger value="new-posts">New posts</TabsTrigger>
            <TabsTrigger value="stale-posts">Stale posts</TabsTrigger>
          </TabsList>
        </CardHeader>
        <CardContent>
          <TabsContent value="new-posts">
            {newPosts.map((post, index) => (
              <PostItem key={index} {...post} />
            ))}
          </TabsContent>
          <TabsContent value="stale-posts">
            <div className="flex flex-col items-center justify-center h-40">
              <span className="text-4xl">..!..</span>
              <p className="mt-2 text-sm text-gray-500">None of your posts are stale.</p>
            </div>
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
};

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
    <div className="p-4 space-y-8">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <ExpandedDashboard params={params} />
      <ActivityOverview />
      <NewAndStalePosts />
      <Roadmap />
    </div>
  );
}
export default withAuth(Dashboard);

