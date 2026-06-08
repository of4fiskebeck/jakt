import { useState } from 'react';
import { signInWithPopup, signInWithRedirect } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { appIcons } from '../icons';

export default function Login() {
  const [error, setError] = useState('');
  async function login() {
    setError('');
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.warn('Popup-login feilet, prøver redirect:', err);
      try {
        await signInWithRedirect(auth, googleProvider);
      } catch (redirectError) {
        console.error('Google-login feilet:', redirectError);
        setError('Google-innlogging feilet. Prøv vanlig nettleservindu eller sjekk autoriserte domener i Firebase.');
      }
    }
  }

  return (
    <div className="login-page">
      <div className="login-card login-card-branded">
        <img className="login-app-icon" src={appIcons.main} alt="Jegerapp" />
        <h1>Jegerapp</h1>
        <p>Logg inn for å registrere jakter, våpen, bilder, felt vilt, dagbok, jegervenner og rewards.</p>
        {error && <p className="notice error">{error}</p>}
        <button onClick={login}>Logg inn med Google</button>
      </div>
    </div>
  );
}
