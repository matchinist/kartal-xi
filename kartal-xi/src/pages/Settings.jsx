import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import styles from './Settings.module.css';

export default function Settings() {
  const [session, setSession] = useState(null);
  const [username, setUsername] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) loadProfile(session.user.id);
      else setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (s) loadProfile(s.user.id);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function loadProfile(userId) {
    setLoading(true);
    const { data } = await supabase.from('user_profiles').select('username').eq('id', userId).limit(1);
    if (data?.[0]) { setUsername(data[0].username); setNewUsername(data[0].username); }
    setLoading(false);
  }

  async function handleSave(e) {
    e.preventDefault();
    const trimmed = newUsername.trim();
    if (!trimmed || trimmed.length < 3) { setMsg('En az 3 karakter olmalı.'); return; }
    setSaving(true); setMsg('');
    if (trimmed !== username) {
      const { data: existing } = await supabase.from('user_profiles').select('id').eq('username', trimmed).limit(1);
      if (existing?.length > 0) { setMsg('Bu kullanıcı adı zaten alınmış.'); setSaving(false); return; }
    }
    const { error } = await supabase.from('user_profiles')
      .upsert({ id: session.user.id, username: trimmed }, { onConflict: 'id' });
    if (error) setMsg('Hata: ' + error.message);
    else { setMsg('Kaydedildi!'); setUsername(trimmed); }
    setSaving(false);
  }

  if (loading) return <div className={styles.loading}>Yükleniyor...</div>;

  if (!session) return (
    <div className={styles.wrap}>
      <div className={styles.empty}>Ayarlara erişmek için giriş yapın.</div>
    </div>
  );

  return (
    <div className={styles.wrap}>
      <div className={styles.title}>Ayarlar</div>

      <div className={styles.card}>
        <div className={styles.cardTitle}>Profil</div>
        <form onSubmit={handleSave} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Kullanıcı Adı</label>
            <input
              className={styles.input}
              value={newUsername}
              onChange={e => { setNewUsername(e.target.value); setMsg(''); }}
              placeholder="kullanici_adi"
              minLength={3}
              required
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>E-posta</label>
            <input className={`${styles.input} ${styles.inputDisabled}`} value={session.user.email} disabled />
          </div>
          {msg && <div className={msg.startsWith('Hata') || msg.includes('alınmış') || msg.includes('karakter') ? styles.error : styles.success}>{msg}</div>}
          <button className={styles.btn} type="submit" disabled={saving || newUsername.trim() === username}>
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </form>
      </div>

      <div className={styles.card}>
        <div className={styles.cardTitle}>Hesap</div>
        <button className={styles.btnLogout} onClick={() => supabase.auth.signOut()}>Çıkış Yap</button>
      </div>
    </div>
  );
}
