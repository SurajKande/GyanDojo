'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import Auth from '../components/Auth';
import Quiz from '../components/Quiz';
import Leaderboard from '../components/Leaderboard';

const today = () => new Date().toISOString().slice(0, 10); // UTC day, same as the database
const key = d => d.toISOString().slice(0, 10);

export default function Home() {
  const [user, setUser] = useState(undefined);
  const [state, setState] = useState('loading'); // loading | ready | playing | done | error
  const [score, setScore] = useState(null);
  const [resume, setResume] = useState(false);
  const [streak, setStreak] = useState(0);
  const [msg, setMsg] = useState('');

  async function loadStreak() {
    const { data } = await supabase.from('attempts').select('quiz_date').not('finished_at', 'is', null);
    const days = new Set((data || []).map(a => a.quiz_date));
    const d = new Date();
    if (!days.has(key(d))) d.setUTCDate(d.getUTCDate() - 1);
    let s = 0;
    while (days.has(key(d))) { s++; d.setUTCDate(d.getUTCDate() - 1); }
    setStreak(s);
  }

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
      loadStreak();
      const { data } = await supabase.from('attempts').select('score,finished_at')
        .eq('quiz_date', today()).eq('user_id', user.id).maybeSingle();
      if (data?.finished_at) { setScore(data.score); setState('done'); }
      else { setResume(!!data); setState('ready'); }
    })();
  }, [user]);

  if (user === undefined) return <p>Loading…</p>;
  if (!user) return <Auth />;

  return (<>
    <header>
      <h1>Gyan<span style={{ color: '#4f46e5' }}>Dojo</span></h1>
      <nav>
        {streak > 0 && <span className="streak">🔥 {streak}</span>}
        <Link href="/review">Review</Link>
        <button className="ghost" onClick={() => supabase.auth.signOut()}>Sign out</button>
      </nav>
    </header>
    {state === 'loading' && <p>Loading…</p>}
    {state === 'error' && <p className="err">{msg}</p>}
    {state === 'ready' && (
      <div className="card">
        <small>Daily challenge</small>
        <h2>Today’s quiz</h2>
        <p>20 questions across 10 topics. Answers lock as you go, and difficulty rises through the season.</p>
        <button className="primary" onClick={() => setState('playing')}>{resume ? 'Resume quiz' : 'Start quiz'}</button>
      </div>
    )}
    {state === 'playing' && <Quiz date={today()} onDone={s => { setScore(s); setState('done'); loadStreak(); }} />}
    {state === 'done' && (<>
      <div className="card">
        <small>Today’s score</small>
        <p className="big">{score}</p>
        <p>{streak > 0 ? `You’re on a ${streak}-day streak. Come back tomorrow to keep it.` : 'Come back tomorrow to start a streak.'}</p>
      </div>
      <Leaderboard date={today()} />
    </>)}
  </>);
}
