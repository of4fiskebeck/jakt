import { useEffect, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, onSnapshot, query, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import PageHeading from '../components/PageHeading';
import { appIcons } from '../icons';

const initialWeapon = { name: '', caliber: '', type: 'Rifle', optics: '', notes: '' };

export default function Weapons({ user }) {
  const [weapons, setWeapons] = useState([]);
  const [weapon, setWeapon] = useState(initialWeapon);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setError('');
    const q = query(collection(db, 'users', user.uid, 'weapons'));
    return onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        data.sort((a, b) => {
          const aTime = a.createdAt?.seconds || 0;
          const bTime = b.createdAt?.seconds || 0;
          return bTime - aTime;
        });
        setWeapons(data);
      },
      (err) => {
        console.error('Kunne ikke hente våpen:', err);
        setError('Kunne ikke hente våpen. Sjekk at Firestore-reglene er publisert.');
      }
    );
  }, [user.uid]);

  async function addWeapon(event) {
    event.preventDefault();
    setMessage('');
    setError('');

    const name = weapon.name.trim();
    if (!name) {
      setError('Skriv inn våpennavn før du lagrer.');
      return;
    }

    setSaving(true);
    try {
      await setDoc(
        doc(db, 'users', user.uid),
        {
          name: user.displayName || '',
          email: user.email || '',
          photoURL: user.photoURL || '',
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );

      await addDoc(collection(db, 'users', user.uid, 'weapons'), {
        name,
        caliber: weapon.caliber.trim(),
        type: weapon.type,
        optics: weapon.optics.trim(),
        notes: weapon.notes.trim(),
        ownerId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      setWeapon(initialWeapon);
      setMessage('Våpen lagret.');
    } catch (err) {
      console.error('Kunne ikke lagre våpen:', err);
      setError('Kunne ikke lagre våpen. Mest sannsynlig må Firestore-reglene deployes fra GitHub Actions.');
    } finally {
      setSaving(false);
    }
  }

  async function removeWeapon(id) {
    setMessage('');
    setError('');
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'weapons', id));
      setMessage('Våpen slettet.');
    } catch (err) {
      console.error('Kunne ikke slette våpen:', err);
      setError('Kunne ikke slette våpen.');
    }
  }

  return (
    <div>
      <PageHeading icon={appIcons.weapons} eyebrow="Jaktgarderobe" title="Våpen og utstyr">Registrer våpen, kaliber, sikter og egne notater. Våpen kan deretter velges når du lager en ny jakt.</PageHeading>

      <form className="card weapon-form" onSubmit={addWeapon}>
        <div className="section-title">
          <span><img src={appIcons.weapons} alt="" /></span>
          <div>
            <h2>Legg til våpen</h2>
            <p>Alt lagres i din egen Firestore-brukerprofil.</p>
          </div>
        </div>

        {message && <div className="notice success">{message}</div>}
        {error && <div className="notice error">{error}</div>}

        <div className="grid two">
          <label>Våpen<input value={weapon.name} onChange={(e) => setWeapon({ ...weapon, name: e.target.value })} placeholder="Tikka T3x" /></label>
          <label>Kaliber<input value={weapon.caliber} onChange={(e) => setWeapon({ ...weapon, caliber: e.target.value })} placeholder=".308 Win" /></label>
          <label>Type<select value={weapon.type} onChange={(e) => setWeapon({ ...weapon, type: e.target.value })}><option>Rifle</option><option>Hagle</option><option>Kombi</option><option>Pistol</option><option>Annet</option></select></label>
          <label>Optikk/sikte<input value={weapon.optics} onChange={(e) => setWeapon({ ...weapon, optics: e.target.value })} placeholder="Zeiss V4" /></label>
        </div>
        <label>Notater<textarea value={weapon.notes} onChange={(e) => setWeapon({ ...weapon, notes: e.target.value })} placeholder="Brukes til hjort og rådyr..." /></label>
        <button className="primary-button" type="submit" disabled={saving}>{saving ? 'Lagrer...' : 'Lagre våpen'}</button>
      </form>

      <div className="grid two">
        {weapons.map((w) => (
          <article className="card weapon-card" key={w.id}>
            <div className="weapon-icon">⌖</div>
            <h3>{w.name}</h3>
            <p><strong>Kaliber:</strong> {w.caliber || 'Ikke registrert'}</p>
            <p><strong>Type:</strong> {w.type}</p>
            <p><strong>Optikk:</strong> {w.optics || 'Ikke registrert'}</p>
            {w.notes && <p className="muted-text">{w.notes}</p>}
            <button className="danger" type="button" onClick={() => removeWeapon(w.id)}>Slett</button>
          </article>
        ))}
      </div>
    </div>
  );
}
