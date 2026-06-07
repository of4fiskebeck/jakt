import { useState } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

export default function ImageUpload({ userId, huntId, imageUrls, setImageUrls }) {
  const [uploading, setUploading] = useState(false);

  async function handleUpload(event) {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const urls = [];
      for (const file of files) {
        const filePath = `users/${userId}/hunts/${huntId || 'draft'}/${Date.now()}-${file.name}`;
        const fileRef = ref(storage, filePath);
        await uploadBytes(fileRef, file);
        urls.push(await getDownloadURL(fileRef));
      }
      setImageUrls([...(imageUrls || []), ...urls]);
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className="card">
      <h3>Bilder</h3>
      <input type="file" accept="image/*" multiple onChange={handleUpload} />
      {uploading && <p>Laster opp bilder...</p>}
      <div className="image-grid">
        {(imageUrls || []).map((url) => (
          <img key={url} src={url} alt="Jakt" />
        ))}
      </div>
    </section>
  );
}
