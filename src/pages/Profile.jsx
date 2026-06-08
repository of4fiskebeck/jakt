import PageHeading from '../components/PageHeading';
import { appIcons } from '../icons';

export default function Profile({ user }) {
  return (
    <div>
      <PageHeading icon={appIcons.profile} eyebrow="Profil" title="Jegerprofil">Google-profil, brukerdata og deling i Jegerapp.</PageHeading>
      <div className="card profile-card profile-card-branded">
        {user.photoURL && <img src={user.photoURL} alt="Profil" className="profile-photo" />}
        <img className="profile-app-icon" src={appIcons.profile} alt="" />
        <p><strong>Navn:</strong> {user.displayName}</p>
        <p><strong>E-post:</strong> {user.email}</p>
        <p>Profilen bruker Google-kontoen din. Jaktgarderobe, jakter, felte dyr, bilder, jegervenner og rewards er knyttet til denne brukeren.</p>
        <p className="muted-text">Delte felte dyr vises bare for godkjente jegervenner.</p>
      </div>
    </div>
  );
}
