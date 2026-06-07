import { useEffect, useMemo, useRef, useState } from 'react';

const NORWAY_CENTER = [63.4, 10.4];
const DEFAULT_ZOOM = 5;
const KARTVERKET_TOPO = 'https://cache.kartverket.no/v1/wmts/1.0.0/topo/default/webmercator/{z}/{y}/{x}.png';
const KARTVERKET_GREY = 'https://cache.kartverket.no/v1/wmts/1.0.0/topograatone/default/webmercator/{z}/{y}/{x}.png';
const KARTVERKET_RASTER = 'https://cache.kartverket.no/v1/wmts/1.0.0/toporaster/default/webmercator/{z}/{y}/{x}.png';
const OSM = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

function toCoordinate(value) {
  const parsed = Number(String(value).replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

function getKartverketPoint(item) {
  const point = item.representasjonspunkt || item.posisjon || item.location || {};
  const lat = point.nord ?? point.lat ?? point.latitude ?? point.y;
  const lng = point['øst'] ?? point.ost ?? point.lon ?? point.lng ?? point.longitude ?? point.x;
  return { lat: toCoordinate(lat), lng: toCoordinate(lng) };
}

function getKartverketName(item, fallback) {
  const nameObj = Array.isArray(item.navn)
    ? item.navn.find((n) => n.språk === 'nor' || n.sprak === 'nor') || item.navn[0]
    : null;
  const name = item.stedsnavn || nameObj?.navnetekst || item.navn?.navnetekst || fallback;
  const municipality = Array.isArray(item.kommuner)
    ? item.kommuner.map((k) => k.kommunenavn || k.navn).filter(Boolean).join(', ')
    : '';
  const county = Array.isArray(item.fylker)
    ? item.fylker.map((f) => f.fylkesnavn || f.navn).filter(Boolean).join(', ')
    : '';
  return [name, municipality, county].filter(Boolean).join(' · ');
}

function loadLeaflet() {
  if (window.L) return Promise.resolve(window.L);

  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector('script[data-leaflet="true"]');
    const existingCss = document.querySelector('link[data-leaflet="true"]');

    if (!existingCss) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.dataset.leaflet = 'true';
      document.head.appendChild(link);
    }

    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(window.L));
      existingScript.addEventListener('error', reject);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.dataset.leaflet = 'true';
    script.async = true;
    script.onload = () => resolve(window.L);
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

export default function MapPicker({ latitude, longitude, setLatitude, setLongitude, locationName, setLocationName }) {
  const mapEl = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState('');
  const [searchText, setSearchText] = useState(locationName || '');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState([]);
  const [searchError, setSearchError] = useState('');

  const latNumber = useMemo(() => toCoordinate(latitude), [latitude]);
  const lngNumber = useMemo(() => toCoordinate(longitude), [longitude]);

  function setPoint(lat, lng, name) {
    const nextLat = Number(lat).toFixed(6);
    const nextLng = Number(lng).toFixed(6);
    setLatitude(nextLat);
    setLongitude(nextLng);
    if (name) {
      setLocationName(name);
      setSearchText(name);
    }
  }

  useEffect(() => {
    let cancelled = false;

    loadLeaflet()
      .then((L) => {
        if (cancelled || !mapEl.current || mapRef.current) return;

        const start = latNumber && lngNumber ? [latNumber, lngNumber] : NORWAY_CENTER;
        const zoom = latNumber && lngNumber ? 12 : DEFAULT_ZOOM;
        const map = L.map(mapEl.current, { scrollWheelZoom: true }).setView(start, zoom);

        const topo = L.tileLayer(KARTVERKET_TOPO, {
          maxZoom: 18,
          attribution: '&copy; Kartverket'
        });
        const grey = L.tileLayer(KARTVERKET_GREY, {
          maxZoom: 18,
          attribution: '&copy; Kartverket'
        });
        const raster = L.tileLayer(KARTVERKET_RASTER, {
          maxZoom: 18,
          attribution: '&copy; Kartverket'
        });
        const osm = L.tileLayer(OSM, {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap contributors'
        });

        // Kartverket endret kartcache i 2025. Bruk cache.kartverket.no, ikke det gamle opencache.statkart.no.
        topo.on('tileerror', () => {
          if (!map.hasLayer(osm)) {
            setMapError('Kartverket-kartet kunne ikke laste akkurat nå. Appen viser OpenStreetMap som fallback.');
            osm.addTo(map);
          }
        });

        topo.addTo(map);
        L.control.layers({
          'Topografisk kart': topo,
          'Topografisk gråtone': grey,
          'Turkart / raster': raster,
          'OpenStreetMap': osm
        }).addTo(map);

        map.on('click', (event) => {
          setPoint(event.latlng.lat, event.latlng.lng);
        });

        mapRef.current = map;
        setMapReady(true);
      })
      .catch(() => {
        if (!cancelled) setMapError('Kunne ikke laste interaktivt kart. Sjekk nettverk eller prøv igjen.');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!mapReady || !mapRef.current || !window.L) return;
    if (!latNumber || !lngNumber) return;

    const L = window.L;
    const point = [latNumber, lngNumber];
    if (!markerRef.current) {
      markerRef.current = L.marker(point, { draggable: true }).addTo(mapRef.current);
      markerRef.current.on('dragend', (event) => {
        const next = event.target.getLatLng();
        setPoint(next.lat, next.lng);
      });
    } else {
      markerRef.current.setLatLng(point);
    }
    mapRef.current.setView(point, Math.max(mapRef.current.getZoom(), 12));
  }, [mapReady, latNumber, lngNumber]);

  function useCurrentPosition() {
    if (!navigator.geolocation) {
      alert('Nettleseren støtter ikke posisjonering.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setPoint(position.coords.latitude, position.coords.longitude, 'Min posisjon');
      },
      () => alert('Kunne ikke hente posisjon. Skriv inn koordinater manuelt.')
    );
  }

  async function searchPlace(event) {
    event.preventDefault();
    const text = searchText.trim();
    if (!text) return;

    setSearching(true);
    setResults([]);
    setSearchError('');

    try {
      const url = `https://ws.geonorge.no/stedsnavn/v1/sted?sok=${encodeURIComponent(text)}&fuzzy=true&treffPerSide=8`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Kartverket-søk feilet');
      const json = await response.json();
      const items = Array.isArray(json.navn) ? json.navn : Array.isArray(json.steder) ? json.steder : [];
      const mapped = items
        .map((item) => {
          const point = getKartverketPoint(item);
          return {
            id: item.stedsnummer || item.skrivemåteId || `${getKartverketName(item, text)}-${point.lat}-${point.lng}`,
            name: getKartverketName(item, text),
            lat: point.lat,
            lng: point.lng,
            source: 'Kartverket'
          };
        })
        .filter((item) => item.lat && item.lng);

      if (mapped.length) {
        setResults(mapped);
        return;
      }

      throw new Error('Fant ingen Kartverket-treff');
    } catch (error) {
      try {
        const fallbackUrl = `https://nominatim.openstreetmap.org/search?format=json&limit=8&countrycodes=no&q=${encodeURIComponent(text)}`;
        const response = await fetch(fallbackUrl);
        if (!response.ok) throw new Error('OpenStreetMap-søk feilet');
        const json = await response.json();
        const mapped = json.map((item) => ({
          id: item.place_id,
          name: item.display_name,
          lat: toCoordinate(item.lat),
          lng: toCoordinate(item.lon),
          source: 'OpenStreetMap'
        })).filter((item) => item.lat && item.lng);
        setResults(mapped);
        if (!mapped.length) setSearchError('Fant ingen steder. Prøv et mer presist stedsnavn.');
      } catch {
        setSearchError('Kunne ikke søke etter sted akkurat nå. Skriv koordinater manuelt eller bruk min posisjon.');
      }
    } finally {
      setSearching(false);
    }
  }

  function chooseResult(result) {
    setPoint(result.lat, result.lng, result.name);
    setResults([]);
  }

  return (
    <section className="card map-card">
      <h3>Kart og jaktsted</h3>
      <div className="map-version">Kartlag: Kartverket topografisk · versjon 3</div>
      <p className="muted-text">Søk etter sted, bruk egen posisjon eller klikk i kartet for å sette nøyaktig jaktsted.</p>

      <form className="place-search" onSubmit={searchPlace}>
        <label>
          Søk etter sted
          <input value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder="F.eks. Rendalen, Femundsmarka eller Trysil" />
        </label>
        <button type="submit" disabled={searching}>{searching ? 'Søker...' : 'Søk sted'}</button>
      </form>

      {searchError && <div className="notice error">{searchError}</div>}
      {results.length > 0 && (
        <div className="search-results">
          {results.map((result) => (
            <button type="button" className="search-result" key={result.id} onClick={() => chooseResult(result)}>
              <span>{result.name}</span>
              <small>{result.source} · {Number(result.lat).toFixed(5)}, {Number(result.lng).toFixed(5)}</small>
            </button>
          ))}
        </div>
      )}

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
      <div className="action-row">
        <button type="button" className="secondary" onClick={useCurrentPosition}>Bruk min posisjon</button>
        <span className="map-hint">Dra markøren eller klikk i kartet for å finjustere punktet.</span>
      </div>

      {mapError && <div className="notice error">{mapError}</div>}
      <div className="leaflet-map" ref={mapEl} aria-label="Topografisk jaktkart" />
    </section>
  );
}
