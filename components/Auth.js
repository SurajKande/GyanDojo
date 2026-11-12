'use client';
import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Auth() {
  const [mode, setMode] = useState('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');

  async function go() {
    setMsg('');
    if (mode === 'signup') {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name } } });
      if (error) setMsg(error.message);
      else if (!data.session) setMsg('Account created. Confirm your email if asked, then sign in.');
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMsg(error.message);
    }
  }

  return (
    <div className="card">
      <h2>{mode === 'signup' ? 'Join the dojo' : 'Sign in'}</h2>
      {mode === 'signup' && <input placeholder="Display name" value={name} onChange={e => setName(e.target.value)} />}
      <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
      <input type="password" placeholder="Password (min 6 characters)" value={password} onChange={e => setPassword(e.target.value)} />
      <button onClick={go}>{mode === 'signup' ? 'Create account' : 'Sign in'}</button>
      <p className="err">{msg}</p>
      <small><a href="#" onClick={e => { e.preventDefault(); setMode(mode === 'signup' ? 'signin' : 'signup'); }}>
        {mode === 'signup' ? 'Have an account? Sign in' : 'New here? Create an account'}
      </a></small>
    </div>
  );
}
