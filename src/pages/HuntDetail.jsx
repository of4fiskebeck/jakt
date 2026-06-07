import { useEffect, useState } from 'react';
import { deleteDoc, doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import MapPicker from '../components/MapPicker';
import ImageUpload from '../components/ImageUpload';

export default function HuntDetail({ user, huntId, setPage }) {
  const [hunt, setHunt] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadHunt() {
      if (!huntId) return;
      const snap = await getDoc(doc(db, 'users', user.uid, 'hunts', huntId));
      if (snap.exists()) setHunt({ id: snap.id, ...snap.data() });
    }
    loadHunt();
  }, [huntId, user.uid]);

  if (!hunt) return <div className="card">Laster jakt...</div>;

  async function saveChanges() {
    setSaving(true);
    await updateDoc(doc(db, 'users', user.uid, 'hunts', hunt.id), {
      title: hunt.title,
      locationName: hunt.locationName,
      latitude: hunt.latitude ? Number(hunt.latitude) : null,
      longitude: hunt.longitude ? Number(hunt.longitude) : null,
      diaryText: hunt.diaryText,
      imageUrls: hunt.imageUrls || [],
      updatedAt: serverTimestamp()
    });
    setSaving(false);
  }

  async function deleteHunt() {
    if (!confirm('Vil du slette denne jakten?')) return;
    await deleteDoc(doc(db, 'users', user.uid, 'hunts', hunt.id));
    setPage('myHunts');
  }

  return (
    <div>
      <button className="secondary" onClick={() => setPage('myHunts')}>← Tilbake</button>
      <section className="card">
        <label>Tittel<input value={hunt.title || ''} onChange={(e) => setHunt({ ...hunt, title: e.target.value })} /></label>
        <p><strong>Jakttype:</strong> {hunt.huntType}</p>
        <p><strong>Våpen:</strong> {hunt.weaponName || 'Ikke valgt'}</p>
      </section>
      <MapPicker
        latitude={hunt.latitude || ''}
        longitude={hunt.longitude || ''}
        setLatitude={(value) => setHunt({ ...hunt, latitude: value })}
        setLongitude={(value) => setHunt({ ...hunt, longitude: value })}
        locationName={hunt.locationName || ''}
        setLocationName={(value) => setHunt({ ...hunt, locationName: value })}
      />
      <section className="card">
        <h3>Dagbok</h3>
        <textarea rows="8" value={hunt.diaryText || ''} onChange={(e) => setHunt({ ...hunt, diaryText: e.target.value })} />
      </section>
      <ImageUpload userId={user.uid} huntId={hunt.id} imageUrls={hunt.imageUrls || []} setImageUrls={(urls) => setHunt({ ...hunt, imageUrls: urls })} />
      <div className="action-row">
        <button onClick={saveChanges}>{saving ? 'Lagrer...' : 'Lagre endringer'}</button>
        <button className="danger" onClick={deleteHunt}>Slett jakt</button>
      </div>
    </div>
  );
}
