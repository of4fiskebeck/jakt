import { useEffect, useMemo, useRef, useState } from 'react';
import { appIcons } from '../icons';

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

function text(value) {
  if (value == null) return '';
  if (typeof value === 'string' || typeof value === 'number') return String(value).trim();
  return '';
}

function cleanDisplay(value) {
  return String(value || '')
    .replace(/\[object Object\]/g, '')
    .replace(/,+/g, ',')
    .replace(/\s*,\s*/g, ', ')
    .replace(/\s*·\s*/g, ' · ')
    .replace(/\s+/g, ' ')
    .replace(/^[-,·\s]+|[-,·\s]+$/g, '')
    .trim();
}

function firstText(...values) {
  for (const value of values) {
    const direct = text(value);
    if (direct) return cleanDisplay(direct);

    if (Array.isArray(value)) {
      for (const item of value) {
        const fromArray = firstText(
          item?.skrivemåte,
          item?.skrivemate,
          item?.navnetekst,
          item?.stedsnavn,
          item?.navn,
          item?.tekst,
          item?.value
        );
        if (fromArray) return fromArray;
      }
    }

    if (value && typeof value === 'object') {
      const fromObject = firstText(
        value.skrivemåte,
        value.skrivemate,
        value.navnetekst,
        value.stedsnavn,
        value.navn,
        value.tekst,
        value.value,
        value.kommunenavn,
        value.fylkesnavn
      );
      if (fromObject) return fromObject;
    }
  }
  return '';
}

function unique(values) {
  return [...new Set(values.map(cleanDisplay).filter(Boolean))];
}

function getKartverketPoint(item) {
  const point = item.representasjonspunkt || item.posisjon || item.location || item.punkt || {};
  const lat = point.nord ?? point.lat ?? point.latitude ?? point.y;
  const lng = point['øst'] ?? point.ost ?? point.lon ?? point.lng ?? point.longitude ?? point.x;
  return { lat: toCoordinate(lat), lng: toCoordinate(lng) };
}

function extractMunicipality(item) {
  if (Array.isArray(item.kommuner)) {
    return unique(item.kommuner.map((k) => firstText(k.kommunenavn, k.navn, k)));
  }
  return unique([firstText(item.kommune, item.kommunenavn)]);
}

function extractCounty(item) {
  if (Array.isArray(item.fylker)) {
    return unique(item.fylker.map((f) => firstText(f.fylkesnavn, f.navn, f)));
  }
  return unique([firstText(item.fylke, item.fylkesnavn)]);
}

function formatKartverketResult(item, fallback) {
  const point = getKartverketPoint(item);
  const title = cleanDisplay(firstText(
    item.skrivemåte,
    item.skrivemate,
    item.stedsnavn,
    item.navn,
    item.navnetekst
  )) || fallback;

  const type = firstText(item.navneobjekttype, item.objekttype, item.type);
  const municipalities = extractMunicipality(item);
  const counties = extractCounty(item);
  const subtitle = unique([type, ...municipalities, ...counties]).slice(0, 3).join(' · ');

  return {
    id: String(item.stedsnummer || item.skrivemåteId || item.skrivemateId || `${title}-${point.lat}-${point.lng}`),
    title: cleanDisplay(title) || fallback,
    subtitle: cleanDisplay(subtitle),
    label: cleanDisplay([title, ...municipalities, ...counties].filter(Boolean).join(', ')) || fallback,
    lat: point.lat,
    lng: point.lng,
    source: 'Kartverket'
  };
}

function formatOsmResult(item) {
  const full = cleanDisplay(item.display_name);
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
    source: 'Søk'
  };
}

function dedupeResults(results) {
  const seen = new Set();
  return results.filter((result) => {
    if (!result.lat || !result.lng || !result.title) return false;
    if (String(result.title).includes('[object Object]')) return false;
    const key = `${result.title.toLowerCase()}-${Number(result.lat).toFixed(3)}-${Number(result.lng).toFixed(3)}`;
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
            'Topografisk': topo,
            'Gråtone': grey,
            'Turkart': raster,
            'OpenStreetMap': osm
          },
          undefined,
          { collapsed: true, position: 'topright' }
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

  async function searchOsm(textValue) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=4&countrycodes=no&q=${encodeURIComponent(textValue)}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('OpenStreetMap-søk feilet');
    const json = await response.json();
    return dedupeResults(json.map(formatOsmResult)).slice(0, 4);
  }

  async function searchKartverket(textValue) {
    const url = `https://ws.geonorge.no/stedsnavn/v1/sted?sok=${encodeURIComponent(textValue)}&fuzzy=true&treffPerSide=6`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Kartverket-søk feilet');
    const json = await response.json();
    const items = Array.isArray(json.navn) ? json.navn : Array.isArray(json.steder) ? json.steder : [];
    return dedupeResults(items.map((item) => formatKartverketResult(item, textValue))).slice(0, 4);
  }

  async function searchPlace() {
    const query = searchText.trim();
    if (!query || searching) return;

    setSearching(true);
    setResults([]);
    setSearchError('');
    setSelectedResultId('');

    try {
      let mapped = await searchOsm(query);
      if (!mapped.length) mapped = await searchKartverket(query);
      setResults(mapped);
      if (!mapped.length) setSearchError('Fant ingen steder. Prøv et mer presist stedsnavn.');
    } catch {
      try {
        const mapped = await searchKartverket(query);
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
        <div className="section-title compact map-title-icon">
          <span><img src={appIcons.map} alt="" /></span>
          <div>
            <h3>Kart og jaktsted</h3>
            <p className="muted-text">Søk etter sted, bruk egen posisjon eller klikk i kartet for å sette nøyaktig jaktsted.</p>
          </div>
        </div>
        <span className="map-version">Kartverket topo · søk v6</span>
      </div>

      <div className="map-search-v6">
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
        <button type="button" className="map-search-button-v6" disabled={searching} onClick={searchPlace}>
          {searching ? 'Søker…' : 'Søk'}
        </button>
      </div>

      {searchError && <div className="notice error">{searchError}</div>}
      {results.length > 0 && (
        <div className="map-results-v6" aria-label="Søkeresultater">
          <div className="map-results-heading-v6">Velg sted</div>
          {results.map((result) => (
            <button
              type="button"
              className={`map-result-v6 ${selectedResultId === result.id ? 'selected' : ''}`}
              key={result.id}
              onClick={() => chooseResult(result)}
            >
              <span className="map-result-pin-v6">⌖</span>
              <span className="map-result-text-v6">
                <strong>{cleanDisplay(result.title)}</strong>
                {result.subtitle && <small>{cleanDisplay(result.subtitle)}</small>}
              </span>
              <span className="map-result-action-v6">Velg</span>
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
