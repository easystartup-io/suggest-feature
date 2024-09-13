"use client"

import PostsScreen from "@/components/post/PostsScreen";
import withAuth from "@/hoc/withAuth";

const Dashboard: React.FC = ({ params }) => {

  return (
    <PostsScreen params={params} />
  )
}

export default withAuth(Dashboard);

