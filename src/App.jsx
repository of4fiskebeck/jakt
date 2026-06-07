import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import NewHunt from './pages/NewHunt';
import MyHunts from './pages/MyHunts';
import HuntDetail from './pages/HuntDetail';
import Weapons from './pages/Weapons';
import Rewards from './pages/Rewards';
import Navbar from './components/Navbar';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState('dashboard');
  const [selectedHuntId, setSelectedHuntId] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
      if (firebaseUser) {
        await setDoc(
          doc(db, 'users', firebaseUser.uid),
          {
            name: firebaseUser.displayName || '',
            email: firebaseUser.email || '',
            photoURL: firebaseUser.photoURL || '',
            updatedAt: serverTimestamp(),
            createdAt: serverTimestamp()
          },
          { merge: true }
        );
      }
    });
    return unsubscribe;
  }, []);

  if (loading) return <div className="centered">Laster...</div>;
  if (!user) return <Login />;

  const openHunt = (huntId) => {
    setSelectedHuntId(huntId);
    setPage('huntDetail');
  };

  return (
    <div className="app-shell">
      <Navbar user={user} page={page} setPage={setPage} />
      <main className="container">
        {page === 'dashboard' && <Dashboard user={user} setPage={setPage} />}
        {page === 'profile' && <Profile user={user} />}
        {page === 'newHunt' && <NewHunt user={user} setPage={setPage} />}
        {page === 'myHunts' && <MyHunts user={user} openHunt={openHunt} />}
        {page === 'huntDetail' && <HuntDetail user={user} huntId={selectedHuntId} setPage={setPage} />}
        {page === 'weapons' && <Weapons user={user} />}
        {page === 'rewards' && <Rewards user={user} />}
      </main>
    </div>
  );
}
