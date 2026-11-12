'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Leaderboard({ date }) {
  const [daily, setDaily] = useState([]);
  const [all, setAll] = useState([]);

  useEffect(() => {
    supabase.from('leaderboard_daily').select('display_name,score').eq('quiz_date', date)
      .order('score', { ascending: false }).then(r => setDaily(r.data || []));
    supabase.from('leaderboard_alltime').select('display_name,total_score')
      .order('total_score', { ascending: false }).then(r => setAll(r.data || []));
  }, [date]);

  const list = (rows, key) => rows.map((r, k) => <li key={k}>{r.display_name} <span>{r[key]}</span></li>);

  return (
    <>
      <div className="card"><h3>Today</h3><ol>{list(daily, 'score')}</ol></div>
      <div className="card"><h3>All time</h3><ol>{list(all, 'total_score')}</ol></div>
    </>
  );
}
