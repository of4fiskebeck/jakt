export default function MapPicker({ latitude, longitude, setLatitude, setLongitude, locationName, setLocationName }) {
  const hasPosition = latitude && longitude;
  const mapUrl = hasPosition
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${Number(longitude) - 0.05}%2C${Number(latitude) - 0.05}%2C${Number(longitude) + 0.05}%2C${Number(latitude) + 0.05}&layer=mapnik&marker=${latitude}%2C${longitude}`
    : 'https://www.openstreetmap.org/export/embed.html?bbox=4.0%2C57.5%2C31.5%2C71.5&layer=mapnik';

  function useCurrentPosition() {
    if (!navigator.geolocation) {
      alert('Nettleseren støtter ikke posisjonering.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toFixed(6));
        setLongitude(position.coords.longitude.toFixed(6));
      },
      () => alert('Kunne ikke hente posisjon. Skriv inn koordinater manuelt.')
    );
  }

  return (
    <section className="card">
      <h3>Kart og jaktsted</h3>
      <label>
        Stedsnavn
        <input value={locationName} onChange={(e) => setLocationName(e.target.value)} placeholder="F.eks. Rendalen" />
      </label>
      <div className="grid two">
        <label>
          Latitude
          <input value={latitude} onChange={(e) => setLatitude(e.target.value)} placeholder="61.890000" />
        </label>
        <label>
          Longitude
          <input value={longitude} onChange={(e) => setLongitude(e.target.value)} placeholder="11.077000" />
        </label>
      </div>
      <button type="button" className="secondary" onClick={useCurrentPosition}>Bruk min posisjon</button>
      <div className="map-frame">
        <iframe title="Jaktkart" src={mapUrl} loading="lazy" />
      </div>
    </section>
  );
}
