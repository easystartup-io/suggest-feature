import { Calendar, CheckCircle, Circle, Eye, Loader, Play, XCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import Link from 'next/link';
import SetThemeAtuomatically from "./SetThemeAutomatically"
import { getInitMetadata } from "./layout"

export const statusConfig = {
  "OPEN": {
    icon: <Circle className="w-4 h-4 inline-block text-blue-500 flex-shrink-0" />,
    label: "OPEN"
  },
  "UNDER REVIEW": {
    icon: <Eye className="w-4 h-4 inline-block text-yellow-500 flex-shrink-0" />,
    label: "UNDER REVIEW"
  },
  "PLANNED": {
    icon: <Calendar className="w-4 h-4 inline-block text-blue-500 flex-shrink-0" />,
    label: "PLANNED"
  },
  "IN PROGRESS": {
    icon: <Loader className="w-4 h-4 inline-block text-orange-500 flex-shrink-0" />,
    label: "IN PROGRESS"
  },
  "LIVE": {
    icon: <Play className="w-4 h-4 inline-block text-green-500 flex-shrink-0" />,
    label: "LIVE"
  },
  "COMPLETE": {
    icon: <CheckCircle className="w-4 h-4 inline-block text-green-500 flex-shrink-0" />,
    label: "COMPLETE"
  },
  "CLOSED": {
    icon: <XCircle className="w-4 h-4 inline-block text-red-500 flex-shrink-0" />,
    label: "CLOSED"
  }
};

const PostList = ({ posts }) => {

  return (
    <ScrollArea className="h-full overflow-y-auto">
      <div className="grid gap-4 p-4">
        {posts && posts.length > 0 && posts.map((item) => (
          <Link
            key={item.id}
            className="w-full"
            href={
              `/b/${item.boardSlug}/p/${item.slug}`
            }
          >
            <button
              className={cn(
                "flex flex-col items-start gap-2 rounded-lg border p-4 text-left text-sm transition-all hover:bg-accent",
                "shadow-sm hover:shadow-md",
                "w-full"
              )}
            >
              <div className="flex w-full items-center justify-between mb-2">
                <div className="flex items-center">
                  <div className="w-5 h-5 flex items-center justify-center">
                    {(() => {
                      const st = statusConfig[item.status || 'OPEN'] || statusConfig['OPEN'];
                      return st.icon;
                    })()}
                  </div>
                  <div className="font-semibold line-clamp-3 pl-2">{item.title}</div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                </div>
              </div>

              <p className="line-clamp-3 text-sm text-muted-foreground flex-grow">
                {item.description}
              </p>

              <div className="w-full flex items-center justify-between mt-2">
                <Badge variant="secondary" className="text-xs">
                  {item.boardName}
                </Badge>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>👍 {item.votes || 0}</span>
                  <span>💬 {item.commentCount || 0}</span>
                </div>
              </div>
            </button>
          </Link>
        ))}
      </div>
    </ScrollArea>
  )
}

export default async function DashboardClient({ initialPosts, searchParams }) {
  const posts = initialPosts;
  const parsedData = await (await getInitMetadata())
  const org = parsedData.org
  const boards = parsedData.boards

  const roadmapOnly = searchParams.roadmapOnly

  return (
    <main className="flex min-h-[calc(100vh_-_theme(spacing.16))] flex-col gap-4 p-4 pt-2 md:gap-8 md:p-10 md:pt-6 w-full">
      <SetThemeAtuomatically searchParams={searchParams} />
      <div className="w-full items-center justify-center flex">
        <div className="w-full">
          <div className="w-full">
            {
              !roadmapOnly &&
              <div className="flex items-center font-semibold pb-4 text-lg">
                Boards
              </div>
            }
            {
              !roadmapOnly &&
              <div className="grid md:grid-cols-3 gap-6 w-full md:justify-between">
                {boards && boards.map((board) => {
                  return (
                    <Link href={`/b/${board.slug}`} key={board.id}>
                      <div className="bg-white dark:bg-background border border-gray-100 dark:border-0 rounded-lg p-4 w-full cursor-pointer hover:bg-gray-100" >
                        <div className="flex items-center justify-between">
                          <h2 className="text-lg font-semibold">{board.name}</h2>
                          <Badge>{board.postCount || '0'}</Badge>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            }
            {
              org && ((org.roadmapSettings && org.roadmapSettings.enabled) || (!org.roadmapSettings)) && <div className="w-full h-full">
                {
                  !roadmapOnly &&
                  <div className="flex items-center font-semibold pt-8 text-lg">
                    {(org && org.roadmapSettings && org.roadmapSettings.title) || 'Roadmap'}
                  </div>
                }
                <div className="grid md:grid-cols-3 gap-6 mt-6">
                  {
                    posts && Object.keys(posts).map((key) => {
                      return (<div key={key} className="bg-white dark:bg-background border border-gray-100 dark:border-0 rounded-lg p-4 flex flex-1 flex-col h-[calc(max(100vh/2,28rem))]">
                        <div className="flex items-center justify-center font-semibold pb-4">
                          {key} {posts[key].length > 0 ? `(${posts[key].length})` : ''}
                        </div>
                        {posts[key] && posts[key].length > 0 ? <PostList posts={posts[key]} /> : (
                          <div className="flex flex-col items-center justify-center h-full">
                            <div className="text-2xl font-semibold text-muted-foreground">No posts found</div>
                          </div>
                        )}
                      </div>
                      );
                    })
                  }
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    </main>
  )
}
