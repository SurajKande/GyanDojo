'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { loadStars, setStar } from '../../lib/stars';
import QCard from '../../components/QCard';
import Tabs from '../../components/Tabs';

export default function Starred() {
  const [rows, setRows] = useState(null);
  const [stars, setStars] = useState(new Set());

  useEffect(() => {
    supabase.rpc('get_starred').then(({ data }) => setRows(data || []));
    loadStars().then(setStars);
  }, []);

  function star(qid) {
    const on = !stars.has(qid);
    const n = new Set(stars);
    if (on) n.add(qid); else n.delete(qid);
    setStars(n);
    setStar(qid, on);
  }

  return (<>
    <header><h1 className="logo">Starred</h1></header>
    <p className="section">Questions you want to come back to</p>
    {rows && !rows.length && <p>Tap the ☆ on any question to save it here.</p>}
    {(rows || []).map(r => (
      <QCard key={r.question_id} r={r} starred={stars.has(r.question_id)} onStar={star} />
    ))}
    <Tabs />
  </>);
}
