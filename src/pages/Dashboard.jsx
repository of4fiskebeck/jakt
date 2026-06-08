import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export default function Dashboard({ user, setPage }) {
  const [huntCount, setHuntCount] = useState(0);
  const [weaponCount, setWeaponCount] = useState(0);
  const [harvestCount, setHarvestCount] = useState(0);
  const [friendCount, setFriendCount] = useState(0);

  useEffect(() => {
    const unsubHunts = onSnapshot(collection(db, 'users', user.uid, 'hunts'), (snap) => setHuntCount(snap.size));
    const unsubWeapons = onSnapshot(collection(db, 'users', user.uid, 'weapons'), (snap) => setWeaponCount(snap.size));
    const unsubHarvests = onSnapshot(collection(db, 'users', user.uid, 'harvests'), (snap) => setHarvestCount(snap.size));
    const unsubFriends = onSnapshot(collection(db, 'users', user.uid, 'friends'), (snap) => setFriendCount(snap.size));
    return () => { unsubHunts(); unsubWeapons(); unsubHarvests(); unsubFriends(); };
  }, [user.uid]);

  return (
    <div>
      <section className="hero">
        <div>
          <h1>Velkommen, {user.displayName}</h1>
          <p>Jegerapp samler jakter, tid i felt, våpen, bilder, felte dyr og jegervenner.</p>
        </div>
        <button onClick={() => setPage('newHunt')}>+ Ny jakt</button>
      </section>
      <div className="grid four">
        <div className="stat-card"><span>{huntCount}</span><p>Jakter</p></div>
        <div className="stat-card"><span>{harvestCount}</span><p>Felte dyr</p></div>
        <div className="stat-card"><span>{weaponCount}</span><p>Våpen</p></div>
        <div className="stat-card"><span>{friendCount}</span><p>Jegervenner</p></div>
      </div>
      <section className="card">
        <h2>Kom raskt i gang</h2>
        <div className="action-row">
          <button onClick={() => setPage('newHunt')}>Registrer ny jakt</button>
          <button className="secondary" onClick={() => setPage('harvests')}>Se felte dyr</button>
          <button className="secondary" onClick={() => setPage('friends')}>Jegervenner</button>
          <button className="secondary" onClick={() => setPage('weapons')}>Jaktgarderobe</button>
        </div>
      </section>
    </div>
  );
}
