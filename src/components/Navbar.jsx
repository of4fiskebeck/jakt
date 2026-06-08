import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

const navItems = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'newHunt', label: 'Ny jakt' },
  { id: 'myHunts', label: 'Mine jakter' },
  { id: 'harvests', label: 'Felte dyr' },
  { id: 'friends', label: 'Jegervenner' },
  { id: 'weapons', label: 'Jaktgarderobe' },
  { id: 'rewards', label: 'Rewards' },
  { id: 'profile', label: 'Profil' }
];

export default function Navbar({ user, page, setPage }) {
  return (
    <header className="navbar">
      <div className="brand" onClick={() => setPage('dashboard')}>Jegerapp</div>
      <nav>
        {navItems.map((item) => (
          <button
            key={item.id}
            className={page === item.id ? 'active' : ''}
            onClick={() => setPage(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <div className="user-chip">
        {user.photoURL && <img src={user.photoURL} alt="Profil" />}
        <span>{user.displayName}</span>
        <button className="secondary" onClick={() => signOut(auth)}>Logg ut</button>
      </div>
    </header>
  );
}
