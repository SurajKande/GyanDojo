'use client';
import { fmt } from '../lib/fmt';

export default function QCard({ r, starred, onStar }) {
  const answered = r.correct_answer !== null && r.correct_answer !== undefined;
  return (
    <div className="card">
      <div className="meta">
        <span className="pill">{r.topic}</span>
        <span className={'belt b' + r.difficulty}>Lv {r.difficulty}</span>
        <span className="count">{r.quiz_date || ''}</span>
        <button className="star" aria-label="Star question" onClick={() => onStar(r.question_id)}>{starred ? '★' : '☆'}</button>
      </div>
      <p className="q">{r.body.q}</p>
      {r.body.code && <pre>{r.body.code}</pre>}
      {answered ? (<>
        <p className={r.is_correct ? 'ok' : 'err'}>Your answer: {fmt(r.type, r.body, r.your_answer)}</p>
        {!r.is_correct && <p className="ok">Correct: {fmt(r.type, r.body, r.correct_answer)}</p>}
        <small>{r.explanation}</small>
      </>) : <small>Answer this in a quiz to unlock the solution.</small>}
    </div>
  );
}
