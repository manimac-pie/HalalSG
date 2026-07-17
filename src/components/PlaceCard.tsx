import type { Place } from '../data/schema';
import type { OpenStatus } from '../lib/openNow';
import { formatDistance } from '../lib/distance';
import { CertBadge, OpenBadge } from './Badges';

interface Props {
  place: Place;
  openStatus: OpenStatus;
  distanceKm?: number;
  onSelect: (place: Place) => void;
}

export function PlaceCard({ place, openStatus, distanceKm, onSelect }: Props) {
  return (
    <button type="button" className="place-card" onClick={() => onSelect(place)}>
      <div className="place-card-top">
        <h3>{place.name}</h3>
        {distanceKm !== undefined && <span className="distance">{formatDistance(distanceKm)}</span>}
      </div>
      <p className="place-meta">
        {[place.area, place.priceRange, place.cuisine.length ? place.cuisine.join(', ') : place.category]
          .filter(Boolean)
          .join(' · ')}
      </p>
      <div className="badge-row">
        <OpenBadge status={openStatus} />
        <CertBadge status={place.status} />
      </div>
    </button>
  );
}
