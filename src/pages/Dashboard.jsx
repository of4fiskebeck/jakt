import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { appIcons } from '../icons';

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
      <section className="hero hero-with-icon">
        <img className="hero-app-icon" src={appIcons.main} alt="Jegerapp" />
        <div>
          <h1>Velkommen, {user.displayName}</h1>
          <p>Jegerapp samler jakter, tid i felt, våpen, bilder, felte dyr og jegervenner.</p>
        </div>
        <button onClick={() => setPage('newHunt')}>+ Ny jakt</button>
      </section>
      <div className="grid four">
        <div className="stat-card icon-stat"><img src={appIcons.myHunts} alt="" /><span>{huntCount}</span><p>Jakter</p></div>
        <div className="stat-card icon-stat"><img src={appIcons.harvests} alt="" /><span>{harvestCount}</span><p>Felte dyr</p></div>
        <div className="stat-card icon-stat"><img src={appIcons.weapons} alt="" /><span>{weaponCount}</span><p>Våpen</p></div>
        <div className="stat-card icon-stat"><img src={appIcons.friends} alt="" /><span>{friendCount}</span><p>Jegervenner</p></div>
      </div>
      <section className="card">
        <h2>Kom raskt i gang</h2>
        <div className="action-row">
          <button className="button-with-mini-icon" onClick={() => setPage('newHunt')}><img src={appIcons.newHunt} alt="" />Registrer ny jakt</button>
          <button className="secondary button-with-mini-icon" onClick={() => setPage('harvests')}><img src={appIcons.harvests} alt="" />Se felte dyr</button>
          <button className="secondary button-with-mini-icon" onClick={() => setPage('friends')}><img src={appIcons.friends} alt="" />Jegervenner</button>
          <button className="secondary button-with-mini-icon" onClick={() => setPage('weapons')}><img src={appIcons.weapons} alt="" />Jaktgarderobe</button>
        </div>
      </section>
    </div>
  );
}
