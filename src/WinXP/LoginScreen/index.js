import React, { useState } from 'react';
import userAvatar from 'assets/windowsIcons/853(32x32).png';
import { useAppState } from 'state/AppStateContext';

function Field({ label, type, value, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
      <div style={{ width: 100, color: '#003399' }}>{label}</div>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ width: 220 }}
      />
    </div>
  );
}

function LoginModal({ onClose }) {
  const { supabase, dispatch, ACTIONS } = useAppState();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  async function onLogin() {
    setMessage('');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return setMessage(error.message);
    dispatch({ type: ACTIONS.SET_SESSION, payload: { session: data.session, user: data.user } });
  }
  async function onRegister() {
    setMessage('');
    if (!email || !password) {
      return setMessage('Ingresa email y contraseña');
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {},
    });
    if (error) return setMessage(error.message);
    dispatch({ type: ACTIONS.SET_SESSION, payload: { session: data.session, user: data.user } });
  }

  return (
    <div
      style={{
        width: 460,
        background: '#ece9d8',
        border: '2px solid #003399',
        boxShadow: '0 8px 24px rgba(0,0,0,0.35), 0 0 0 2px #7ba7ff inset',
        position: 'relative',
        borderRadius: 4,
      }}
    >
      <div
        style={{
          background: 'linear-gradient(180deg,#0a246a,#124a98)',
          color: 'white',
          padding: '10px 12px',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTopLeftRadius: 2,
          borderTopRightRadius: 2,
        }}
      >
        <span>Iniciar sesión en Windows XP</span>
        <button onClick={onClose} style={{ background: 'transparent', color: '#fff', border: 0, fontSize: 16, cursor: 'pointer' }}>✕</button>
      </div>
      <div style={{ padding: 14 }}>
        <div style={{ marginBottom: 10 }}>
          <button
            onClick={() => setMode('login')}
            style={{
              background: mode === 'login' ? 'linear-gradient(#e6f0ff,#cfe0ff)' : 'linear-gradient(#fff,#eee)',
              border: '1px solid #7aa2e8',
              padding: '6px 10px',
              marginRight: 6,
              cursor: 'pointer',
            }}
          >
            Iniciar sesión
          </button>
          <button
            onClick={() => setMode('register')}
            style={{
              background: mode === 'register' ? 'linear-gradient(#e6f0ff,#cfe0ff)' : 'linear-gradient(#fff,#eee)',
              border: '1px solid #7aa2e8',
              padding: '6px 10px',
              cursor: 'pointer',
            }}
          >
            Registrarse
          </button>
        </div>
        {mode === 'login' && (
          <div>
            <Field label="Email" type="email" value={email} onChange={setEmail} />
            <Field label="Contraseña" type="password" value={password} onChange={setPassword} />
            <div>
              <button
                onClick={onLogin}
                style={{
                  background: 'linear-gradient(#e6f0ff,#cfe0ff)',
                  border: '1px solid #7aa2e8',
                  padding: '6px 12px',
                  cursor: 'pointer',
                }}
              >
                Entrar
              </button>
            </div>
          </div>
        )}
        {mode === 'register' && (
          <div>
            <Field label="Email" type="email" value={email} onChange={setEmail} />
            <Field label="Contraseña" type="password" value={password} onChange={setPassword} />
            <div>
              <button
                onClick={onRegister}
                style={{
                  background: 'linear-gradient(#e6f0ff,#cfe0ff)',
                  border: '1px solid #7aa2e8',
                  padding: '6px 12px',
                  cursor: 'pointer',
                }}
              >
                Crear cuenta
              </button>
            </div>
          </div>
        )}
        {message && <div style={{ color: '#c00', marginTop: 8 }}>{message}</div>}
      </div>
    </div>
  );
}

function LoginScreen() {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#0b2f7d' }}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: '50%',
          height: '55%',
          background:
            'radial-gradient(circle at 25% 35%, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.15) 20%, rgba(255,255,255,0.08) 35%, rgba(255,255,255,0.03) 50%, rgba(255,255,255,0) 70%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 64,
          width: '52%',
          background:
            'linear-gradient(180deg, #5f86d1 0%, #5a80cc 35%, #5175c3 70%, #476ab8 100%)',
          boxShadow: 'inset 1px 0 0 rgba(255,255,255,0.25), inset 0 1px 0 rgba(255,255,255,0.2)',
        }}
      />
      <div
        style={{ position: 'absolute', left: '50%', top: 0, bottom: 64, width: 1, background: 'rgba(255,255,255,0.25)' }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(circle at 20% 35%, #2b63c0 0%, #204eaa 35%, #173f98 60%, #0f3288 80%, #0a2a79 100%)',
          opacity: 0.9,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 64,
          background: 'linear-gradient(180deg, #1c3f8a 0%, #153579 60%, #0e2c69 100%)',
          borderTop: '1px solid rgba(255,255,255,0.35)',
          boxShadow: '0 -1px 0 rgba(0,0,0,0.25) inset',
        }}
      />
      <div style={{ position: 'absolute', left: 46, top: 86, color: 'white' }}>
        <div style={{ fontSize: 46, fontWeight: 'bold', letterSpacing: 0.5 }}>
          Windows <span style={{ color: '#ff7a00' }}>XP</span>
        </div>
        <div style={{ marginTop: 22, fontSize: 18, textShadow: '1px 1px 2px #000' }}>
          To begin, click your user name
        </div>
      </div>

      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen(true)}
        onKeyDown={e => (e.key === 'Enter' ? setOpen(true) : null)}
        style={{
          position: 'absolute',
          left: '57%',
          top: '44%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
          color: 'white',
        }}
      >
        <div
          style={{
            width: 96,
            height: 96,
            background: '#1a9bd7',
            border: '3px solid #7fb3e7',
            boxShadow: '0 0 0 4px #0a2b6a',
            marginRight: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        />
        <img alt="avatar" src={userAvatar} style={{ position: 'absolute', width: 40, height: 40, left: 'calc(57% - 20px)', top: 'calc(44% - 20px)' }} />
        <div style={{ fontSize: 22, textShadow: '1px 1px 2px #000', marginLeft: 6 }}>User</div>
      </div>

      <div style={{ position: 'absolute', left: 16, bottom: 12, color: '#fff' }}>
        <span style={{ background: '#c0392b', padding: '6px 10px', borderRadius: 4, boxShadow: '0 0 0 2px rgba(255,255,255,0.25) inset' }}>Turn off computer</span>
      </div>

      <div style={{ position: 'absolute', right: 24, bottom: 10, color: 'rgba(255,255,255,0.9)', fontSize: 12 }}>
        After you log on, you can add or change accounts.<br />
        Just go to Control Panel and click User Accounts.
      </div>

      {open && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <LoginModal onClose={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}

export default LoginScreen;


