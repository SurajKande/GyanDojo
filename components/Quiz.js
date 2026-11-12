'use client';
import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Quiz({ date, onDone }) {
  const [qs, setQs] = useState([]);
  const [i, setI] = useState(0);
  const [ans, setAns] = useState({});
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const spent = useRef({});
  const t0 = useRef(Date.now());

  useEffect(() => {
    (async () => {
      const { data: quiz } = await supabase.from('daily_quizzes').select('question_ids').eq('quiz_date', date).single();
      const { data } = await supabase.from('questions').select('id,type,difficulty,topic,body').in('id', quiz.question_ids);
      const byId = Object.fromEntries(data.map(q => [q.id, q]));
      setQs(quiz.question_ids.map(id => byId[id]).filter(Boolean));
      t0.current = Date.now();
    })();
  }, [date]);

  if (!qs.length) return <p>Loading questions…</p>;
  const q = qs[i];
  const last = i === qs.length - 1;
  const lap = () => { spent.current[q.id] = Date.now() - t0.current; t0.current = Date.now(); };

  async function submit() {
    lap();
    setBusy(true);
    const payload = qs.map(x => ({ q: x.id, a: ans[x.id] ?? null, ms: spent.current[x.id] ?? 99999 }));
    const { data, error } = await supabase.rpc('submit_quiz', { p_date: date, p_answers: payload });
    if (error) { setErr(error.message); setBusy(false); return; }
    onDone(data);
  }

  return (
    <div className="card">
      <small>{i + 1} / {qs.length} · {q.topic} · level {q.difficulty}</small>
      <p className="q">{q.body.q}</p>
      <Answer q={q} value={ans[q.id]} onChange={v => setAns({ ...ans, [q.id]: v })} />
      {err && <p className="err">{err}</p>}
      {last
        ? <button disabled={busy} onClick={submit}>Finish</button>
        : <button onClick={() => { lap(); setI(i + 1); }}>Next</button>}
    </div>
  );
}

function Answer({ q, value, onChange }) {
  const { type, body } = q;

  if (type === 'single' || type === 'scenario')
    return body.options.map((o, k) => (
      <button key={k} className={'opt' + (value === k ? ' on' : '')} onClick={() => onChange(k)}>{o}</button>
    ));

  if (type === 'multi') {
    const sel = value || [];
    const flip = k => onChange(sel.includes(k) ? sel.filter(x => x !== k) : [...sel, k].sort((a, b) => a - b));
    return (<>
      {body.options.map((o, k) => (
        <button key={k} className={'opt' + (sel.includes(k) ? ' on' : '')} onClick={() => flip(k)}>{o}</button>
      ))}
      <small>Select all that apply</small>
    </>);
  }

  if (type === 'fill')
    return <input placeholder="Your answer" value={value || ''} onChange={e => onChange(e.target.value)} />;

  if (type === 'code_fill') {
    const parts = body.code.split('___');
    const sel = value || Array(parts.length - 1).fill(null);
    const put = t => { const k = sel.indexOf(null); if (k >= 0) { const n = [...sel]; n[k] = t; onChange(n); } };
    const clear = k => { const n = [...sel]; n[k] = null; onChange(n); };
    return (<>
      <pre>{parts.map((p, k) => (
        <span key={k}>{p}{k < sel.length && <button className="blank" onClick={() => clear(k)}>{sel[k] || '____'}</button>}</span>
      ))}</pre>
      <div>{body.tokens.map(t => (
        <button key={t} className="chip" disabled={sel.includes(t)} onClick={() => put(t)}>{t}</button>
      ))}</div>
    </>);
  }

  if (type === 'arrange') {
    const seq = value || [];
    const tap = k => onChange(seq.includes(k) ? seq.filter(x => x !== k) : [...seq, k]);
    return (<>
      {body.lines.map((l, k) => (
        <button key={k} className={'opt' + (seq.includes(k) ? ' on' : '')} onClick={() => tap(k)}>
          {seq.includes(k) ? (seq.indexOf(k) + 1) + '. ' : ''}{l}
        </button>
      ))}
      <small>Tap in the correct order. Tap again to undo.</small>
    </>);
  }
  return null;
}
