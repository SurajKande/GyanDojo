'use client';
import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { fmt } from '../lib/fmt';

export default function Quiz({ date, onDone }) {
  const [qs, setQs] = useState([]);
  const [i, setI] = useState(0);
  const [val, setVal] = useState(undefined);
  const [fb, setFb] = useState(null);
  const [score, setScore] = useState(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const t0 = useRef(Date.now());

  useEffect(() => {
    (async () => {
      const { data: quiz } = await supabase.from('daily_quizzes').select('question_ids').eq('quiz_date', date).single();
      const { data } = await supabase.from('questions').select('id,type,difficulty,topic,body').in('id', quiz.question_ids);
      const { data: att } = await supabase.from('attempts').select('id,score').eq('quiz_date', date).maybeSingle();
      let done = [];
      if (att) {
        const { data: a } = await supabase.from('attempt_answers').select('question_id').eq('attempt_id', att.id);
        done = (a || []).map(x => x.question_id);
        setScore(att.score);
      }
      const byId = Object.fromEntries(data.map(q => [q.id, q]));
      const list = quiz.question_ids.map(id => byId[id]).filter(Boolean);
      setQs(list);
      setI(Math.max(0, list.findIndex(q => !done.includes(q.id)))); // resume where you left off
      t0.current = Date.now();
    })();
  }, [date]);

  if (!qs.length) return <p>Loading questions…</p>;
  const q = qs[i];
  const last = i === qs.length - 1;
  const filled = val !== undefined && val !== '' && !(Array.isArray(val) && (val.length === 0 || val.includes(null)));

  async function check() {
    setBusy(true); setErr('');
    const { data, error } = await supabase.rpc('answer_question',
      { p_date: date, p_qid: q.id, p_answer: val ?? null, p_ms: Date.now() - t0.current });
    setBusy(false);
    if (error) return setErr(error.message);
    setFb(data);
    if (!data.locked) setScore(s => s + data.points);
    if (data.correct && navigator.vibrate) navigator.vibrate(30);
  }

  function next() {
    if (last) return onDone(score);
    setI(i + 1); setVal(undefined); setFb(null); t0.current = Date.now();
  }

  return (
    <div>
      <div className="bar"><i style={{ width: `${((i + (fb ? 1 : 0)) / qs.length) * 100}%` }} /></div>
      <div className="card">
        <div className="meta"><span className="pill">{q.topic}</span><span>Level {q.difficulty}</span><span>{i + 1} / {qs.length}</span></div>
        <p className="q">{q.body.q}</p>
        <Answer q={q} value={val} onChange={setVal} fb={fb} />
      </div>
      {fb && (
        <div className={'fb ' + (fb.correct ? 'good' : 'bad')}>
          <b>{fb.correct ? `Correct! +${fb.points}` : 'Not quite'}</b>
          {!fb.correct && <p>Answer: {fmt(q.type, q.body, fb.answer)}</p>}
          <p>{fb.explanation}</p>
        </div>
      )}
      {err && <p className="err">{err}</p>}
      <button className="primary" disabled={busy || (!fb && !filled)} onClick={fb ? next : check}>
        {fb ? (last ? 'See results' : 'Continue') : 'Check'}
      </button>
    </div>
  );
}

function Answer({ q, value, onChange, fb }) {
  const { type, body } = q;
  const lock = !!fb;
  // after checking: right option green, your wrong pick red
  const mark = (k, picked) => {
    if (!fb) return picked ? ' on' : '';
    const right = Array.isArray(fb.answer) ? fb.answer.includes(k) : fb.answer === k;
    return right ? ' right' : picked ? ' wrong' : '';
  };

  if (type === 'single' || type === 'scenario')
    return body.options.map((o, k) => (
      <button key={k} disabled={lock} className={'opt' + mark(k, value === k)} onClick={() => onChange(k)}>{o}</button>
    ));

  if (type === 'multi') {
    const sel = value || [];
    const flip = k => onChange(sel.includes(k) ? sel.filter(x => x !== k) : [...sel, k].sort((a, b) => a - b));
    return (<>
      {body.options.map((o, k) => (
        <button key={k} disabled={lock} className={'opt' + mark(k, sel.includes(k))} onClick={() => flip(k)}>{o}</button>
      ))}
      <small>Select all that apply</small>
    </>);
  }

  if (type === 'fill')
    return <input disabled={lock} placeholder="Type your answer" value={value || ''} onChange={e => onChange(e.target.value)} />;

  if (type === 'code_fill') {
    const parts = body.code.split('___');
    const sel = value || Array(parts.length - 1).fill(null);
    const put = t => { const k = sel.indexOf(null); if (k >= 0) { const n = [...sel]; n[k] = t; onChange(n); } };
    const clear = k => { const n = [...sel]; n[k] = null; onChange(n); };
    return (<>
      <pre>{parts.map((p, k) => (
        <span key={k}>{p}{k < sel.length && <button disabled={lock} className="blank" onClick={() => clear(k)}>{sel[k] || '____'}</button>}</span>
      ))}</pre>
      <div>{body.tokens.map(t => (
        <button key={t} className="chip" disabled={lock || sel.includes(t)} onClick={() => put(t)}>{t}</button>
      ))}</div>
    </>);
  }

  if (type === 'arrange') {
    const seq = value || [];
    const tap = k => onChange(seq.includes(k) ? seq.filter(x => x !== k) : [...seq, k]);
    return (<>
      {body.lines.map((l, k) => (
        <button key={k} disabled={lock} className={'opt' + (seq.includes(k) ? ' on' : '')} onClick={() => tap(k)}>
          {seq.includes(k) ? (seq.indexOf(k) + 1) + '. ' : ''}{l}
        </button>
      ))}
      <small>Tap in the correct order. Tap again to undo.</small>
    </>);
  }
  return null;
}
