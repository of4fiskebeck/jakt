export default function Profile({ user }) {
  return (
    <div className="card profile-card">
      {user.photoURL && <img src={user.photoURL} alt="Profil" className="profile-photo" />}
      <h1>Profil</h1>
      <p><strong>Navn:</strong> {user.displayName}</p>
      <p><strong>E-post:</strong> {user.email}</p>
      <p>Profilen bruker Google-kontoen din. Jaktgarderobe, jakter, felte dyr, bilder, jegervenner og rewards er knyttet til denne brukeren.</p>
      <p className="muted-text">Delte felte dyr vises bare for godkjente jegervenner.</p>
    </div>
  );
}
