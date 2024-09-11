import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import Loading from '@/components/Loading';
import { Button } from '@/components/ui/button';

const withAuth = (WrappedComponent: React.ComponentType) => {
  const ComponentWithAuth = (props: any) => {
    const { user, loading, failed } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading && !user && !failed) {
        router.push('/login');
      }
    }, [user, loading, router]);

    if (failed) {
      return <div className='h-screen w-full flex flex-col items-center justify-center space-y-2'>
        <Loading className='h-32' />
        <div>
          Failed to load user. Please check if internet issues. And reload the page.
        </div>
        <div className=''>
          <Button onClick={() => {
            router.push('/login');
          }}>
            Go to login page
          </Button>
        </div>
      </div>
    }

    if (loading || !user) {
      return <Loading />;
    }

    return <WrappedComponent {...props} />;
  };
  // Need to do this because getting Component defintion is missing display name error

  ComponentWithAuth.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return ComponentWithAuth;
};

export default withAuth;

