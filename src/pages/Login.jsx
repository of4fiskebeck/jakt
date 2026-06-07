import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

export default function Login() {
  return (
    <div className="login-page">
      <div className="login-card">
        <div className="logo-mark">🦌</div>
        <h1>JaktApp</h1>
        <p>Logg inn for å registrere jakter, våpen, bilder, dagbok og rewards.</p>
        <button onClick={() => signInWithPopup(auth, googleProvider)}>Logg inn med Google</button>
      </div>
    </div>
  );
}
