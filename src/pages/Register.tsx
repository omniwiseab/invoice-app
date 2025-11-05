import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserPlus, Mail, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { authRateLimiter, formatTimeRemaining } from '../utils/rateLimiter';
import { logAuthError } from '../services/errorLogger';

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Password must be at least 8 characters and contain uppercase, lowercase, and number
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const validateForm = (): boolean => {
    if (!email || !password || !confirmPassword) {
      setError('All fields are required');
      return false;
    }

    if (!EMAIL_REGEX.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }

    if (!PASSWORD_REGEX.test(password)) {
      setError('Password must contain at least one uppercase letter, one lowercase letter, and one number');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!validateForm()) {
      return;
    }

    // Check rate limiting
    const rateLimitCheck = authRateLimiter.isAllowed(email, 'register');
    if (!rateLimitCheck.allowed) {
      const timeRemaining = rateLimitCheck.blockedUntil
        ? formatTimeRemaining(rateLimitCheck.blockedUntil - Date.now())
        : '';
      setError(`Too many registration attempts. Please try again in ${timeRemaining}.`);
      return;
    }

    setLoading(true);

    try {
      const { error } = await signUp(email, password);

      if (error) {
        // Log authentication error
        logAuthError('register', error.message || 'Registration failed', email);

        // Record failed attempt
        authRateLimiter.recordAttempt(email, 'register');

        if (error.message.includes('already registered')) {
          setError('Email address is already registered');
        } else {
          setError(error.message || 'An error occurred during registration');
        }
      } else {
        // Reset rate limit on successful registration
        authRateLimiter.reset(email, 'register');
        setSuccess(true);
        // Wait 2 seconds before navigating to login
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (err) {
      // Log unexpected error
      logAuthError('register', err instanceof Error ? err : 'Unknown error', email);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <UserPlus size={40} color="var(--primary-color)" />
          <h1>Create Account</h1>
          <p>Register to get started</p>
        </div>

        {error && (
          <div className="alert alert-error">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            <CheckCircle size={20} />
            <span>Account created! Check your email to verify your account.</span>
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
              minLength={8}
              autoComplete="new-password"
            />
            <small className="form-hint">At least 8 characters with uppercase, lowercase, and number</small>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">
              <Lock size={16} />
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={loading || success}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="link">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
