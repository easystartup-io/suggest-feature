import { headers } from 'next/headers'
import DashboardClient from './DashboardClient'

async function getInitialPosts() {
  const headersList = headers()
  const host = headersList.get('host') || 'localhost:3000'
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'https'

  const res = await fetch(`${protocol}://${host}/api/portal/unauth/posts/get-roadmap-posts`, {
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!res.ok) {
    console.error('Failed to fetch posts')
    return {}
  }

  return res.json()
}

export default async function Dashboard({ searchParams }) {
  const initialPosts = await getInitialPosts()

  return <DashboardClient initialPosts={initialPosts} searchParams={searchParams} />
}
