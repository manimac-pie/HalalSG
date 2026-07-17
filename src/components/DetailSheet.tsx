import type { Place } from '../data/schema';
import { DAY_KEYS } from '../data/schema';
import type { SgTime } from '../lib/openNow';
import { formatDayRanges, getOpenStatus } from '../lib/openNow';
import { formatDistance } from '../lib/distance';
import { CertBadge, OpenBadge } from './Badges';
import { AdSlot } from './AdSlot';
import { Avatar } from './Avatar';
import { REPO_URL } from '../config';

const DAY_LABELS: Record<string, string> = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
};

interface Props {
  place: Place;
  now: SgTime;
  distanceKm?: number;
  onClose: () => void;
}

export function DetailSheet({ place, now, distanceKm, onClose }: Props) {
  const status = getOpenStatus(place.hours, now);
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`;

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div
        className="sheet"
        role="dialog"
        aria-label={place.name}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-handle" />
        <div className="sheet-header">
          <Avatar place={place} size={48} />
          <h2>{place.name}</h2>
          <button type="button" className="sheet-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="badge-row">
          <OpenBadge status={status} />
          <CertBadge status={place.status} />
        </div>
        <p className="place-meta">
          {[place.area, place.priceRange, place.cuisine.length ? place.cuisine.join(', ') : place.category]
            .filter(Boolean)
            .join(' · ')}
          {distanceKm !== undefined && (
            <span className="no-caps"> · {formatDistance(distanceKm)} away</span>
          )}
        </p>
        {place.notes && <p className="notes">{place.notes}</p>}
        <p className="address">{place.address}</p>

        <div className="actions">
          <a className="action-btn" href={directions} target="_blank" rel="noreferrer">
            Directions
          </a>
          {place.phone && (
            <a className="action-btn" href={`tel:${place.phone}`}>
              Call
            </a>
          )}
          {place.website && (
            <a className="action-btn" href={place.website} target="_blank" rel="noreferrer">
              Website
            </a>
          )}
        </div>

        {place.hours ? (
          <table className="hours-table">
            <tbody>
              {DAY_KEYS.map((day) => (
                <tr key={day} className={day === now.day ? 'today' : ''}>
                  <td>{DAY_LABELS[day]}</td>
                  <td>{formatDayRanges(place.hours!, day)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="hours-missing">
            Opening hours aren't available for this listing yet — it comes from the MUIS certified
            directory, which doesn't publish hours.
          </p>
        )}
        {place.certNumber && (
          <p className="cert-number">MUIS certificate: {place.certNumber}</p>
        )}

        <AdSlot slot="detail" />
        <p className="disclaimer">
          Hours and halal status are community-maintained and may be outdated — always check on
          site. <a href={`${REPO_URL}/issues`}>Report an issue</a>.
        </p>
      </div>
    </div>
  );
}
