import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { BookOpen, AlertCircle, CheckCircle } from 'lucide-react';
import './RegisterPage.css';

interface RegisterPageProps {
  onRegisterSuccess: (userId: number, username: string) => void;
  onBackToLogin: () => void;
}

export function RegisterPage({ onRegisterSuccess, onBackToLogin }: RegisterPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [registeredUsername, setRegisteredUsername] = useState('');

  // Validation states
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');

  const validateUsername = (value: string) => {
    if (!value.trim()) {
      setUsernameError('Username is required');
      return false;
    }
    if (value.length < 3) {
      setUsernameError('Username must be at least 3 characters');
      return false;
    }
    if (value.length > 20) {
      setUsernameError('Username must be 20 characters or less');
      return false;
    }
    setUsernameError('');
    return true;
  };

  const validatePassword = (value: string) => {
    if (!value) {
      setPasswordError('Password is required');
      return false;
    }
    if (value.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const validateConfirm = (value: string) => {
    if (!value) {
      setConfirmError('Please confirm your password');
      return false;
    }
    if (value !== password) {
      setConfirmError('Passwords do not match');
      return false;
    }
    setConfirmError('');
    return true;
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUsername(value);
    if (usernameError) validateUsername(value);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    if (passwordError) validatePassword(value);
    if (passwordConfirm && confirmError) validateConfirm(passwordConfirm);
  };

  const handleConfirmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPasswordConfirm(value);
    if (confirmError) validateConfirm(value);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate all fields
    const isUsernameValid = validateUsername(username);
    const isPasswordValid = validatePassword(password);
    const isConfirmValid = validateConfirm(passwordConfirm);

    if (!isUsernameValid || !isPasswordValid || !isConfirmValid) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username.trim(),
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Registration failed');
        setLoading(false);
        return;
      }

      setSuccess(true);
      setRegisteredUsername(data.username);

      // Auto-login after successful registration
      localStorage.setItem('userId', data.user_id);
      localStorage.setItem('username', data.username);
      localStorage.setItem('token', data.token || '');

      // Redirect after a short delay
      setTimeout(() => {
        onRegisterSuccess(data.user_id, data.username);
      }, 1500);
    } catch (err) {
      setError('Connection error. Please try again.');
      console.error('Register error:', err);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="register-container">
        <div className="register-background"></div>

        <div className="register-content">
          <Card className="register-card success-card">
            <CardContent className="success-content">
              <div className="success-icon">
                <CheckCircle className="icon-large" />
              </div>
              <h2 className="success-title">Welcome, {registeredUsername}!</h2>
              <p className="success-message">
                Your account has been created successfully. You're being redirected to the app...
              </p>
              <div className="loading-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="register-container">
      <div className="register-background"></div>

      <div className="register-content">
        <div className="register-logo">
          <BookOpen className="register-logo-icon" />
          <h1>Create Account</h1>
        </div>

        <Card className="register-card">
          <CardHeader className="register-card-header">
            <CardTitle>Join Bible Study</CardTitle>
            <CardDescription>
              Create your account and start your Bible study journey
            </CardDescription>
          </CardHeader>

          <CardContent className="register-form-container">
            {error && (
              <Alert variant="destructive" className="register-alert-error">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleRegister} className="register-form">
              <div className="form-group">
                <label htmlFor="username" className="form-label">
                  Username
                </label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Choose a username"
                  value={username}
                  onChange={handleUsernameChange}
                  onBlur={() => validateUsername(username)}
                  disabled={loading}
                  className={`form-input ${usernameError ? 'error' : ''}`}
                  maxLength={20}
                />
                {usernameError && (
                  <p className="field-error">{usernameError}</p>
                )}
                <p className="field-hint">
                  {username.length}/20 characters
                </p>
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a password"
                  value={password}
                  onChange={handlePasswordChange}
                  onBlur={() => validatePassword(password)}
                  disabled={loading}
                  className={`form-input ${passwordError ? 'error' : ''}`}
                />
                {passwordError && (
                  <p className="field-error">{passwordError}</p>
                )}
                <p className="field-hint">
                  At least 6 characters
                </p>
              </div>

              <div className="form-group">
                <label htmlFor="password-confirm" className="form-label">
                  Confirm Password
                </label>
                <Input
                  id="password-confirm"
                  type="password"
                  placeholder="Confirm your password"
                  value={passwordConfirm}
                  onChange={handleConfirmChange}
                  onBlur={() => validateConfirm(passwordConfirm)}
                  disabled={loading}
                  className={`form-input ${confirmError ? 'error' : ''}`}
                />
                {confirmError && (
                  <p className="field-error">{confirmError}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={loading || !username || !password || !passwordConfirm}
                className="register-submit-button"
                size="lg"
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>

            <p className="register-terms">
              By creating an account, you agree to our terms of service.
            </p>

            <div className="register-login-link">
              <span>Already have an account? </span>
              <button
                type="button"
                onClick={onBackToLogin}
                disabled={loading}
                className="login-link-button"
              >
                Sign In
              </button>
            </div>
          </CardContent>
        </Card>

        <p className="register-footer">
          © 2025 Bible Study App. All rights reserved.
        </p>
      </div>
    </div>
  );
}
