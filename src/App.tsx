import { useEffect, useMemo, useState } from 'react';
import type { Place } from './data/schema';
import { placesProvider } from './data/provider';
import { getOpenStatus, nowInSingapore } from './lib/openNow';
import { haversineKm, type LatLng } from './lib/distance';
import { FilterBar, type Filters } from './components/FilterBar';
import { DetailSheet } from './components/DetailSheet';
import { ListView } from './views/ListView';
import { MapView } from './views/MapView';
import { REPO_URL } from './config';

type View = 'list' | 'map';

export default function App() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [filters, setFilters] = useState<Filters>({
    query: '',
    openNow: false,
    status: 'all',
    cuisine: 'all',
  });
  const [view, setView] = useState<View>('list');
  const [now, setNow] = useState(() => nowInSingapore());
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Place | null>(null);

  useEffect(() => {
    placesProvider.getPlaces().then(setPlaces);
  }, []);

  // Keep open/closed status fresh while the app stays open
  useEffect(() => {
    const timer = setInterval(() => setNow(nowInSingapore()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const cuisines = useMemo(
    () => [...new Set(places.flatMap((p) => p.cuisine))].sort(),
    [places],
  );

  const distances = useMemo(() => {
    if (!userLocation) return undefined;
    return new Map(places.map((p) => [p.id, haversineKm(userLocation, p)]));
  }, [places, userLocation]);

  const visible = useMemo(() => {
    const q = filters.query.trim().toLowerCase();
    const result = places.filter((place) => {
      if (q && !`${place.name} ${place.area} ${place.address}`.toLowerCase().includes(q)) {
        return false;
      }
      if (filters.status !== 'all' && place.status !== filters.status) return false;
      if (filters.cuisine !== 'all' && !place.cuisine.includes(filters.cuisine)) return false;
      if (filters.openNow) {
        const state = getOpenStatus(place.hours, now).state;
        if (state !== 'open' && state !== 'closing-soon') return false;
      }
      return true;
    });
    result.sort((a, b) => {
      if (distances) return distances.get(a.id)! - distances.get(b.id)!;
      // curated places (with hours, notes, cuisine) lead; MUIS bulk imports follow
      if (!!a.source !== !!b.source) return a.source ? 1 : -1;
      return a.name.localeCompare(b.name);
    });
    return result;
  }, [places, filters, now, distances]);

  const requestLocation = () => {
    if (userLocation) {
      setUserLocation(null); // toggle off
      return;
    }
    if (!navigator.geolocation) {
      setLocationError('Location is not supported on this device.');
      return;
    }
    setLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setLocationError('Could not get your location — sorting alphabetically instead.');
        setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
    );
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>
          Halal<span className="accent">SG</span>
        </h1>
        <p className="tagline">Halal &amp; Muslim-owned food in Singapore</p>
      </header>

      <FilterBar
        filters={filters}
        cuisines={cuisines}
        onChange={setFilters}
        onNearMe={requestLocation}
        locating={locating}
        hasLocation={!!userLocation}
      />

      {locationError && <p className="location-error">{locationError}</p>}

      <main className="content">
        {view === 'list' ? (
          <ListView places={visible} now={now} distances={distances} onSelect={setSelected} />
        ) : (
          <MapView places={visible} now={now} userLocation={userLocation} onSelect={setSelected} />
        )}
      </main>

      <footer className="app-footer">
        <p>
          {visible.length} of {places.length} places · community-maintained, hours may vary ·{' '}
          <a href={REPO_URL} target="_blank" rel="noreferrer">
            contribute on GitHub
          </a>
        </p>
      </footer>

      <nav className="tab-bar" aria-label="View switcher">
        <button
          type="button"
          className={view === 'list' ? 'active' : ''}
          onClick={() => setView('list')}
        >
          ☰ List
        </button>
        <button
          type="button"
          className={view === 'map' ? 'active' : ''}
          onClick={() => setView('map')}
        >
          🗺 Map
        </button>
      </nav>

      {selected && (
        <DetailSheet
          place={selected}
          now={now}
          distanceKm={distances?.get(selected.id)}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
