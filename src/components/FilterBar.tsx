import type { HalalStatus } from '../data/schema';

export interface Filters {
  query: string;
  openNow: boolean;
  status: HalalStatus | 'all';
  cuisine: string | 'all';
}

interface Props {
  filters: Filters;
  cuisines: string[];
  onChange: (filters: Filters) => void;
  onNearMe: () => void;
  locating: boolean;
  hasLocation: boolean;
}

export function FilterBar({ filters, cuisines, onChange, onNearMe, locating, hasLocation }: Props) {
  const set = (patch: Partial<Filters>) => onChange({ ...filters, ...patch });

  return (
    <div className="filter-bar">
      <div className="search-row">
        <input
          type="search"
          placeholder="Search name or area…"
          value={filters.query}
          onChange={(e) => set({ query: e.target.value })}
          aria-label="Search places"
        />
        <button
          type="button"
          className={`chip near-me ${hasLocation ? 'active' : ''}`}
          onClick={onNearMe}
          disabled={locating}
        >
          {locating ? 'Locating…' : hasLocation ? '📍 Near me ✓' : '📍 Near me'}
        </button>
      </div>
      <div className="chip-row">
        <button
          type="button"
          className={`chip ${filters.openNow ? 'active' : ''}`}
          onClick={() => set({ openNow: !filters.openNow })}
        >
          Open now
        </button>
        <button
          type="button"
          className={`chip ${filters.status === 'muis-certified' ? 'active' : ''}`}
          onClick={() =>
            set({ status: filters.status === 'muis-certified' ? 'all' : 'muis-certified' })
          }
        >
          MUIS certified
        </button>
        <button
          type="button"
          className={`chip ${filters.status === 'muslim-owned' ? 'active' : ''}`}
          onClick={() =>
            set({ status: filters.status === 'muslim-owned' ? 'all' : 'muslim-owned' })
          }
        >
          Muslim owned
        </button>
        <select
          className={`chip chip-select ${filters.cuisine !== 'all' ? 'active' : ''}`}
          value={filters.cuisine}
          onChange={(e) => set({ cuisine: e.target.value })}
          aria-label="Filter by cuisine"
        >
          <option value="all">All cuisines</option>
          {cuisines.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
