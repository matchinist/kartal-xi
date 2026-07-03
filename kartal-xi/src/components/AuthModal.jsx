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
        setError('Username must be at least 3 characters.'); setSaving(false); return;
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
        <div className={styles.title}>Check Your Email</div>
        <p className={styles.text}>We've sent a link to your email to confirm your account.</p>
        <button className={styles.btnGhost} onClick={onClose}>Close</button>
      </div>
    </div>
  );

  if (forgotSent) return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.title}>Email Sent</div>
        <p className={styles.text}>A password reset link has been sent to <strong>{email}</strong> . Check your inbox.</p>
        <button className={styles.btnGhost} onClick={onClose}>Close</button>
      </div>
    </div>
  );

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.title}>
          {mode === 'login' ? 'Login' : mode === 'signup' ? 'Sign Up' : 'Forgot Password'}
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {mode === 'signup' && (
            <div className={styles.fieldWrap}>
              <label className={styles.label}>Username</label>
              <input className={styles.input} type="text" placeholder="mister_ali"
                value={username} onChange={e => setUsername(e.target.value)} required />
            </div>
          )}
          <div className={styles.fieldWrap}>
            <label className={styles.label}>Email</label>
            <input className={styles.input} type="email" placeholder="ali@email.com"
              value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          {mode !== 'forgot' && (
            <div className={styles.fieldWrap}>
              <label className={styles.label}>Password</label>
              <input className={styles.input} type="password" placeholder="••••••"
                value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
            </div>
          )}
          {error && <div className={styles.error}>{error}</div>}
          <button className={styles.btn} type="submit" disabled={saving}>
            {saving ? '...' : mode === 'login' ? 'Login' : mode === 'signup' ? 'Sign Up' : 'Send Reset Link'}
          </button>
        </form>

        <div className={styles.links}>
          {mode === 'login' && (
            <>
              <button className={styles.link} onClick={() => { setMode('signup'); setError(''); }}>
                No account? Sign up
              </button>
              <button className={styles.link} onClick={() => { setMode('forgot'); setError(''); }}>
                Forgot password
              </button>
            </>
          )}
          {mode === 'signup' && (
            <button className={styles.link} onClick={() => { setMode('login'); setError(''); }}>
              Already have an account? Login
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
