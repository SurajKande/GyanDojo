'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import Auth from '../components/Auth';
import Quiz from '../components/Quiz';
import Leaderboard from '../components/Leaderboard';

const today = () => new Date().toISOString().slice(0, 10); // UTC day, same as the database

export default function Home() {
  const [user, setUser] = useState(undefined);
  const [state, setState] = useState('loading'); // loading | ready | playing | done | error
  const [score, setScore] = useState(null);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const name = user.user_metadata?.name || user.email.split('@')[0];
      await supabase.from('profiles').upsert({ id: user.id, display_name: name }, { onConflict: 'id', ignoreDuplicates: true });
      const { error } = await supabase.rpc('build_daily_quiz', { p_date: today() });
      if (error) { setMsg(error.message); setState('error'); return; }
      const { data } = await supabase.from('attempts').select('score,finished_at')
        .eq('quiz_date', today()).eq('user_id', user.id).maybeSingle();
      if (data?.finished_at) { setScore(data.score); setState('done'); } else setState('ready');
    })();
  }, [user]);

  if (user === undefined) return <p>Loading…</p>;
  if (!user) return <Auth />;

  return (<>
    <header>
      <h1>GyanDojo</h1>
      <nav><Link href="/review">Review</Link><button onClick={() => supabase.auth.signOut()}>Sign out</button></nav>
    </header>
    {state === 'loading' && <p>Loading…</p>}
    {state === 'error' && <p className="err">{msg}</p>}
    {state === 'ready' && (
      <div className="card"><h2>Today’s quiz</h2><p>20 questions. One attempt.</p>
        <button onClick={() => setState('playing')}>Start</button></div>
    )}
    {state === 'playing' && <Quiz date={today()} onDone={s => { setScore(s); setState('done'); }} />}
    {state === 'done' && (<>
      <div className="card"><h2>Your score: {score}</h2><p>Check the Review tab for explanations.</p></div>
      <Leaderboard date={today()} />
    </>)}
  </>);
}
