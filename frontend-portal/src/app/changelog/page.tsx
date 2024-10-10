import { Suspense } from 'react';
import ChangelogList from './ChangelogList';
import Loading from './loading';

export const dynamic = 'force-dynamic';

export default function ChangelogPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Changelog</h1>
      <Suspense fallback={<Loading />}>
        <ChangelogList />
      </Suspense>
    </div>
  );
}
