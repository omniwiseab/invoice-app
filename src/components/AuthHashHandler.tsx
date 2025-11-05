import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Component to handle Supabase auth hash tokens from email links.
 * Supabase sends tokens in URL hash (#access_token=...) which can cause
 * React Router to not match routes properly.
 */
export const AuthHashHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if URL has Supabase auth hash tokens
    const hash = window.location.hash;

    if (hash && (hash.includes('access_token') || hash.includes('type=recovery'))) {
      // This is a Supabase auth callback
      const currentPath = location.pathname;

      // If we're not already on reset-password, navigate there
      if (currentPath !== '/reset-password') {
        // Keep the hash fragment and navigate to reset-password
        navigate('/reset-password' + hash, { replace: true });
      }
    }
  }, [location, navigate]);

  return null; // This component renders nothing
};
