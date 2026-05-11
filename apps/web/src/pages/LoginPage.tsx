import { FormEvent, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { ApiClientError } from '../api/client';
import { useAuth } from '../hooks/useAuth';

export const LoginPage = (): JSX.Element => {
  const { authState, login } = useAuth();
  const [form, setForm] = useState({ login: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (authState) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await login(form);
    } catch (caughtError) {
      setError(
        caughtError instanceof ApiClientError
          ? caughtError.message
          : 'Unable to login',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <section className="login-panel">
        <div>
          <div className="eyebrow">Task Manager</div>
          <h1>Sign in</h1>
          <p className="muted">
            Use your username or email to access the dashboard.
          </p>
        </div>

        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            <span>Login</span>
            <input
              value={form.login}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  login: event.target.value,
                }))
              }
            />
          </label>
          <label>
            <span>Password</span>
            <input
              type="password"
              value={form.password}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  password: event.target.value,
                }))
              }
            />
          </label>
          {error ? <p className="error-text">{error}</p> : null}
          <button
            className="primary-button"
            disabled={submitting}
            type="submit"
          >
            {submitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </section>
    </div>
  );
};
