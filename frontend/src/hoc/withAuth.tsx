import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';

const withAuth = (WrappedComponent: React.ComponentType) => {
  const ComponentWithAuth = (props: any) => {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading && !user) {
        router.push('/login');
      }
    }, [user, loading, router]);

    if (loading || !user) {
      return <p>Loading...</p>;
    }

    return <WrappedComponent {...props} />;
  };
  // Need to do this because getting Component defintion is missing display name error

  ComponentWithAuth.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return ComponentWithAuth;
  // return (props: any) => {
  //   const { user, loading } = useAuth();
  //   const router = useRouter();
  //
  //   useEffect(() => {
  //     if (!loading && !user) {
  //       router.push('/login');
  //     }
  //   }, [user, loading, router]);
  //
  //   if (loading || !user) {
  //     return <p>Loading...</p>;
  //   }
  //
  //   return <WrappedComponent {...props} />;
  // };
};

export default withAuth;

