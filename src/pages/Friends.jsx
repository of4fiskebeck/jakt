import { useEffect, useMemo, useState } from 'react';
import { collection, doc, getDocs, onSnapshot, query, serverTimestamp, setDoc, where, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import PageHeading from '../components/PageHeading';
import { appIcons } from '../icons';

export default function Friends({ user }) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [friendHarvests, setFriendHarvests] = useState([]);
  const myProfile = useMemo(() => ({
    uid: user.uid,
    name: user.displayName || '',
    email: user.email || '',
    photoURL: user.photoURL || ''
  }), [user]);

  useEffect(() => {
    const unsubFriends = onSnapshot(collection(db, 'users', user.uid, 'friends'), (snap) => {
      setFriends(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    const unsubRequests = onSnapshot(collection(db, 'users', user.uid, 'friendRequests'), (snap) => {
      setRequests(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => {
      unsubFriends();
      unsubRequests();
    };
  }, [user.uid]);

  useEffect(() => {
    const unsubscribes = friends.map((friend) => onSnapshot(collection(db, 'users', friend.uid || friend.friendUid || friend.id, 'harvests'), (snap) => {
      const visible = snap.docs
        .map((d) => ({ id: d.id, ownerUid: friend.uid || friend.friendUid || friend.id, ownerName: friend.name, ...d.data() }))
        .filter((item) => item.visibility === 'friends');
      setFriendHarvests((prev) => [
        ...prev.filter((item) => item.ownerUid !== (friend.uid || friend.friendUid || friend.id)),
        ...visible
      ].sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
    }));
    return () => unsubscribes.forEach((unsub) => unsub());
  }, [friends]);

  async function sendFriendRequest() {
    setMessage('');
    const targetEmail = email.trim().toLowerCase();
    if (!targetEmail) return;
    if (targetEmail === (user.email || '').toLowerCase()) {
      setMessage('Du kan ikke legge til deg selv som jegervenn.');
      return;
    }
    const q = query(collection(db, 'publicProfiles'), where('emailLower', '==', targetEmail));
    const snap = await getDocs(q);
    if (snap.empty) {
      setMessage('Fant ingen bruker med den e-posten. Brukeren må ha logget inn i Jegerapp først.');
      return;
    }
    const target = snap.docs[0];
    const targetData = target.data();
    await setDoc(doc(db, 'users', target.id, 'friendRequests', user.uid), {
      fromUid: user.uid,
      fromName: user.displayName || '',
      fromEmail: user.email || '',
      fromPhotoURL: user.photoURL || '',
      status: 'pending',
      createdAt: serverTimestamp()
    });
    await setDoc(doc(db, 'users', user.uid, 'sentFriendRequests', target.id), {
      toUid: target.id,
      toName: targetData.name || '',
      toEmail: targetData.email || '',
      status: 'pending',
      createdAt: serverTimestamp()
    });
    setEmail('');
    setMessage('Venneforespørsel sendt.');
  }

  async function acceptRequest(request) {
    const friendProfile = {
      uid: request.fromUid,
      name: request.fromName || '',
      email: request.fromEmail || '',
      photoURL: request.fromPhotoURL || '',
      createdAt: serverTimestamp()
    };
    await setDoc(doc(db, 'users', user.uid, 'friends', request.fromUid), friendProfile);
    await setDoc(doc(db, 'users', request.fromUid, 'friends', user.uid), myProfile);
    await deleteDoc(doc(db, 'users', user.uid, 'friendRequests', request.fromUid));
    setMessage('Jegervenn lagt til.');
  }

  async function declineRequest(request) {
    await deleteDoc(doc(db, 'users', user.uid, 'friendRequests', request.fromUid));
  }

  return (
    <div>
      <PageHeading icon={appIcons.friends} eyebrow="Jegervenner" title="Venner og delte felt dyr">Legg til jegervenner med e-post. Venner kan se felte dyr du har markert som synlige for jegervenner.</PageHeading>
      {message && <p className="notice success">{message}</p>}
      <section className="card">
        <h3>Legg til jegervenn</h3>
        <div className="friend-search-row">
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="venn@eksempel.no" />
          <button type="button" onClick={sendFriendRequest}>Send forespørsel</button>
        </div>
      </section>

      <section className="card">
        <h3>Venneforespørsler</h3>
        {!requests.length && <p className="muted-text">Ingen nye forespørsler.</p>}
        {requests.map((request) => (
          <article className="friend-row" key={request.id}>
            {request.fromPhotoURL && <img src={request.fromPhotoURL} alt="" />}
            <div><strong>{request.fromName}</strong><small>{request.fromEmail}</small></div>
            <button type="button" onClick={() => acceptRequest(request)}>Godta</button>
            <button type="button" className="secondary" onClick={() => declineRequest(request)}>Avslå</button>
          </article>
        ))}
      </section>

      <section className="card">
        <h3>Mine jegervenner</h3>
        {!friends.length && <p className="muted-text">Du har ingen jegervenner ennå.</p>}
        <div className="friends-grid">
          {friends.map((friend) => (
            <article className="friend-card" key={friend.uid || friend.id}>
              {friend.photoURL && <img src={friend.photoURL} alt="" />}
              <strong>{friend.name}</strong>
              <small>{friend.email}</small>
            </article>
          ))}
        </div>
      </section>

      <section className="card">
        <h3>Felte dyr fra jegervenner</h3>
        {!friendHarvests.length && <p className="muted-text">Ingen delte felt dyr fra jegervenner ennå.</p>}
        <div className="grid two">
          {friendHarvests.map((harvest) => (
            <article className="harvest-card" key={`${harvest.ownerUid}-${harvest.id}`}>
              {harvest.imageUrls?.[0] && <img src={harvest.imageUrls[0]} alt={harvest.animalType} className="hunt-thumb" />}
              <h3>{harvest.animalType}</h3>
              <p><strong>Jeger:</strong> {harvest.ownerName || 'Jegervenn'}</p>
              <p><strong>Sted:</strong> {harvest.locationName || 'Ikke registrert'}</p>
              <p><strong>Vekt:</strong> {harvest.weightKg ? `${harvest.weightKg} kg` : 'Ikke registrert'}</p>
              <p>{harvest.notes}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
