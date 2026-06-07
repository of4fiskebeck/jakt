import { useEffect, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

const initialWeapon = { name: '', caliber: '', type: 'Rifle', optics: '', notes: '' };

export default function Weapons({ user }) {
  const [weapons, setWeapons] = useState([]);
  const [weapon, setWeapon] = useState(initialWeapon);

  useEffect(() => {
    const q = query(collection(db, 'users', user.uid, 'weapons'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snap) => setWeapons(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
  }, [user.uid]);

  async function addWeapon(event) {
    event.preventDefault();
    if (!weapon.name.trim()) return;
    await addDoc(collection(db, 'users', user.uid, 'weapons'), { ...weapon, createdAt: serverTimestamp() });
    setWeapon(initialWeapon);
  }

  async function removeWeapon(id) {
    await deleteDoc(doc(db, 'users', user.uid, 'weapons', id));
  }

  return (
    <div>
      <h1>Jaktgarderobe</h1>
      <form className="card" onSubmit={addWeapon}>
        <div className="grid two">
          <label>Våpen<input value={weapon.name} onChange={(e) => setWeapon({ ...weapon, name: e.target.value })} placeholder="Tikka T3x" /></label>
          <label>Kaliber<input value={weapon.caliber} onChange={(e) => setWeapon({ ...weapon, caliber: e.target.value })} placeholder=".308 Win" /></label>
          <label>Type<select value={weapon.type} onChange={(e) => setWeapon({ ...weapon, type: e.target.value })}><option>Rifle</option><option>Hagle</option><option>Kombi</option><option>Pistol</option><option>Annet</option></select></label>
          <label>Optikk/sikte<input value={weapon.optics} onChange={(e) => setWeapon({ ...weapon, optics: e.target.value })} placeholder="Zeiss V4" /></label>
        </div>
        <label>Notater<textarea value={weapon.notes} onChange={(e) => setWeapon({ ...weapon, notes: e.target.value })} /></label>
        <button>Legg til våpen</button>
      </form>
      <div className="grid two">
        {weapons.map((w) => (
          <article className="card" key={w.id}>
            <h3>{w.name}</h3>
            <p><strong>Kaliber:</strong> {w.caliber}</p>
            <p><strong>Type:</strong> {w.type}</p>
            <p><strong>Optikk:</strong> {w.optics || 'Ikke registrert'}</p>
            <p>{w.notes}</p>
            <button className="danger" onClick={() => removeWeapon(w.id)}>Slett</button>
          </article>
        ))}
      </div>
    </div>
  );
}
