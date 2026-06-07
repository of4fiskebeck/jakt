import { useEffect, useMemo, useState } from 'react';
import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import MapPicker from '../components/MapPicker';
import ImageUpload from '../components/ImageUpload';

const huntTypes = ['Elgjakt', 'Hjortejakt', 'Rådyrjakt', 'Småviltjakt', 'Fuglejakt', 'Revjakt', 'Annet'];

export default function NewHunt({ user, setPage }) {
  const [weapons, setWeapons] = useState([]);
  const [title, setTitle] = useState('');
  const [locationName, setLocationName] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [huntType, setHuntType] = useState(huntTypes[0]);
  const [weaponId, setWeaponId] = useState('');
  const [diaryText, setDiaryText] = useState('');
  const [imageUrls, setImageUrls] = useState([]);
  const draftHuntId = useMemo(() => crypto.randomUUID(), []);

  useEffect(() => {
    const q = query(collection(db, 'users', user.uid, 'weapons'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setWeapons(data);
      if (!weaponId && data.length) setWeaponId(data[0].id);
    });
  }, [user.uid, weaponId]);

  async function saveHunt(event) {
    event.preventDefault();
    if (!title.trim()) return;
    const selectedWeapon = weapons.find((w) => w.id === weaponId);
    await addDoc(collection(db, 'users', user.uid, 'hunts'), {
      title,
      locationName,
      latitude: latitude ? Number(latitude) : null,
      longitude: longitude ? Number(longitude) : null,
      huntType,
      weaponId,
      weaponName: selectedWeapon ? `${selectedWeapon.name} ${selectedWeapon.caliber}`.trim() : '',
      diaryText,
      imageUrls,
      status: 'Registrert',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    setPage('myHunts');
  }

  return (
    <form onSubmit={saveHunt}>
      <h1>Ny jakt</h1>
      <section className="card">
        <div className="grid two">
          <label>Tittel<input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Morgenjakt i Rendalen" required /></label>
          <label>Jakttype<select value={huntType} onChange={(e) => setHuntType(e.target.value)}>{huntTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
        </div>
        <label>Velg våpen<select value={weaponId} onChange={(e) => setWeaponId(e.target.value)}><option value="">Ingen våpen valgt</option>{weapons.map((w) => <option value={w.id} key={w.id}>{w.name} {w.caliber}</option>)}</select></label>
      </section>
      <MapPicker latitude={latitude} longitude={longitude} setLatitude={setLatitude} setLongitude={setLongitude} locationName={locationName} setLocationName={setLocationName} />
      <section className="card">
        <h3>Dagbok</h3>
        <textarea rows="8" value={diaryText} onChange={(e) => setDiaryText(e.target.value)} placeholder="Skriv notater fra jakten..." />
      </section>
      <ImageUpload userId={user.uid} huntId={draftHuntId} imageUrls={imageUrls} setImageUrls={setImageUrls} />
      <button className="save-button">Lagre jakt</button>
    </form>
  );
}
