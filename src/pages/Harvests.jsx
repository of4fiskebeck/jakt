import { useEffect, useState } from 'react';
import { addDoc, collection, onSnapshot, query, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export default function Harvests({ user }) {
  const [harvests, setHarvests] = useState([]);
  const [commentTexts, setCommentTexts] = useState({});
  const [comments, setComments] = useState({});

  useEffect(() => {
    const q = query(collection(db, 'users', user.uid, 'harvests'));
    return onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ownerUid: user.uid, ...d.data() }));
      data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setHarvests(data);
    });
  }, [user.uid]);

  useEffect(() => {
    const unsubscribes = harvests.map((harvest) => onSnapshot(collection(db, 'users', harvest.ownerUid || user.uid, 'harvests', harvest.id, 'comments'), (snap) => {
      setComments((prev) => ({ ...prev, [harvest.id]: snap.docs.map((d) => ({ id: d.id, ...d.data() })) }));
    }));
    return () => unsubscribes.forEach((unsub) => unsub());
  }, [harvests, user.uid]);

  async function addComment(harvest) {
    const text = (commentTexts[harvest.id] || '').trim();
    if (!text) return;
    await addDoc(collection(db, 'users', harvest.ownerUid || user.uid, 'harvests', harvest.id, 'comments'), {
      text,
      authorUid: user.uid,
      authorName: user.displayName || '',
      authorPhotoURL: user.photoURL || '',
      createdAt: serverTimestamp()
    });
    setCommentTexts({ ...commentTexts, [harvest.id]: '' });
  }

  return (
    <div>
      <div className="page-heading">
        <p className="eyebrow">Felte dyr</p>
        <h1>Dyr skutt</h1>
        <p>Oversikt over registrert felt vilt, bilder, vekt og kommentarer.</p>
      </div>
      {!harvests.length && <div className="card"><p>Ingen felte dyr registrert ennå. Legg til felt dyr når du registrerer en ny jakt.</p></div>}
      <div className="grid two">
        {harvests.map((harvest) => (
          <article className="card harvest-card" key={harvest.id}>
            {harvest.imageUrls?.[0] && <img src={harvest.imageUrls[0]} alt={harvest.animalType} className="hunt-thumb" />}
            <h3>{harvest.animalType}</h3>
            <p><strong>Jakt:</strong> {harvest.huntTitle || 'Ikke koblet til jakt'}</p>
            <p><strong>Sted:</strong> {harvest.locationName || 'Ikke registrert'}</p>
            <p><strong>Dato:</strong> {harvest.date || 'Ikke registrert'}</p>
            <p><strong>Vekt:</strong> {harvest.weightKg ? `${harvest.weightKg} kg` : 'Ikke registrert'}</p>
            <p><strong>Info:</strong> {[harvest.sex, harvest.ageCategory].filter(Boolean).join(' / ') || 'Ikke registrert'}</p>
            <p>{harvest.notes}</p>
            <span className="privacy-pill">{harvest.visibility === 'friends' ? 'Synlig for jegervenner' : 'Privat'}</span>
            <div className="comments-box">
              <strong>Kommentarer</strong>
              {(comments[harvest.id] || []).map((comment) => <p key={comment.id} className="comment"><b>{comment.authorName}:</b> {comment.text}</p>)}
              <div className="comment-form">
                <input value={commentTexts[harvest.id] || ''} onChange={(e) => setCommentTexts({ ...commentTexts, [harvest.id]: e.target.value })} placeholder="Skriv kommentar..." />
                <button type="button" className="secondary" onClick={() => addComment(harvest)}>Kommenter</button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
