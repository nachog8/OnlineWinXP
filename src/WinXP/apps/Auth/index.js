import React, { useState } from 'react';
import { useAppState } from 'state/AppStateContext';

function Field({ label, type = 'text', value, onChange }) {
  return (
    <div style={{ display: 'flex', marginBottom: 8 }}>
      <div style={{ width: 120 }}>{label}</div>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} />
    </div>
  );
}

function AuthApp() {
  const { supabase, state, dispatch, ACTIONS } = useAppState();
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [role, setRole] = useState('Vendedor');
  const [message, setMessage] = useState('');

  async function onLogin() {
    setMessage('');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return setMessage(error.message);
    dispatch({ type: ACTIONS.SET_SESSION, payload: { session: data.session, user: data.user } });
    setMessage('Sesión iniciada');
  }
  async function onRegister() {
    setMessage('');
    if (!name || !email || !password || password !== confirm) {
      return setMessage('Valida los datos (password debe coincidir)');
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, role } },
    });
    if (error) return setMessage(error.message);
    dispatch({ type: ACTIONS.SET_SESSION, payload: { session: data.session, user: data.user } });
    setMessage('Registro exitoso');
  }
  async function onLogout() {
    await supabase.auth.signOut();
    dispatch({ type: ACTIONS.SET_SESSION, payload: { session: null, user: null } });
    setMessage('Sesión cerrada');
  }
  async function onRecover() {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) setMessage(error.message);
    else setMessage('Si el correo existe, se envió un enlace (simulado)');
  }
  async function onUpdateProfile() {
    const { data, error } = await supabase.auth.updateUser({ name, role });
    if (error) return setMessage(error.message);
    dispatch({ type: ACTIONS.SET_USER, payload: data.user });
    setMessage('Perfil actualizado');
  }

  const isLogged = !!state.user;

  return (
    <div style={{ padding: 12 }}>
      <div style={{ marginBottom: 12 }}>
        <button onClick={() => setMode('login')}>Login</button>{' '}
        <button onClick={() => setMode('register')}>Registro</button>{' '}
        <button onClick={() => setMode('recover')}>Recuperar</button>{' '}
        <button onClick={() => setMode('profile')} disabled={!isLogged}>
          Perfil
        </button>
      </div>

      {mode === 'login' && (
        <div>
          <Field label="Email" value={email} onChange={setEmail} />
          <Field label="Contraseña" type="password" value={password} onChange={setPassword} />
          <button onClick={onLogin}>Entrar</button>
        </div>
      )}
      {mode === 'register' && (
        <div>
          <Field label="Nombre" value={name} onChange={setName} />
          <Field label="Email" value={email} onChange={setEmail} />
          <Field label="Contraseña" type="password" value={password} onChange={setPassword} />
          <Field label="Confirmación" type="password" value={confirm} onChange={setConfirm} />
          <div style={{ display: 'flex', marginBottom: 8 }}>
            <div style={{ width: 120 }}>Rol</div>
            <select value={role} onChange={e => setRole(e.target.value)}>
              <option>Vendedor</option>
              <option>Administrador</option>
            </select>
          </div>
          <button onClick={onRegister}>Crear cuenta</button>
        </div>
      )}
      {mode === 'recover' && (
        <div>
          <Field label="Email" value={email} onChange={setEmail} />
          <button onClick={onRecover}>Enviar enlace</button>
        </div>
      )}
      {mode === 'profile' && isLogged && (
        <div>
          <Field label="Nombre" value={name || state.user.name || ''} onChange={setName} />
          <div style={{ display: 'flex', marginBottom: 8 }}>
            <div style={{ width: 120 }}>Rol</div>
            <select value={role || state.user.role} onChange={e => setRole(e.target.value)}>
              <option>Vendedor</option>
              <option>Administrador</option>
            </select>
          </div>
          <button onClick={onUpdateProfile}>Guardar</button>{' '}
          <button onClick={onLogout}>Salir</button>
        </div>
      )}

      {message && <div style={{ marginTop: 12, color: '#003399' }}>{message}</div>}
    </div>
  );
}

export default AuthApp;


