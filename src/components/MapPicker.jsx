import { useEffect, useMemo, useRef, useState } from 'react';

const NORWAY_CENTER = [63.4, 10.4];
const DEFAULT_ZOOM = 5;
const KARTVERKET_TOPO = 'https://cache.kartverket.no/v1/wmts/1.0.0/topo/default/webmercator/{z}/{y}/{x}.png';
const KARTVERKET_GREY = 'https://cache.kartverket.no/v1/wmts/1.0.0/topograatone/default/webmercator/{z}/{y}/{x}.png';
const KARTVERKET_RASTER = 'https://cache.kartverket.no/v1/wmts/1.0.0/toporaster/default/webmercator/{z}/{y}/{x}.png';
const OSM = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

function toCoordinate(value) {
  const parsed = Number(String(value ?? '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

function unique(values) {
  return [...new Set(values.map((v) => String(v).trim()).filter(Boolean))];
}

function cleanText(value) {
  if (value == null) return '';
  if (typeof value === 'string' || typeof value === 'number') return String(value).trim();
  if (Array.isArray(value)) return unique(value.map(cleanText)).join(', ');
  if (typeof value === 'object') {
    const preferredKeys = [
      'navnetekst',
      'skrivemåte',
      'skrivemate',
      'stedsnavn',
      'navn',
      'kommunenavn',
      'fylkesnavn',
      'norsk',
      'nor',
      'nb',
      'tekst',
      'verdi',
      'value'
    ];

    for (const key of preferredKeys) {
      const text = cleanText(value[key]);
      if (text) return text;
    }

    const firstReadable = Object.values(value)
      .map(cleanText)
      .find((text) => text && text !== '[object Object]');
    return firstReadable || '';
  }
  return '';
}

function compactName(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .replace(/\s*,\s*/g, ', ')
    .replace(/\s*·\s*/g, ' · ')
    .replace(/\[object Object\]/g, '')
    .trim();
}

function getKartverketPoint(item) {
  const point = item.representasjonspunkt || item.posisjon || item.location || item.punkt || {};
  const lat = point.nord ?? point.lat ?? point.latitude ?? point.y;
  const lng = point['øst'] ?? point.ost ?? point.lon ?? point.lng ?? point.longitude ?? point.x;
  return { lat: toCoordinate(lat), lng: toCoordinate(lng) };
}

function getNameFromNameArray(item) {
  if (!Array.isArray(item.navn)) return '';
  const preferred = item.navn.find((n) => n.språk === 'nor' || n.sprak === 'nor' || n.språk === 'nob' || n.sprak === 'nob') || item.navn[0];
  return cleanText(preferred);
}

function formatKartverketResult(item, fallback) {
  const point = getKartverketPoint(item);
  const primary = compactName(
    cleanText(item.skrivemåte) ||
    cleanText(item.skrivemate) ||
    getNameFromNameArray(item) ||
    cleanText(item.stedsnavn) ||
    cleanText(item.navn) ||
    fallback
  );

  const type = compactName(cleanText(item.navneobjekttype) || cleanText(item.objekttype) || cleanText(item.type));
  const municipalities = Array.isArray(item.kommuner) ? unique(item.kommuner.map(cleanText)) : [cleanText(item.kommune)].filter(Boolean);
  const counties = Array.isArray(item.fylker) ? unique(item.fylker.map(cleanText)) : [cleanText(item.fylke)].filter(Boolean);
  const areaParts = unique([...municipalities, ...counties].map(compactName));
  const subtitle = unique([type, ...areaParts].filter(Boolean)).join(' · ');

  const title = primary || fallback;
  const label = subtitle ? `${title}, ${subtitle}` : title;

  return {
    id: String(item.stedsnummer || item.skrivemåteId || item.skrivemateId || `${label}-${point.lat}-${point.lng}`),
    title,
    subtitle,
    label,
    lat: point.lat,
    lng: point.lng,
    source: 'Kartverket'
  };
}

function formatOsmResult(item) {
  const full = compactName(item.display_name);
  const parts = full.split(',').map((part) => part.trim()).filter(Boolean);
  const title = parts[0] || 'Ukjent sted';
  const subtitle = parts.slice(1, 4).join(' · ');
  return {
    id: String(item.place_id || `${full}-${item.lat}-${item.lon}`),
    title,
    subtitle,
    label: full,
    lat: toCoordinate(item.lat),
    lng: toCoordinate(item.lon),
    source: 'OpenStreetMap'
  };
}

function dedupeResults(results) {
  const seen = new Set();
  return results.filter((result) => {
    const key = `${result.title.toLowerCase()}-${Number(result.lat).toFixed(4)}-${Number(result.lng).toFixed(4)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
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
  const [selectedResultId, setSelectedResultId] = useState('');

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

        const topo = L.tileLayer(KARTVERKET_TOPO, { maxZoom: 18, attribution: '&copy; Kartverket' });
        const grey = L.tileLayer(KARTVERKET_GREY, { maxZoom: 18, attribution: '&copy; Kartverket' });
        const raster = L.tileLayer(KARTVERKET_RASTER, { maxZoom: 18, attribution: '&copy; Kartverket' });
        const osm = L.tileLayer(OSM, { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' });

        topo.on('tileerror', () => {
          if (!map.hasLayer(osm)) {
            setMapError('Kartverket-kartet kunne ikke laste akkurat nå. Appen viser OpenStreetMap som fallback.');
            osm.addTo(map);
          }
        });

        topo.addTo(map);
        L.control.layers(
          {
            'Kartverket topografisk': topo,
            'Kartverket gråtone': grey,
            'Kartverket turkart': raster,
            'OpenStreetMap': osm
          },
          undefined,
          { collapsed: false, position: 'topright' }
        ).addTo(map);

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
        setSelectedResultId('current-position');
        setResults([]);
      },
      () => alert('Kunne ikke hente posisjon. Skriv inn koordinater manuelt.')
    );
  }

  async function searchPlace() {
    const text = searchText.trim();
    if (!text || searching) return;

    setSearching(true);
    setResults([]);
    setSearchError('');
    setSelectedResultId('');

    try {
      const url = `https://ws.geonorge.no/stedsnavn/v1/sted?sok=${encodeURIComponent(text)}&fuzzy=true&treffPerSide=10`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Kartverket-søk feilet');
      const json = await response.json();
      const items = Array.isArray(json.navn) ? json.navn : Array.isArray(json.steder) ? json.steder : [];
      const mapped = dedupeResults(
        items
          .map((item) => formatKartverketResult(item, text))
          .filter((item) => item.lat && item.lng && item.title && !item.title.includes('[object Object]'))
      ).slice(0, 5);

      if (mapped.length) {
        setResults(mapped);
        return;
      }

      throw new Error('Fant ingen Kartverket-treff');
    } catch (error) {
      try {
        const fallbackUrl = `https://nominatim.openstreetmap.org/search?format=json&limit=5&countrycodes=no&q=${encodeURIComponent(text)}`;
        const response = await fetch(fallbackUrl);
        if (!response.ok) throw new Error('OpenStreetMap-søk feilet');
        const json = await response.json();
        const mapped = json.map(formatOsmResult).filter((item) => item.lat && item.lng).slice(0, 5);
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
    setSelectedResultId(result.id);
    setPoint(result.lat, result.lng, result.label || result.title);
    setResults([]);
  }

  return (
    <section className="card map-card">
      <div className="map-card-header">
        <div>
          <h3>Kart og jaktsted</h3>
          <p className="muted-text">Søk etter sted, bruk egen posisjon eller klikk i kartet for å sette nøyaktig jaktsted.</p>
        </div>
        <span className="map-version">Kartverket topografisk</span>
      </div>

      <div className="place-search">
        <label>
          Søk etter sted
          <input
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                searchPlace();
              }
            }}
            placeholder="Søk: Karasjok, Rendalen, Femundsmarka ..."
          />
        </label>
        <button type="button" className="search-button" disabled={searching} onClick={searchPlace}>
          {searching ? 'Søker…' : 'Søk sted'}
        </button>
      </div>

      {searchError && <div className="notice error">{searchError}</div>}
      {results.length > 0 && (
        <div className="search-results" aria-label="Søkeresultater">
          <div className="search-results-title">Velg riktig treff</div>
          {results.map((result) => (
            <button
              type="button"
              className={`search-result ${selectedResultId === result.id ? 'selected' : ''}`}
              key={result.id}
              onClick={() => chooseResult(result)}
            >
              <span className="search-result-main">
                <strong>{result.title}</strong>
                {result.subtitle && <small>{result.subtitle}</small>}
              </span>
              <span className="search-result-side">
                <em>{result.source}</em>
                <small>{Number(result.lat).toFixed(5)}, {Number(result.lng).toFixed(5)}</small>
              </span>
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
      <div className="action-row map-actions">
        <button type="button" className="secondary" onClick={useCurrentPosition}>Bruk min posisjon</button>
        <span className="map-hint">Dra markøren eller klikk i kartet for å finjustere punktet.</span>
      </div>

      {mapError && <div className="notice error">{mapError}</div>}
      <div className="leaflet-map" ref={mapEl} aria-label="Topografisk jaktkart" />
    </section>
  );
}
