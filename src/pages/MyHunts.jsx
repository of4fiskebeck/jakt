import { useEffect, useState } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../firebase';

export default function MyHunts({ user, openHunt }) {
  const [hunts, setHunts] = useState([]);

  useEffect(() => {
    const q = query(collection(db, 'users', user.uid, 'hunts'));
    return onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setHunts(data);
    });
  }, [user.uid]);

  return (
    <div>
      <div className="page-heading">
        <p className="eyebrow">Mine jakter</p>
        <h1>Jaktloggen</h1>
        <p>Åpne en jakt for å se bilder, kart, dagbok, tid og felte dyr.</p>
      </div>
      {!hunts.length && <div className="card"><p>Du har ikke registrert noen jakter ennå.</p></div>}
      <div className="grid two">
        {hunts.map((hunt) => (
          <article className="card hunt-card" key={hunt.id} onClick={() => openHunt(hunt.id)}>
            {hunt.imageUrls?.[0] && <img src={hunt.imageUrls[0]} alt="Jakt" className="hunt-thumb" />}
            <h3>{hunt.title}</h3>
            <p><strong>Sted:</strong> {hunt.locationName || 'Ikke registrert'}</p>
            <p><strong>Dato:</strong> {hunt.startDate || 'Ikke registrert'}</p>
            <p><strong>Tid på jakt:</strong> {hunt.durationText || 'Ikke registrert'}</p>
            <p><strong>Felte dyr:</strong> {hunt.harvestCount || 0}</p>
            <p><strong>Jakttype:</strong> {hunt.huntType}</p>
            <p><strong>Våpen:</strong> {hunt.weaponName || 'Ikke valgt'}</p>
            <p>{hunt.diaryText?.slice(0, 120)}{hunt.diaryText?.length > 120 ? '...' : ''}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
