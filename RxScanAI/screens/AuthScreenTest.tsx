import React, { useState } from 'react';

export default function AuthScreenTest({ onDone }: { onDone: () => void }) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSubmit = () => {
    if (!email || !password) {
      showToast('Please fill in all fields.', 'error');
      return;
    }
    if (mode === 'signup' && !name) {
      showToast('Please enter your name.', 'error');
      return;
    }
    if (mode === 'login') {
      showToast('Login successful! Welcome back 👋', 'success');
    } else {
      showToast('Account created! Welcome aboard 🎉', 'success');
    }
  };

  const toggleMode = () => {
    setMode(prev => prev === 'login' ? 'signup' : 'login');
    setName('');
    setEmail('');
    setPassword('');
    setToast(null);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      backgroundColor: '#03101F',
      color: 'white',
      padding: '20px',
      position: 'relative'
    }}>

      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: '30px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '14px 28px',
          borderRadius: '10px',
          backgroundColor: toast.type === 'success' ? '#06D68A' : '#ff4d6a',
          color: toast.type === 'success' ? '#03101F' : 'white',
          fontWeight: 'bold',
          fontSize: '15px',
          zIndex: 999,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          whiteSpace: 'nowrap'
        }}>
          {toast.message}
        </div>
      )}

      <h1 style={{ color: '#00CEEA', marginBottom: '20px' }}>
        {mode === 'login' ? 'Login' : 'Sign Up'}
      </h1>

      {mode === 'signup' && (
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{
            padding: '10px',
            margin: '10px',
            borderRadius: '5px',
            border: 'none',
            width: '300px',
            fontSize: '15px'
          }}
        />
      )}

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{
          padding: '10px',
          margin: '10px',
          borderRadius: '5px',
          border: 'none',
          width: '300px',
          fontSize: '15px'
        }}
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{
          padding: '10px',
          margin: '10px',
          borderRadius: '5px',
          border: 'none',
          width: '300px',
          fontSize: '15px'
        }}
      />

      <button
        onClick={handleSubmit}
        style={{
          padding: '15px',
          margin: '20px',
          borderRadius: '10px',
          border: 'none',
          background: 'linear-gradient(90deg, #00CEEA, #013270)',
          color: 'white',
          fontSize: '16px',
          fontWeight: 'bold',
          width: '300px',
          cursor: 'pointer'
        }}
      >
        {mode === 'login' ? 'Login →' : 'Create Account →'}
      </button>

      <button
        onClick={toggleMode}
        style={{
          padding: '10px',
          margin: '10px',
          borderRadius: '5px',
          border: 'none',
          background: '#1a3a5c',
          color: 'white',
          cursor: 'pointer'
        }}
      >
        Switch to {mode === 'login' ? 'Sign Up' : 'Login'}
      </button>

      <button
        onClick={onDone}
        style={{
          padding: '10px',
          margin: '10px',
          borderRadius: '5px',
          border: 'none',
          background: '#06D68A',
          color: 'white',
          cursor: 'pointer'
        }}
      >
        Skip to App
      </button>
    </div>
  );
}