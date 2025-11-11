// src/components/Auth.jsx
import { useState } from 'react';
import { supabase } from '../supabaseClient.js';

export default function Auth({ onAuth }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('login'); // 'login' | 'signup' | 'forgot'
  const [message, setMessage] = useState('');

  const handleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setMessage(error.message);
    else onAuth && onAuth(data.user);
  };

  const handleSignUp = async () => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) setMessage(error.message);
    else setMessage('Check your email to confirm your account!');
  };

  const handleForgot = async () => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin
    });
    if (error) setMessage(error.message);
    else setMessage('Password reset email sent!');
  };

  // Enso colours
  const colors = {
    navy: '#0B1F3F',
    gold: '#FFD700'
  };

  return (
    <div
      style={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: colors.navy,
        padding: '20px', // allows space on smaller screens
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          padding: '30px',
          borderRadius: '12px',
          background: '#fff',
          boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
        }}
      >
        <h2 style={{ textAlign: 'center', color: colors.navy, marginBottom: '20px' }}>
          {mode === 'login' && 'Login'}
          {mode === 'signup' && 'Sign Up'}
          {mode === 'forgot' && 'Forgot Password'}
        </h2>

        {message && <p style={{ color: 'red', textAlign: 'center' }}>{message}</p>}

        {mode !== 'forgot' && (
          <>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                margin: '10px 0',
                borderRadius: '6px',
                border: '1px solid #ccc',
                fontSize: '16px',
              }}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                margin: '10px 0',
                borderRadius: '6px',
                border: '1px solid #ccc',
                fontSize: '16px',
              }}
            />
          </>
        )}

        {mode === 'forgot' && (
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              margin: '10px 0',
              borderRadius: '6px',
              border: '1px solid #ccc',
              fontSize: '16px',
            }}
          />
        )}

        {/* Buttons */}
        {mode === 'login' && (
          <>
            <button
              type="button"
              onClick={handleLogin}
              style={{
                width: '100%',
                padding: '12px',
                marginTop: '10px',
                borderRadius: '6px',
                border: 'none',
                background: colors.gold,
                color: colors.navy,
                fontWeight: 'bold',
                fontSize: '16px',
                cursor: 'pointer',
              }}
            >
              Login
            </button>
            <p style={{ textAlign: 'center', marginTop: '12px', fontSize: '14px' }}>
              <span style={{ cursor: 'pointer', color: colors.navy }} onClick={() => setMode('signup')}>
                Sign Up
              </span>{' '}
              |{' '}
              <span style={{ cursor: 'pointer', color: colors.navy }} onClick={() => setMode('forgot')}>
                Forgot Password
              </span>
            </p>
          </>
        )}

        {mode === 'signup' && (
          <>
            <button
              type="button"
              onClick={handleSignUp}
              style={{
                width: '100%',
                padding: '12px',
                marginTop: '10px',
                borderRadius: '6px',
                border: 'none',
                background: colors.gold,
                color: colors.navy,
                fontWeight: 'bold',
                fontSize: '16px',
                cursor: 'pointer',
              }}
            >
              Sign Up
            </button>
            <p style={{ textAlign: 'center', marginTop: '12px', fontSize: '14px' }}>
              <span style={{ cursor: 'pointer', color: colors.navy }} onClick={() => setMode('login')}>
                Back to Login
              </span>
            </p>
          </>
        )}

        {mode === 'forgot' && (
          <>
            <button
              type="button"
              onClick={handleForgot}
              style={{
                width: '100%',
                padding: '12px',
                marginTop: '10px',
                borderRadius: '6px',
                border: 'none',
                background: colors.gold,
                color: colors.navy,
                fontWeight: 'bold',
                fontSize: '16px',
                cursor: 'pointer',
              }}
            >
              Send Reset Email
            </button>
            <p style={{ textAlign: 'center', marginTop: '12px', fontSize: '14px' }}>
              <span style={{ cursor: 'pointer', color: colors.navy }} onClick={() => setMode('login')}>
                Back to Login
              </span>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
