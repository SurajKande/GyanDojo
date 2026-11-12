'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import { fmt } from '../../lib/fmt';

const TOPICS = ['dsa', 'selenium', 'java', 'playwright', 'manual', 'api', 'sql', 'frameworks', 'performance', 'strategy'];

export default function Review() {
  const [stats, setStats] = useState({});
  const [topic, setTopic] = useState(null);
  const [date, setDate] = useState('');
  const [wrongOnly, setWrongOnly] = useState(true);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    supabase.from('my_topic_stats').select('*')
      .then(({ data }) => setStats(Object.fromEntries((data || []).map(s => [s.topic, s]))));
  }, []);

  useEffect(() => {
    supabase.rpc('get_review', { p_topic: topic, p_date: date || null, p_only_wrong: wrongOnly })
      .then(({ data }) => setRows(data || []));
  }, [topic, date, wrongOnly]);

  return (<>
    <header><h1>Review</h1><nav><Link href="/">Home</Link></nav></header>
    <div className="card">
      <button className={'chip' + (!topic ? ' on' : '')} onClick={() => setTopic(null)}>All</button>
      {TOPICS.map(t => (
        <button key={t} className={'chip' + (topic === t ? ' on' : '')} onClick={() => setTopic(t)}>
          {t}{stats[t] ? ` ${stats[t].wrong}/${stats[t].attempted}` : ''}
        </button>
      ))}
      <input type="date" value={date} onChange={e => setDate(e.target.value)} />
      <button className="chip" onClick={() => setWrongOnly(!wrongOnly)}>{wrongOnly ? 'Showing: wrong only' : 'Showing: all'}</button>
    </div>
    {!rows.length && <p>Nothing here yet. Finish a quiz first.</p>}
    {rows.map(r => (
      <div className="card" key={r.quiz_date + r.question_id}>
        <small>{r.quiz_date} · {r.topic} · level {r.difficulty}</small>
        <p className="q">{r.body.q}</p>
        {r.body.code && <pre>{r.body.code}</pre>}
        <p className={r.is_correct ? 'ok' : 'err'}>Your answer: {fmt(r.type, r.body, r.your_answer)}</p>
        {!r.is_correct && <p className="ok">Correct: {fmt(r.type, r.body, r.correct_answer)}</p>}
        <small>{r.explanation}</small>
      </div>
    ))}
  </>);
}
