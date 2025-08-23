import { useSearchParams, Navigate } from 'react-router-dom';
import { TwitterCallback } from './TwitterCallback';

export function RootRoute() {
  const [searchParams] = useSearchParams();
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  if (code && state) {
    return <TwitterCallback />;
  }

  return <Navigate to="/user" replace />;
}
