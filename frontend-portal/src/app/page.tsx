import { Metadata, ResolvingMetadata } from 'next'
import { headers } from 'next/headers'
import DashboardClient from './DashboardClient'

type Props = {
  searchParams: { [key: string]: string | string[] | undefined }
}

export async function generateMetadata(
  { searchParams }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const headersList = headers()
  const host = headersList.get('host') || 'localhost:3000'
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'https'

  // You can get the title or other metadata from searchParams or any other source
  const title = 'Dashboard'

  return {
    title,
    openGraph: {
      title,
      images: [
        {
          url: `${protocol}://${host}/api/portal/unauth/og/get-company?title=${encodeURIComponent(title)}`,
          width: 1200,
          height: 630,
          alt: 'Feedback page',
        }
      ],
    },
  }
}

async function getInitialPosts() {
  const headersList = headers()
  const host = headersList.get('host') || 'localhost:3000'
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'https'

  const res = await fetch(`${protocol}://${host}/api/portal/unauth/posts/get-roadmap-posts`, {
    headers: {
      'Content-Type': 'application/json',
      // Add any other necessary headers here
    },
  })

  if (!res.ok) {
    // Handle error
    console.error('Failed to fetch posts')
    return {}
  }

  return res.json()
}

export default async function Dashboard() {
  const initialPosts = await getInitialPosts()

  return <DashboardClient initialPosts={initialPosts} />
}
