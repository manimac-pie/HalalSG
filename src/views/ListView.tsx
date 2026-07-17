import { useEffect, useState } from 'react';
import type { Place } from '../data/schema';
import type { SgTime } from '../lib/openNow';
import { getOpenStatus } from '../lib/openNow';
import { PlaceCard } from '../components/PlaceCard';
import { AdSlot } from '../components/AdSlot';

const PAGE_SIZE = 60;

interface Props {
  places: Place[];
  now: SgTime;
  distances?: Map<string, number>;
  onSelect: (place: Place) => void;
}

export function ListView({ places, now, distances, onSelect }: Props) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // reset pagination whenever the filtered result set changes
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [places]);

  if (places.length === 0) {
    return <p className="empty-state">No places match your filters right now.</p>;
  }
  return (
    <div className="place-list">
      <AdSlot slot="list" />
      {places.slice(0, visibleCount).map((place) => (
        <PlaceCard
          key={place.id}
          place={place}
          openStatus={getOpenStatus(place.hours, now)}
          distanceKm={distances?.get(place.id)}
          onSelect={onSelect}
        />
      ))}
      {places.length > visibleCount && (
        <button
          type="button"
          className="show-more"
          onClick={() => setVisibleCount((c) => c + PAGE_SIZE * 2)}
        >
          Show more ({places.length - visibleCount} remaining)
        </button>
      )}
    </div>
  );
}
