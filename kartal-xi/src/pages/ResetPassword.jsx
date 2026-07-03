import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import styles from './ResetPassword.module.css';

function parseHashParams() {
  // URL looks like: lineupmister.cc/#/reset-password#access_token=...
  // or: lineupmister.cc/#access_token=...
  const full = window.location.href;
  const tokenPart = full.includes('access_token') ? full.split('access_token=')[1] : null;
  if (!tokenPart) return null;
  // Reconstruct as query string for URLSearchParams
  const raw = 'access_token=' + tokenPart;
  const params = new URLSearchParams(raw.replace(/&amp;/g, '&'));
  return {
    access_token: params.get('access_token'),
    refresh_token: params.get('refresh_token') || '',
    type: params.get('type'),
  };
}

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function init() {
      const parsed = parseHashParams();

      if (parsed?.access_token && parsed?.type === 'recovery') {
        const { error: err } = await supabase.auth.setSession({
          access_token: parsed.access_token,
          refresh_token: parsed.refresh_token,
        });
        if (err) setError('Bu bağlantı geçersiz veya süresi dolmuş.');
        else setReady(true);
      } else if (parsed?.access_token) {
        // Token present but type not recovery — try anyway
        const { error: err } = await supabase.auth.setSession({
          access_token: parsed.access_token,
          refresh_token: parsed.refresh_token,
        });
        if (err) setError('Bu bağlantı geçersiz veya süresi dolmuş.');
        else setReady(true);
      } else {
        // No token in URL — check if already in recovery session
        const { data: { session } } = await supabase.auth.getSession();
        if (session) setReady(true);
        else setError('Bu bağlantı geçersiz veya tek kullanımlık olup zaten kullanıldı.');
      }
    }
    init();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (password !== confirm) { setError('Şifreler eşleşmiyor.'); return; }
    if (password.length < 6) { setError('Şifre en az 6 karakter olmalı.'); return; }
    setSaving(true); setError('');
    const { error: err } = await supabase.auth.updateUser({ password });
    if (err) { setError(err.message); setSaving(false); }
    else { setMsg('Şifren güncellendi! Yönlendiriliyorsun...'); setTimeout(() => navigate('/'), 2000); }
  }

  if (!ready && !error) return (
    <div className={styles.wrap}>
      <div className={styles.loading}>Bağlantı doğrulanıyor...</div>
    </div>
  );

  if (error && !ready) return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <div className={styles.title}>Bağlantı Geçersiz</div>
        <p className={styles.errorMsg}>{error}</p>
        <p className={styles.errorMsg} style={{opacity:0.6,fontSize:'12px',marginTop:'8px'}}>
          Şifre sıfırlama bağlantıları tek kullanımlıktır. Yeni bir bağlantı almak için tekrar dene.
        </p>
        <button className={styles.btn} onClick={() => navigate('/')}>Ana Sayfaya Dön</button>
      </div>
    </div>
  );

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <div className={styles.title}>Yeni Şifre Belirle</div>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Yeni Şifre</label>
            <input className={styles.input} type="password" placeholder="••••••"
              value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Şifre Tekrar</label>
            <input className={styles.input} type="password" placeholder="••••••"
              value={confirm} onChange={e => setConfirm(e.target.value)} required minLength={6} />
          </div>
          {error && <div className={styles.error}>{error}</div>}
          {msg   && <div className={styles.success}>{msg}</div>}
          <button className={styles.btn} type="submit" disabled={saving}>
            {saving ? 'Kaydediliyor...' : 'Şifremi Güncelle'}
          </button>
        </form>
      </div>
    </div>
  );
}
