// src/components/FeedbackForm.jsx
import { useState } from 'react';
import { supabase } from './supabaseClient.js';

export default function FeedbackForm({ onClose }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState(''); // success or error messages
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus('');

    try {
      const { data, error } = await supabase.from('feedback').insert([
        {
          name,
          email,
          message,
        },
      ]);

      if (error) throw error;

      setStatus('Feedback submitted successfully!');
      setName('');
      setEmail('');
      setMessage('');
    } catch (err) {
      console.error('Error submitting feedback:', err);
      setStatus('Error submitting feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          background: '#fff',
          padding: '30px',
          borderRadius: '12px',
          boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
          position: 'relative',
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: 'transparent',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer',
          }}
        >
          &times;
        </button>

        <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Feedback</h2>

        {status && (
          <p
            style={{
              color: status.includes('success') ? 'green' : 'red',
              textAlign: 'center',
              marginBottom: '10px',
            }}
          >
            {status}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
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
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '12px',
              margin: '10px 0',
              borderRadius: '6px',
              border: '1px solid #ccc',
              fontSize: '16px',
            }}
          />
          <textarea
            placeholder="Message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            rows={4}
            style={{
              width: '100%',
              padding: '12px',
              margin: '10px 0',
              borderRadius: '6px',
              border: '1px solid #ccc',
              fontSize: '16px',
              resize: 'vertical',
            }}
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              marginTop: '10px',
              borderRadius: '6px',
              border: 'none',
              background: '#FFD700',
              color: '#001f3f',
              fontWeight: 'bold',
              fontSize: '16px',
              cursor: 'pointer',
            }}
          >
            {loading ? 'Submitting...' : 'Submit'}
          </button>
        </form>
      </div>
    </div>
  );
}
