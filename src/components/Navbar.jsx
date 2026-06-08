import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { appIcons, navItems } from '../icons';

export default function Navbar({ user, page, setPage }) {
  return (
    <header className="navbar">
      <div className="brand" onClick={() => setPage('dashboard')}>
        <img src={appIcons.main} alt="Jegerapp" />
        <span>Jegerapp</span>
      </div>
      <nav>
        {navItems.map((item) => (
          <button
            key={item.id}
            className={page === item.id ? 'active nav-icon-button' : 'nav-icon-button'}
            onClick={() => setPage(item.id)}
          >
            <img src={item.icon} alt="" />
            <span>{item.label}</span>
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
