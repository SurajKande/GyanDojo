'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { today, streakFor } from '../../../lib/dates';
import Quiz from '../../../components/Quiz';

const medal = k => ['🥇', '🥈', '🥉'][k] || k + 1;

export default function Battle() {
  const { id } = useParams();
  const [b, setB] = useState(null);
  const [board, setBoard] = useState([]);
  const [state, setState] = useState('loading'); // loading | ready | playing | done | error
  const [resume, setResume] = useState(false);
  const [score, setScore] = useState(null);
  const [streak, setStreak] = useState(0);
  const [tab, setTab] = useState('today');
  const [copied, setCopied] = useState(false);
  const [msg, setMsg] = useState('');

  async function refresh() {
    const { data: bd } = await supabase.rpc('battle_board', { p_battle: id, p_date: today() });
    setBoard(bd || []);
    const { data: a } = await supabase.from('attempts').select('quiz_date,score,finished_at').eq('battle_id', id);
    setStreak(streakFor(new Set((a || []).filter(x => x.finished_at).map(x => x.quiz_date))));
    return (a || []).find(x => x.quiz_date === today());
  }

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('battles').select('id,name,code,is_solo').eq('id', id).maybeSingle();
      if (!data) { setMsg('Battle not found. Sign in first, or ask for an invite code.'); setState('error'); return; }
      setB(data);
      const { error } = await supabase.rpc('build_battle_quiz', { p_battle: id, p_date: today() });
      const t = await refresh();
      if (error) { setMsg(error.message); setState('error'); return; }
      if (t?.finished_at) { setScore(t.score); setState('done'); } else { setResume(!!t); setState('ready'); }
    })();
  }, [id]);

  if (state === 'playing')
    return <Quiz battle={id} date={today()} onExit={() => { setResume(true); setState('ready'); refresh(); }}
      onDone={async s => { setScore(s); setState('done'); await refresh(); }} />;

  const rows = [...board].sort((x, y) => tab === 'today'
    ? y.today_score - x.today_score : Number(y.total_score) - Number(x.total_score));

  return (<>
    <header>
      <Link href="/">← Battles</Link>
      <span className="streak">🔥 {streak}</span>
    </header>
    <h1 className="title">{b?.name || '…'}</h1>

    {state === 'ready' && (
      <div className="card">
        <small>Today’s quiz</small>
        <p>20 questions, easy to hard. Answers lock as you go.</p>
        <button className="primary" onClick={() => setState('playing')}>{resume ? 'Resume quiz' : 'Start today’s quiz'}</button>
      </div>
    )}
    {state === 'done' && (
      <div className="card"><small>Your score today</small><p className="big">{score}</p><p>Come back tomorrow to keep your streak.</p></div>
    )}
    {state === 'error' && <div className="card"><p className="err">{msg}</p></div>}

    <div className="tabs">
      <button className={'chip' + (tab === 'today' ? ' on' : '')} onClick={() => setTab('today')}>Today</button>
      <button className={'chip' + (tab === 'all' ? ' on' : '')} onClick={() => setTab('all')}>All time</button>
    </div>
    <div className="card">
      <ol>{rows.map((r, k) => (
        <li key={r.user_id}><b>{medal(k)}</b>{r.display_name}
          <span>{tab === 'today' ? (r.today_done ? r.today_score + ' ✓' : r.today_score > 0 ? r.today_score + ' …' : '—') : r.total_score}</span></li>
      ))}</ol>
    </div>

    {b && !b.is_solo && (
      <div className="card">
        <small>Invite friends with this code</small>
        <div className="row"><span className="code">{b.code}</span>
          <button className="chip" onClick={() => { navigator.clipboard?.writeText(b.code); setCopied(true); }}>{copied ? 'Copied ✓' : 'Copy'}</button></div>
      </div>
    )}
  </>);
}
