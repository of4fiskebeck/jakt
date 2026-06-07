import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export default function Dashboard({ user, setPage }) {
  const [huntCount, setHuntCount] = useState(0);
  const [weaponCount, setWeaponCount] = useState(0);

  useEffect(() => {
    const unsubHunts = onSnapshot(collection(db, 'users', user.uid, 'hunts'), (snap) => setHuntCount(snap.size));
    const unsubWeapons = onSnapshot(collection(db, 'users', user.uid, 'weapons'), (snap) => setWeaponCount(snap.size));
    return () => {
      unsubHunts();
      unsubWeapons();
    };
  }, [user.uid]);

  return (
    <div>
      <section className="hero">
        <div>
          <h1>Velkommen, {user.displayName}</h1>
          <p>Din digitale jaktlogg for turer, våpen, bilder og minner.</p>
        </div>
        <button onClick={() => setPage('newHunt')}>+ Ny jakt</button>
      </section>
      <div className="grid three">
        <div className="stat-card"><span>{huntCount}</span><p>Jakter registrert</p></div>
        <div className="stat-card"><span>{weaponCount}</span><p>Våpen i jaktgarderoben</p></div>
        <div className="stat-card"><span>{huntCount + weaponCount}</span><p>Aktivitetspoeng</p></div>
      </div>
      <section className="card">
        <h2>Kom raskt i gang</h2>
        <div className="action-row">
          <button onClick={() => setPage('newHunt')}>Registrer ny jakt</button>
          <button className="secondary" onClick={() => setPage('weapons')}>Legg til våpen</button>
          <button className="secondary" onClick={() => setPage('rewards')}>Se rewards</button>
        </div>
      </section>
    </div>
  );
}
