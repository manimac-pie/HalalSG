import type { Place } from './schema';
import placesJson from './places.json';

/**
 * Data source abstraction. v1 ships a curated JSON dataset bundled with the
 * app; a future provider (e.g. Google Places) can implement the same
 * interface to supply live hours/photos without touching the UI.
 */
export interface PlacesProvider {
  getPlaces(): Promise<Place[]>;
}

export const staticJsonProvider: PlacesProvider = {
  async getPlaces() {
    return placesJson as Place[];
  },
};

export const placesProvider: PlacesProvider = staticJsonProvider;
