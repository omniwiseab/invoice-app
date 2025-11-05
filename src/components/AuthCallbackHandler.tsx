import { useEffect, useState } from 'react';
import { ResetPassword } from '../pages/ResetPassword';

/**
 * Component that intercepts Supabase auth callbacks with hash tokens.
 * Renders ResetPassword directly when recovery tokens are detected,
 * bypassing React Router entirely for auth callbacks.
 */
export const AuthCallbackHandler = ({ children }: { children: React.ReactNode }) => {
  const [isAuthCallback, setIsAuthCallback] = useState<boolean | null>(null);

  useEffect(() => {
    const hash = window.location.hash;

    // Check if this is a Supabase auth callback
    if (hash && (hash.includes('type=recovery') || (hash.includes('access_token') && hash.includes('type=')))) {
      console.log('Auth callback detected, rendering ResetPassword directly');
      setIsAuthCallback(true);

      // Update URL to clean path without triggering navigation
      if (window.location.pathname !== '/reset-password') {
        window.history.replaceState({}, '', '/reset-password' + hash);
      }
    } else {
      setIsAuthCallback(false);
    }
  }, []);

  // Show loading while checking
  if (isAuthCallback === null) {
    return null;
  }

  // If this is an auth callback, render ResetPassword directly and skip router
  if (isAuthCallback) {
    return <ResetPassword />;
  }

  // Otherwise, render normal app routes
  return <>{children}</>;
};
