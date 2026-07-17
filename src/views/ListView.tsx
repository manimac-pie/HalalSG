import type { Place } from '../data/schema';
import type { SgTime } from '../lib/openNow';
import { getOpenStatus } from '../lib/openNow';
import { PlaceCard } from '../components/PlaceCard';
import { AdSlot } from '../components/AdSlot';

interface Props {
  places: Place[];
  now: SgTime;
  distances?: Map<string, number>;
  onSelect: (place: Place) => void;
}

export function ListView({ places, now, distances, onSelect }: Props) {
  if (places.length === 0) {
    return <p className="empty-state">No places match your filters right now.</p>;
  }
  return (
    <div className="place-list">
      <AdSlot slot="list" />
      {places.map((place) => (
        <PlaceCard
          key={place.id}
          place={place}
          openStatus={getOpenStatus(place.hours, now)}
          distanceKm={distances?.get(place.id)}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
