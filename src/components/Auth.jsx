// src/components/Auth.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient.js';

export default function Auth({ onAuth }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('login'); // 'login' | 'signup' | 'forgot'
  const [message, setMessage] = useState('');
  const [canvasRef, setCanvasRef] = useState(null);

  const colors = {
    navy: '#0B1F3F',
    gold: '#FFD700'
  };

  const handleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setMessage(error.message);
      console.error("Login error:", error);
    } else {
      console.log("Login success, session:", data.session);
      setMessage("Login successful!");
      onAuth && onAuth(data.session.user);
    }
  };

  const handleSignUp = async () => {
    if (!name.trim()) {
      setMessage("Please enter your name.");
      return;
    }
    const { data, error } = await supabase.auth.signUp(
      { email, password },
      { data: { full_name: name } }
    );
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

  // ---- Animated Tech Background ----
  useEffect(() => {
    if (!canvasRef) return;
    const canvas = canvasRef;
    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    const nodes = [];
    const nodeCount = 50;
    const maxDistance = 150;

    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 2 + 1.5
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw connections
      for (let i = 0; i < nodeCount; i++) {
        for (let j = i + 1; j < nodeCount; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < maxDistance) {
            ctx.strokeStyle = `rgba(255,215,0,${0.15 * (1 - dist / maxDistance)})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw nodes
      nodes.forEach(node => {
        ctx.fillStyle = `rgba(255,215,0,0.25)`;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fill();

        node.x += node.vx;
        node.y += node.vy;

        if (node.x < 0 || node.x > width) node.vx *= -1;
        if (node.y < 0 || node.y > height) node.vy *= -1;
      });

      requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, [canvasRef]);

  return (
    <div
      style={{
        height: '100vh',
        width: '100vw',
        position: 'relative',
        background: colors.navy,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
      }}
    >
      {/* Canvas for tech background */}
      <canvas
        ref={setCanvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 0,
        }}
      />

      {/* Login box */}
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          padding: '30px',
          borderRadius: '12px',
          background: '#fff',
          boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        <h2 style={{ textAlign: 'center', color: colors.navy, marginBottom: '20px' }}>
          {mode === 'login' && 'Login'}
          {mode === 'signup' && 'Sign Up'}
          {mode === 'forgot' && 'Forgot Password'}
        </h2>

        {message && <p style={{ color: 'red', textAlign: 'center' }}>{message}</p>}

        {(mode === 'signup') && (
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={e => setName(e.target.value)}
            style={{
              width: '80%',
              padding: '12px',
              margin: '8px 0',
              borderRadius: '6px',
              border: '1px solid #ccc',
              fontSize: '16px',
            }}
          />
        )}

        {(mode === 'login' || mode === 'signup') && (
          <>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{
                width: '80%',
                padding: '12px',
                margin: '8px 0',
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
                width: '80%',
                padding: '12px',
                margin: '8px 0',
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
              width: '80%',
              padding: '12px',
              margin: '8px 0',
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
                width: '85%',
                padding: '12px',
                marginTop: '12px',
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
                width: '85%',
                padding: '12px',
                marginTop: '12px',
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
                width: '85%',
                padding: '12px',
                marginTop: '12px',
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
