import { useEffect, useMemo, useState } from 'react';
import { addDoc, collection, onSnapshot, query, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import MapPicker from '../components/MapPicker';
import ImageUpload from '../components/ImageUpload';

const huntTypes = ['Elgjakt', 'Hjortejakt', 'Rådyrjakt', 'Småviltjakt', 'Fuglejakt', 'Revjakt', 'Annet'];
const animalTypes = ['Elg', 'Hjort', 'Rådyr', 'Rein', 'Villrein', 'Villsvin', 'Rype', 'Orrfugl', 'Storfugl', 'Gås', 'And', 'Rev', 'Hare', 'Annet'];

function calculateDuration(startDate, startTime, endDate, endTime, manualHours) {
  if (manualHours) return `${manualHours} timer`;
  if (!startDate || !startTime || !endDate || !endTime) return '';
  const start = new Date(`${startDate}T${startTime}`);
  const end = new Date(`${endDate}T${endTime}`);
  const diff = end - start;
  if (!Number.isFinite(diff) || diff <= 0) return '';
  const minutes = Math.round(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} t ${rest} min` : `${hours} t`;
}

const emptyHarvest = {
  animalType: 'Rådyr',
  sex: '',
  ageCategory: '',
  weightKg: '',
  shotDistance: '',
  notes: '',
  imageUrls: [],
  visibility: 'private'
};

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
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [endTime, setEndTime] = useState('');
  const [manualHours, setManualHours] = useState('');
  const [harvests, setHarvests] = useState([]);
  const [harvestDraft, setHarvestDraft] = useState(emptyHarvest);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const draftHuntId = useMemo(() => crypto.randomUUID(), []);
  const durationText = calculateDuration(startDate, startTime, endDate, endTime, manualHours);

  useEffect(() => {
    const q = query(collection(db, 'users', user.uid, 'weapons'));
    return onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => String(b.createdAt?.seconds || '').localeCompare(String(a.createdAt?.seconds || '')));
      setWeapons(data);
      if (!weaponId && data.length) setWeaponId(data[0].id);
    });
  }, [user.uid, weaponId]);

  function addHarvestDraft() {
    if (!harvestDraft.animalType) return;
    setHarvests([
      ...harvests,
      { ...harvestDraft, id: crypto.randomUUID(), createdAtLocal: new Date().toISOString() }
    ]);
    setHarvestDraft(emptyHarvest);
  }

  function removeHarvest(id) {
    setHarvests(harvests.filter((harvest) => harvest.id !== id));
  }

  async function saveHunt(event) {
    event.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    setError('');
    try {
      const selectedWeapon = weapons.find((w) => w.id === weaponId);
      const huntRef = await addDoc(collection(db, 'users', user.uid, 'hunts'), {
        title,
        locationName,
        latitude: latitude ? Number(latitude) : null,
        longitude: longitude ? Number(longitude) : null,
        huntType,
        weaponId,
        weaponName: selectedWeapon ? `${selectedWeapon.name} ${selectedWeapon.caliber}`.trim() : '',
        diaryText,
        imageUrls,
        startDate,
        startTime,
        endDate,
        endTime,
        manualHours: manualHours ? Number(manualHours) : null,
        durationText,
        harvestCount: harvests.length,
        visibility: 'private',
        status: 'Registrert',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      for (const harvest of harvests) {
        await addDoc(collection(db, 'users', user.uid, 'harvests'), {
          ...harvest,
          huntId: huntRef.id,
          huntTitle: title,
          locationName,
          weaponId,
          weaponName: selectedWeapon ? `${selectedWeapon.name} ${selectedWeapon.caliber}`.trim() : '',
          date: startDate,
          weightKg: harvest.weightKg ? Number(harvest.weightKg) : null,
          shotDistance: harvest.shotDistance ? Number(harvest.shotDistance) : null,
          ownerUid: user.uid,
          ownerName: user.displayName || '',
          ownerPhotoURL: user.photoURL || '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      setPage('myHunts');
    } catch (err) {
      console.error('Kunne ikke lagre jakt:', err);
      setError('Kunne ikke lagre jakten. Sjekk Firestore- og Storage-regler.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={saveHunt}>
      <div className="page-heading">
        <p className="eyebrow">Ny jakt</p>
        <h1>Registrer jakt</h1>
        <p>Loggfør sted, tid, bilder, dagbok og eventuelle felte dyr.</p>
      </div>
      {error && <p className="notice error">{error}</p>}
      <section className="card">
        <div className="grid two">
          <label>Tittel<input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Morgenjakt i Rendalen" required /></label>
          <label>Jakttype<select value={huntType} onChange={(e) => setHuntType(e.target.value)}>{huntTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
        </div>
        <label>Velg våpen<select value={weaponId} onChange={(e) => setWeaponId(e.target.value)}><option value="">Ingen våpen valgt</option>{weapons.map((w) => <option value={w.id} key={w.id}>{w.name} {w.caliber}</option>)}</select></label>
      </section>

      <section className="card">
        <h3>Tid på jakt</h3>
        <div className="grid four">
          <label>Startdato<input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></label>
          <label>Starttid<input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} /></label>
          <label>Sluttdato<input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></label>
          <label>Sluttid<input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} /></label>
        </div>
        <label>Manuell varighet hvis ønskelig<input type="number" step="0.25" min="0" value={manualHours} onChange={(e) => setManualHours(e.target.value)} placeholder="F.eks. 5.5" /></label>
        {durationText && <p className="duration-pill">Tid på jakt: {durationText}</p>}
      </section>

      <MapPicker latitude={latitude} longitude={longitude} setLatitude={setLatitude} setLongitude={setLongitude} locationName={locationName} setLocationName={setLocationName} />

      <section className="card">
        <h3>Dagbok</h3>
        <textarea rows="8" value={diaryText} onChange={(e) => setDiaryText(e.target.value)} placeholder="Skriv notater fra jakten..." />
      </section>

      <ImageUpload userId={user.uid} huntId={draftHuntId} imageUrls={imageUrls} setImageUrls={setImageUrls} title="Bilder fra jakten" />

      <section className="card harvest-editor">
        <h3>Dyr skutt / felt vilt</h3>
        <p className="muted-text">Legg inn info om dyret, vekt og bilde. Du kan legge til flere dyr på samme jakt.</p>
        <div className="grid three">
          <label>Dyreart<select value={harvestDraft.animalType} onChange={(e) => setHarvestDraft({ ...harvestDraft, animalType: e.target.value })}>{animalTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
          <label>Kjønn<input value={harvestDraft.sex} onChange={(e) => setHarvestDraft({ ...harvestDraft, sex: e.target.value })} placeholder="Bukk, kolle, okse..." /></label>
          <label>Alder/kategori<input value={harvestDraft.ageCategory} onChange={(e) => setHarvestDraft({ ...harvestDraft, ageCategory: e.target.value })} placeholder="Kalv, voksen, ungdyr..." /></label>
        </div>
        <div className="grid three">
          <label>Vekt kg<input type="number" min="0" step="0.1" value={harvestDraft.weightKg} onChange={(e) => setHarvestDraft({ ...harvestDraft, weightKg: e.target.value })} /></label>
          <label>Skuddavstand meter<input type="number" min="0" value={harvestDraft.shotDistance} onChange={(e) => setHarvestDraft({ ...harvestDraft, shotDistance: e.target.value })} /></label>
          <label>Deling<select value={harvestDraft.visibility} onChange={(e) => setHarvestDraft({ ...harvestDraft, visibility: e.target.value })}><option value="private">Privat</option><option value="friends">Synlig for jegervenner</option></select></label>
        </div>
        <label>Notat<textarea rows="4" value={harvestDraft.notes} onChange={(e) => setHarvestDraft({ ...harvestDraft, notes: e.target.value })} placeholder="Kort info om dyret og situasjonen..." /></label>
        <ImageUpload
          userId={user.uid}
          huntId={draftHuntId}
          imageUrls={harvestDraft.imageUrls}
          setImageUrls={(urls) => setHarvestDraft({ ...harvestDraft, imageUrls: urls })}
          title="Bilde av felt dyr"
          basePath={`users/${user.uid}/harvests/drafts/${draftHuntId}`}
        />
        <button type="button" className="secondary" onClick={addHarvestDraft}>+ Legg til felt dyr</button>
        <div className="harvest-list">
          {harvests.map((harvest) => (
            <article className="harvest-mini" key={harvest.id}>
              {harvest.imageUrls?.[0] && <img src={harvest.imageUrls[0]} alt={harvest.animalType} />}
              <div><strong>{harvest.animalType}</strong><small>{harvest.weightKg ? `${harvest.weightKg} kg` : 'Vekt ikke registrert'} · {harvest.visibility === 'friends' ? 'Delt med venner' : 'Privat'}</small></div>
              <button type="button" className="danger small-button" onClick={() => removeHarvest(harvest.id)}>Fjern</button>
            </article>
          ))}
        </div>
      </section>

      <button className="save-button" disabled={saving}>{saving ? 'Lagrer...' : 'Lagre jakt'}</button>
    </form>
  );
}
