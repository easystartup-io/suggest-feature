import { Calendar, CheckCircle, Circle, Eye, Loader, Play, XCircle } from "lucide-react"
import { PostCard } from "@/components/PostCard"
import { fetchLoggedInUserDetails } from "@/app/layout"
import { headers, cookies } from "next/headers"

export const statusConfig = {
  "OPEN": {
    icon: <Circle className="w-4 h-4 inline-block mr-2 text-blue-500" />,
    label: "OPEN"
  },
  "UNDER REVIEW": {
    icon: <Eye className="w-4 h-4 inline-block mr-2 text-yellow-500" />,
    label: "UNDER REVIEW"
  },
  "PLANNED": {
    icon: <Calendar className="w-4 h-4 inline-block mr-2 text-blue-500" />,
    label: "PLANNED"
  },
  "IN PROGRESS": {
    icon: <Loader className="w-4 h-4 inline-block mr-2 text-orange-500" />,
    label: "IN PROGRESS"
  },
  "LIVE": {
    icon: <Play className="w-4 h-4 inline-block mr-2 text-green-500" />,
    label: "LIVE"
  },
  "COMPLETE": {
    icon: <CheckCircle className="w-4 h-4 inline-block mr-2 text-green-500" />,
    label: "COMPLETE"
  },
  "CLOSED": {
    icon: <XCircle className="w-4 h-4 inline-block mr-2 text-red-500" />,
    label: "CLOSED"
  }
};

async function fetchPost(user, boardSlug, postSlug) {
  const headersList = headers();
  const cookiesList = cookies();
  const host = headersList.get('host') || 'localhost:3000';
  const protocol = 'https:';

  const path = user ? 'api/portal/auth/posts/fetch-post' : 'api/portal/unauth/posts/fetch-post';

  const resp = await fetch(`${protocol}//${host}/${path}?boardSlug=${boardSlug}&postSlug=${postSlug}`, {
    headers: {
      Authorization: user ? cookiesList?.get('token')?.value : null
    },
    // Need to set no store to avoid caching issues. When upvoting and going to post, its not showing the upvoted post
    cache: user ? 'no-store' : 'force-cache'
  });
  if (!resp.ok) {
    return null;
  }
  const data = await resp.json()
  if (!data.priority) {
    data.priority = "Medium"
  }
  return data
}

export default async function Dashboard({ params }) {
  const loggedInUser = await fetchLoggedInUserDetails()
  const post = await fetchPost(loggedInUser, params.slug, params.postSlug);

  if (!post) {
    return <div className="flex items-center justify-center w-full  h-[50vh] font-bold text-xl">Post not found</div>
  }

  return (
    <main className="flex min-h-[calc(100vh_-_theme(spacing.16))] flex-col gap-4 p-4 pt-2 md:gap-8 md:p-10 md:pt-2 w-full">
      <div className="w-full">
        <PostCard params={params} existingPost={post} />
      </div>
    </main>
  )
}

