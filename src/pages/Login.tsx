import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, Mail, Lock, AlertCircle } from 'lucide-react';
import { authRateLimiter, formatTimeRemaining } from '../utils/rateLimiter';
import { logAuthError } from '../services/errorLogger';

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const validateForm = (): boolean => {
    if (!email || !password) {
      setError('Email and password are required');
      return false;
    }

    if (!EMAIL_REGEX.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    // Check rate limiting
    const rateLimitCheck = authRateLimiter.isAllowed(email, 'login');
    if (!rateLimitCheck.allowed) {
      const timeRemaining = rateLimitCheck.blockedUntil
        ? formatTimeRemaining(rateLimitCheck.blockedUntil - Date.now())
        : '';
      setError(`Too many login attempts. Please try again in ${timeRemaining}.`);
      return;
    }

    setLoading(true);

    try {
      console.log('Attempting login for:', email);
      const { error } = await signIn(email, password);

      if (error) {
        console.error('Login error:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));

        // Log authentication error
        logAuthError('login', error.message || 'Login failed', email);

        // Check for specific error types
        let errorMsg = error.message || 'Invalid email or password';

        // Email not confirmed error
        if (errorMsg.includes('Email not confirmed') || errorMsg.includes('email_not_confirmed')) {
          setError('Please verify your email address before logging in. Check your inbox for the confirmation email.');
          return;
        }

        // Invalid credentials error
        if (errorMsg.includes('Invalid login credentials') || errorMsg.includes('invalid_grant')) {
          errorMsg = 'Invalid email or password. Please check your credentials.';
        }

        // Record failed attempt
        const result = authRateLimiter.recordAttempt(email, 'login');

        if (!result.allowed) {
          const timeRemaining = result.blockedUntil
            ? formatTimeRemaining(result.blockedUntil - Date.now())
            : '';
          setError(`Too many failed attempts. Account temporarily locked for ${timeRemaining}.`);
        } else {
          setError(`${errorMsg} (${result.remaining} attempts remaining)`);
        }
      } else {
        console.log('Login successful!');
        // Reset rate limit on successful login
        authRateLimiter.reset(email, 'login');
        navigate('/');
      }
    } catch (err) {
      console.error('Unexpected login error:', err);
      // Log unexpected error
      logAuthError('login', err instanceof Error ? err : 'Unknown error', email);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <LogIn size={40} color="var(--primary-color)" />
          <h1>Sign In</h1>
          <p>Sign in to your invoice account</p>
        </div>

        {error && (
          <div className="alert alert-error">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">
              <Mail size={16} />
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">
              <Lock size={16} />
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          <div className="auth-links">
            <Link to="/forgot-password" className="link">
              Forgot password?
            </Link>
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Don't have an account?{' '}
            <Link to="/register" className="link">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
