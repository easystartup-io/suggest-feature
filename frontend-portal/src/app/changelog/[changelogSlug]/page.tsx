import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { headers } from 'next/headers';
import { ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { defaultMetadata } from '@/app/layout';
import { ResolvingMetadata, Metadata } from 'next';
import { Props } from 'next/script';

interface ChangelogItem {
  title: string;
  html: string;
  coverImage: string;
  changelogDate: number;
  tags: string[];
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const category = 'Changelog';
  const item = await getChangelogItems(params);
  const title = item?.title || category

  return await defaultMetadata(category, title)
}

async function getChangelogItems(params): Promise<ChangelogItem[]> {
  const headersList = headers()
  const host = headersList.get('host') || 'localhost:3000'
  const protocol = 'https';
  const path = 'api/portal/unauth/changelog/fetch-changelog';

  const res = await fetch(`${protocol}://${host}/${path}?changelogSlug=${params.changelogSlug}`, { next: { revalidate: 10 } });

  if (!res.ok) {
    throw new Error('Failed to fetch changelog items');
  }

  return res.json();
}

export default async function ChangelogList({ params }) {
  const item = await getChangelogItems(params);

  return (
    <div className="px-4 md:px-10">
      <main className="flex flex-col gap-4 pt-4 md:pt-6 w-full">
        <div className="w-full">
          <div className="w-full">
            <div className="flex items-center w-full space-x-1">
              <Link href='/changelog' className='flex'>
                <Button variant="outline" className="rounded-r-none font-bold flex" >
                  <ArrowLeft className="font-bold h-5 w-5 mr-2" />
                  Back to Changelog
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <div className="border-b mt-6">
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
              <div dangerouslySetInnerHTML={{ __html: item.html }} className="prose dark:prose-invert" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
