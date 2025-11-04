import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { KeyRound, Mail, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      const { error } = await resetPassword(email);

      if (error) {
        setError('Ett fel inträffade. Kontrollera din e-postadress.');
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError('Ett oväntat fel inträffade. Försök igen.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <KeyRound size={40} color="var(--primary-color)" />
          <h1>Återställ lösenord</h1>
          <p>Ange din e-postadress så skickar vi instruktioner</p>
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
            <span>
              Vi har skickat instruktioner för återställning av lösenord till {email}.
              Kontrollera din inkorg!
            </span>
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">
                <Mail size={16} />
                E-post
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="din@email.com"
                required
                autoComplete="email"
              />
            </div>

            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? 'Skickar...' : 'Skicka återställningslänk'}
            </button>
          </form>
        )}

        <div className="auth-footer">
          <Link to="/login" className="link">
            <ArrowLeft size={16} />
            Tillbaka till inloggning
          </Link>
        </div>
      </div>
    </div>
  );
};
