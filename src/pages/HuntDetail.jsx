import { useEffect, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, getDoc, onSnapshot, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { db } from '../firebase';
import MapPicker from '../components/MapPicker';
import ImageUpload from '../components/ImageUpload';

export default function HuntDetail({ user, huntId, setPage }) {
  const [hunt, setHunt] = useState(null);
  const [harvests, setHarvests] = useState([]);
  const [saving, setSaving] = useState(false);
  const [commentTexts, setCommentTexts] = useState({});
  const [comments, setComments] = useState({});

  useEffect(() => {
    async function loadHunt() {
      if (!huntId) return;
      const snap = await getDoc(doc(db, 'users', user.uid, 'hunts', huntId));
      if (snap.exists()) setHunt({ id: snap.id, ...snap.data() });
    }
    loadHunt();
  }, [huntId, user.uid]);

  useEffect(() => {
    if (!huntId) return undefined;
    const q = query(collection(db, 'users', user.uid, 'harvests'), where('huntId', '==', huntId));
    return onSnapshot(q, (snap) => setHarvests(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
  }, [huntId, user.uid]);

  useEffect(() => {
    const unsubscribes = harvests.map((harvest) => onSnapshot(collection(db, 'users', user.uid, 'harvests', harvest.id, 'comments'), (snap) => {
      setComments((prev) => ({ ...prev, [harvest.id]: snap.docs.map((d) => ({ id: d.id, ...d.data() })) }));
    }));
    return () => unsubscribes.forEach((unsub) => unsub());
  }, [harvests, user.uid]);

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
      startDate: hunt.startDate || '',
      startTime: hunt.startTime || '',
      endDate: hunt.endDate || '',
      endTime: hunt.endTime || '',
      manualHours: hunt.manualHours || null,
      durationText: hunt.durationText || '',
      updatedAt: serverTimestamp()
    });
    setSaving(false);
  }

  async function deleteHunt() {
    if (!confirm('Vil du slette denne jakten?')) return;
    await deleteDoc(doc(db, 'users', user.uid, 'hunts', hunt.id));
    setPage('myHunts');
  }

  async function addComment(harvestId) {
    const text = (commentTexts[harvestId] || '').trim();
    if (!text) return;
    await addDoc(collection(db, 'users', user.uid, 'harvests', harvestId, 'comments'), {
      text,
      authorUid: user.uid,
      authorName: user.displayName || '',
      authorPhotoURL: user.photoURL || '',
      createdAt: serverTimestamp()
    });
    setCommentTexts({ ...commentTexts, [harvestId]: '' });
  }

  return (
    <div>
      <button className="secondary" onClick={() => setPage('myHunts')}>← Tilbake</button>
      <section className="card">
        <label>Tittel<input value={hunt.title || ''} onChange={(e) => setHunt({ ...hunt, title: e.target.value })} /></label>
        <div className="grid three">
          <p><strong>Jakttype:</strong><br />{hunt.huntType}</p>
          <p><strong>Våpen:</strong><br />{hunt.weaponName || 'Ikke valgt'}</p>
          <p><strong>Tid på jakt:</strong><br />{hunt.durationText || 'Ikke registrert'}</p>
        </div>
        <div className="grid four">
          <label>Startdato<input type="date" value={hunt.startDate || ''} onChange={(e) => setHunt({ ...hunt, startDate: e.target.value })} /></label>
          <label>Starttid<input type="time" value={hunt.startTime || ''} onChange={(e) => setHunt({ ...hunt, startTime: e.target.value })} /></label>
          <label>Sluttdato<input type="date" value={hunt.endDate || ''} onChange={(e) => setHunt({ ...hunt, endDate: e.target.value })} /></label>
          <label>Sluttid<input type="time" value={hunt.endTime || ''} onChange={(e) => setHunt({ ...hunt, endTime: e.target.value })} /></label>
        </div>
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
      <ImageUpload userId={user.uid} huntId={hunt.id} imageUrls={hunt.imageUrls || []} setImageUrls={(urls) => setHunt({ ...hunt, imageUrls: urls })} title="Bilder fra jakten" />

      <section className="card">
        <h3>Felte dyr på denne jakten</h3>
        {!harvests.length && <p className="muted-text">Ingen felte dyr registrert på denne jakten.</p>}
        <div className="grid two">
          {harvests.map((harvest) => (
            <article className="harvest-card" key={harvest.id}>
              {harvest.imageUrls?.[0] && <img src={harvest.imageUrls[0]} alt={harvest.animalType} className="hunt-thumb" />}
              <h3>{harvest.animalType}</h3>
              <p><strong>Vekt:</strong> {harvest.weightKg ? `${harvest.weightKg} kg` : 'Ikke registrert'}</p>
              <p><strong>Kjønn/kategori:</strong> {[harvest.sex, harvest.ageCategory].filter(Boolean).join(' / ') || 'Ikke registrert'}</p>
              <p>{harvest.notes}</p>
              <div className="comments-box">
                <strong>Kommentarer</strong>
                {(comments[harvest.id] || []).map((comment) => <p key={comment.id} className="comment"><b>{comment.authorName}:</b> {comment.text}</p>)}
                <div className="comment-form">
                  <input value={commentTexts[harvest.id] || ''} onChange={(e) => setCommentTexts({ ...commentTexts, [harvest.id]: e.target.value })} placeholder="Skriv kommentar..." />
                  <button type="button" className="secondary" onClick={() => addComment(harvest.id)}>Kommenter</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="action-row">
        <button onClick={saveChanges}>{saving ? 'Lagrer...' : 'Lagre endringer'}</button>
        <button className="danger" onClick={deleteHunt}>Slett jakt</button>
      </div>
    </div>
  );
}
