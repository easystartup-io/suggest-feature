import React from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    <div className="space-y-8">
      {changelogItems.map((item, index) => (
        <Card key={index} className="overflow-hidden">
          <CardHeader className="pb-0">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl font-semibold">{item.title}</CardTitle>
              <div className="text-sm text-gray-500">
                {format(new Date(item.changelogDate), 'MMMM d, yyyy')}
              </div>
            </div>
            <div className="flex gap-2 mt-2">
              {item.tags.map((tag, tagIndex) => (
                <Badge key={tagIndex} variant="secondary">{tag}</Badge>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            {item.coverImage && (
              <div className="mb-4">
                <img
                  src={item.coverImage}
                  alt={item.title}
                  className="rounded-lg object-cover w-full h-auto max-h-[400px]"
                />
              </div>
            )}
            <div dangerouslySetInnerHTML={{ __html: item.html }} className="prose max-w-none" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
