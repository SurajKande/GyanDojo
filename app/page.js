'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';
import { today, streakFor } from '../lib/dates';
import Auth from '../components/Auth';
import Tabs from '../components/Tabs';

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState(undefined);
  const [battles, setBattles] = useState(null);
  const [att, setAtt] = useState([]);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const c = new URLSearchParams(window.location.search).get('join');
    if (c) { localStorage.setItem('pendingJoin', c); window.history.replaceState({}, '', '/'); }
  }, []);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const dn = user.user_metadata?.name || user.email.split('@')[0];
      await supabase.from('profiles').upsert({ id: user.id, display_name: dn }, { onConflict: 'id', ignoreDuplicates: true });
      const pj = localStorage.getItem('pendingJoin');
      if (pj) {
        localStorage.removeItem('pendingJoin');
        const j = await supabase.rpc('join_battle', { p_code: pj });
        if (!j.error) { router.push('/battle/' + j.data); return; }
        setMsg(j.error.message);
      }
      const [b, a] = await Promise.all([
        supabase.rpc('my_battles'),
        supabase.from('attempts').select('battle_id,quiz_date,finished_at').not('battle_id', 'is', null),
      ]);
      if (b.error) setMsg(b.error.message);
      setBattles(b.data || []);
      setAtt(a.data || []);
    })();
  }, [user]);

  async function create() {
    setMsg('');
    const { data, error } = await supabase.rpc('create_battle', { p_name: name, p_solo: false });
    if (error) return setMsg(error.message);
    router.push('/battle/' + data);
  }
  async function join() {
    setMsg('');
    const { data, error } = await supabase.rpc('join_battle', { p_code: code });
    if (error) return setMsg(error.message);
    router.push('/battle/' + data);
  }

  if (user === undefined) return <p>Loading…</p>;
  if (!user) return <Auth />;

  return (<>
    <header>
      <h1 className="logo">Gyan<span>Dojo</span></h1>
      <nav><button className="ghost" onClick={() => supabase.auth.signOut()}>Sign out</button></nav>
    </header>

    <p className="section">Your battles</p>
    {battles === null && <p>Loading…</p>}
    {(battles || []).map(b => {
      const mine = att.filter(a => a.battle_id === b.id);
      const s = streakFor(new Set(mine.filter(a => a.finished_at).map(a => a.quiz_date)));
      const t = mine.find(a => a.quiz_date === today());
      return (
        <Link key={b.id} href={'/battle/' + b.id} className="battle">
          <div><b>{b.name}</b><small>{b.is_solo ? 'Just you' : `${b.members} player${b.members === 1 ? '' : 's'}`}</small></div>
          <div className="side">
            <span className="streak">🔥 {s}</span>
            <span className={'status' + (t?.finished_at ? ' done' : '')}>{t?.finished_at ? 'Done today ✓' : t ? 'Resume' : 'Play today'}</span>
          </div>
        </Link>
      );
    })}

    <p className="section">Start a battle with friends</p>
    <div className="card">
      <input placeholder="Battle name, e.g. QA Warriors" value={name} onChange={e => setName(e.target.value)} />
      <button className="primary" disabled={name.trim().length < 2} onClick={create}>Create battle</button>
    </div>
    <div className="card">
      <input placeholder="Have an invite code?" value={code} onChange={e => setCode(e.target.value)} />
      <button className="primary alt" disabled={code.trim().length < 4} onClick={join}>Join battle</button>
    </div>
    {msg && <p className="err">{msg}</p>}
    <Tabs />
  </>);
}
