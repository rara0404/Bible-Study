import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { BookOpen, AlertCircle, UserPlus } from 'lucide-react';
import './AuthPage.css';

interface AuthPageProps {
  onLogin: (userId: number, username: string) => void;
  onShowRegister: () => void;
}

export function AuthPage({ onLogin, onShowRegister }: AuthPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }

      // Store user info in localStorage
      localStorage.setItem('userId', data.user_id);
      localStorage.setItem('username', data.username);
      localStorage.setItem('token', data.token || '');

      onLogin(data.user_id, data.username);
    } catch (err) {
      setError('Connection error. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-background"></div>
      
      <div className="auth-content">
        <div className="auth-logo">
          <BookOpen className="auth-logo-icon" />
          <h1>Bible Study</h1>
        </div>

        <Card className="auth-card">
          <CardHeader className="auth-header">
            <CardTitle>Welcome Back</CardTitle>
            <CardDescription>
              Sign in to your account to continue
            </CardDescription>
          </CardHeader>

          <CardContent className="auth-form-container">
            {error && (
              <Alert variant="destructive" className="auth-error">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleLogin} className="auth-form">
              <div className="form-group">
                <label htmlFor="username" className="form-label">
                  Username
                </label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="form-input"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={loading || !username || !password}
                className="auth-button"
                size="lg"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <div className="divider">
              <span>or</span>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={onShowRegister}
              disabled={loading}
              className="register-button"
              size="lg"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Create Account
            </Button>
          </CardContent>
        </Card>

        <p className="auth-footer">
          © 2025 Bible Study App. All rights reserved.
        </p>
      </div>
    </div>
  );
}
