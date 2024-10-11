import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { headers } from 'next/headers';
import Link from 'next/link';
import { StickyDate } from './StickyDate';

interface ChangelogItem {
  title: string;
  html: string;
  coverImage: string;
  changelogDate: number;
  tags: string[];
  slug: string;
}

async function getChangelogItems(): Promise<ChangelogItem[]> {
  const headersList = headers();
  const host = headersList.get('host') || 'localhost:3000';
  const protocol = 'https';
  const path = 'api/portal/unauth/changelog/get-changelog-posts';

  const res = await fetch(`${protocol}://${host}/${path}`, { next: { revalidate: 10 } });

  if (!res.ok) {
    throw new Error('Failed to fetch changelog items');
  }

  return res.json();
}

export default async function ChangelogList() {
  const changelogItems = await getChangelogItems();

  return (
    <div className="space-y-6">
      {changelogItems.map((item, index) => (
        <div key={index} className="border-b pb-4">
          <div className="shadow-none">
            <div className="grid md:grid-cols-6 gap-4">
              <div className="md:col-span-1">
                <StickyDate
                  date={format(new Date(item.changelogDate), 'MMMM d, yyyy')}
                  title={item.title}
                  index={index}
                />
              </div>
              <div className="md:col-span-5">
                <div className="flex flex-col">
                  <div className="text-xl font-semibold">
                    <Link href={`/changelog/${item.slug}`}>{item.title}</Link>
                  </div>
                  <div className="flex my-2 space-x-1">
                    {item.tags.map((tag, tagIndex) => (
                      <Badge key={tagIndex} variant="secondary" className="rounded text-muted-foreground">
                        {tag.toUpperCase()}
                      </Badge>
                    ))}
                  </div>
                  {item.coverImage && (
                    <div className="mb-4 w-full">
                      <img
                        src={item.coverImage}
                        alt={item.title}
                        className="rounded-lg object-cover w-full h-full"
                      />
                    </div>
                  )}
                  <div dangerouslySetInnerHTML={{ __html: item.html }} className="prose dark:prose-invert" />
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

