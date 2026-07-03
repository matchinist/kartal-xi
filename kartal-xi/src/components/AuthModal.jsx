import { useState } from 'react';
import { supabase } from '../lib/supabase';
import styles from './AuthModal.module.css';

export default function AuthModal({ onClose, onSuccess }) {
  const [mode, setMode] = useState('login'); // login | signup | forgot
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true); setError('');

    if (mode === 'forgot') {
      const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + window.location.pathname + '#/reset-password',
      });
      if (err) setError(err.message);
      else setForgotSent(true);
      setSaving(false); return;
    }

    if (mode === 'signup') {
      if (!username.trim() || username.trim().length < 3) {
        setError('Kullanıcı adı en az 3 karakter olmalı.'); setSaving(false); return;
      }
      const { data: existing } = await supabase
        .from('user_profiles').select('id').eq('username', username.trim()).limit(1);
      if (existing?.length > 0) {
        setError('Bu kullanıcı adı zaten alınmış.'); setSaving(false); return;
      }
      const { data, error: err } = await supabase.auth.signUp({ email, password });
      if (err) { setError(err.message); setSaving(false); return; }
      if (data.user) {
        await supabase.from('user_profiles').insert([{ id: data.user.id, username: username.trim() }]);
      }
      if (data.session) onSuccess();
      else setDone(true);
      setSaving(false); return;
    }

    // login
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) setError(err.message);
    else onSuccess();
    setSaving(false);
  }

  if (done) return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.title}>E-postanı Kontrol Et</div>
        <p className={styles.text}>Hesabını onaylamak için e-postana bir bağlantı gönderdik.</p>
        <button className={styles.btnGhost} onClick={onClose}>Kapat</button>
      </div>
    </div>
  );

  if (forgotSent) return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.title}>E-posta Gönderildi</div>
        <p className={styles.text}>Şifre sıfırlama bağlantısı <strong>{email}</strong> adresine gönderildi. Gelen kutunu kontrol et.</p>
        <button className={styles.btnGhost} onClick={onClose}>Kapat</button>
      </div>
    </div>
  );

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.title}>
          {mode === 'login' ? 'Giriş Yap' : mode === 'signup' ? 'Üye Ol' : 'Şifremi Unuttum'}
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {mode === 'signup' && (
            <div className={styles.fieldWrap}>
              <label className={styles.label}>Kullanıcı Adı</label>
              <input className={styles.input} type="text" placeholder="mister_ali"
                value={username} onChange={e => setUsername(e.target.value)} required />
            </div>
          )}
          <div className={styles.fieldWrap}>
            <label className={styles.label}>E-posta</label>
            <input className={styles.input} type="email" placeholder="ali@email.com"
              value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          {mode !== 'forgot' && (
            <div className={styles.fieldWrap}>
              <label className={styles.label}>Şifre</label>
              <input className={styles.input} type="password" placeholder="••••••"
                value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
            </div>
          )}
          {error && <div className={styles.error}>{error}</div>}
          <button className={styles.btn} type="submit" disabled={saving}>
            {saving ? '...' : mode === 'login' ? 'Giriş Yap' : mode === 'signup' ? 'Üye Ol' : 'Sıfırlama Bağlantısı Gönder'}
          </button>
        </form>

        <div className={styles.links}>
          {mode === 'login' && (
            <>
              <button className={styles.link} onClick={() => { setMode('signup'); setError(''); }}>
                Hesabın yok mu? Üye ol
              </button>
              <button className={styles.link} onClick={() => { setMode('forgot'); setError(''); }}>
                Şifremi unuttum
              </button>
            </>
          )}
          {mode === 'signup' && (
            <button className={styles.link} onClick={() => { setMode('login'); setError(''); }}>
              Zaten üye misin? Giriş yap
            </button>
          )}
          {mode === 'forgot' && (
            <button className={styles.link} onClick={() => { setMode('login'); setError(''); }}>
              Giriş yap
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
