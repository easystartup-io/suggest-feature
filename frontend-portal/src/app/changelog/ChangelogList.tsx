import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { headers } from 'next/headers';

interface ChangelogItem {
  title: string;
  html: string;
  coverImage: string;
  changelogDate: number;
  tags: string[];
}

async function getChangelogItems(): Promise<ChangelogItem[]> {
  const headersList = headers()
  const host = headersList.get('host') || 'localhost:3000'
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
    <div className="">
      {changelogItems.map((item, index) => (
        <div key={index} className="border-b">
          <div className='border-0 shadow-none'>
            <div className='grid grid-cols-6 my-4'>
              <div className="text-sm font-medium col-span-1">
                {format(new Date(item.changelogDate), 'MMMM d, yyyy')}
              </div>
              <div className='col-span-5'>
                <div className="flex justify-between items-center">
                  <div className="text-xl font-semibold">{item.title}</div>
                </div>
                <div className="flex my-2 space-x-1">
                  {item.tags.map((tag, tagIndex) => (
                    <Badge key={tagIndex} variant='secondary' className='rounded text-muted-foreground'>{tag.toUpperCase()}</Badge>
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
                <div dangerouslySetInnerHTML={{ __html: item.html }} className="prose" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
