import { supabase } from './supabase';

export async function loadStars() {
  const { data } = await supabase.from('bookmarks').select('question_id');
  return new Set((data || []).map(x => x.question_id));
}

export async function setStar(qid, on) {
  if (on) {
    const { data } = await supabase.auth.getUser();
    await supabase.from('bookmarks').insert({ user_id: data.user.id, question_id: qid });
  } else {
    await supabase.from('bookmarks').delete().eq('question_id', qid);
  }
}
