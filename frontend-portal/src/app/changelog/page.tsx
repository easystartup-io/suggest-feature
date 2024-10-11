import { Suspense } from 'react';
import ChangelogList from './ChangelogList';
import Loading from './loading';
import SubscribeToChangelog from './SubscribeToChangelog';

export const dynamic = 'force-dynamic';

export default function ChangelogPage() {
  return (
    <div className="container mx-auto px-4 md:px-10 py-8">
      <h1 className="text-3xl font-bold mb-2">Changelog</h1>
      <div className='pb-8 border-b flex items-center space-x-2'>
        Follow up on the latest improvements and updates.
        <SubscribeToChangelog />
      </div>
      <div className='mb-4'></div>
      <Suspense fallback={<Loading />}>
        <ChangelogList />
      </Suspense>
    </div>
  );
}
