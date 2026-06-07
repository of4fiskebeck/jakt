import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase';

export default function MyHunts({ user, openHunt }) {
  const [hunts, setHunts] = useState([]);

  useEffect(() => {
    const q = query(collection(db, 'users', user.uid, 'hunts'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snap) => setHunts(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
  }, [user.uid]);

  return (
    <div>
      <h1>Mine jakter</h1>
      {!hunts.length && <div className="card"><p>Du har ikke registrert noen jakter ennå.</p></div>}
      <div className="grid two">
        {hunts.map((hunt) => (
          <article className="card hunt-card" key={hunt.id} onClick={() => openHunt(hunt.id)}>
            {hunt.imageUrls?.[0] && <img src={hunt.imageUrls[0]} alt="Jakt" className="hunt-thumb" />}
            <h3>{hunt.title}</h3>
            <p><strong>Sted:</strong> {hunt.locationName || 'Ikke registrert'}</p>
            <p><strong>Jakttype:</strong> {hunt.huntType}</p>
            <p><strong>Våpen:</strong> {hunt.weaponName || 'Ikke valgt'}</p>
            <p>{hunt.diaryText?.slice(0, 120)}{hunt.diaryText?.length > 120 ? '...' : ''}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
