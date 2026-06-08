import { useState } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

function safeFileName(name) {
  return String(name || 'bilde.jpg').replace(/[^a-zA-Z0-9._-]/g, '-');
}

export default function ImageUpload({ userId, huntId, imageUrls = [], setImageUrls, title = 'Bilder', basePath = '' }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function handleUpload(event) {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    setUploading(true);
    setError('');
    try {
      const urls = [];
      for (const file of files) {
        if (!file.type.startsWith('image/')) continue;
        const folder = basePath || `users/${userId}/hunts/${huntId || 'draft'}/images`;
        const filePath = `${folder}/${Date.now()}-${crypto.randomUUID()}-${safeFileName(file.name)}`;
        const fileRef = ref(storage, filePath);
        await uploadBytes(fileRef, file, { contentType: file.type });
        urls.push(await getDownloadURL(fileRef));
      }
      setImageUrls([...(imageUrls || []), ...urls]);
    } catch (err) {
      console.error('Bildeopplasting feilet:', err);
      setError('Kunne ikke laste opp bilde. Sjekk Storage-regler og at du er logget inn.');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  }

  function removeUrl(url) {
    setImageUrls((imageUrls || []).filter((item) => item !== url));
  }

  return (
    <section className="card image-upload-card">
      <h3>{title}</h3>
      <p className="muted-text">Last opp ett eller flere bilder. Bildene lagres i Firebase Storage og knyttes til din bruker.</p>
      <input type="file" accept="image/*" multiple onChange={handleUpload} disabled={uploading} />
      {uploading && <p className="notice success">Laster opp bilder...</p>}
      {error && <p className="notice error">{error}</p>}
      <div className="image-grid">
        {(imageUrls || []).map((url) => (
          <div className="image-tile" key={url}>
            <img src={url} alt="Jakt" />
            <button type="button" className="secondary small-button" onClick={() => removeUrl(url)}>Fjern</button>
          </div>
        ))}
      </div>
    </section>
  );
}
