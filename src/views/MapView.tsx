import { CircleMarker, MapContainer, Marker, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Place } from '../data/schema';
import type { SgTime } from '../lib/openNow';
import { getOpenStatus, type OpenState } from '../lib/openNow';
import type { LatLng } from '../lib/distance';

const SG_CENTER: [number, number] = [1.335, 103.845];

// Canvas-rendered circle markers keep the map responsive with thousands of pins.
const PIN_COLORS: Record<OpenState, string> = {
  open: '#0d9c62',
  'closing-soon': '#e8940a',
  closed: '#b3443e',
  unknown: '#7d858d',
};

const userIcon = L.divIcon({
  className: '',
  html: '<span class="map-pin map-pin-user"></span>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

interface Props {
  places: Place[];
  now: SgTime;
  userLocation: LatLng | null;
  onSelect: (place: Place) => void;
}

export function MapView({ places, now, userLocation, onSelect }: Props) {
  return (
    <div className="map-wrap">
      <MapContainer
        center={SG_CENTER}
        zoom={11}
        minZoom={11}
        maxZoom={19}
        className="map"
        preferCanvas
      >
        <TileLayer
          url="https://www.onemap.gov.sg/maps/tiles/Default/{z}/{x}/{y}.png"
          attribution='<img src="https://www.onemap.gov.sg/web-assets/images/logo/om_logo.png" style="height:16px;width:16px;"/> <a href="https://www.onemap.gov.sg/" target="_blank" rel="noreferrer">OneMap</a> &copy; contributors | <a href="https://www.sla.gov.sg/" target="_blank" rel="noreferrer">Singapore Land Authority</a>'
        />
        {places.map((place) => {
          const state = getOpenStatus(place.hours, now).state;
          const curated = !place.source;
          return (
            <CircleMarker
              key={place.id}
              center={[place.lat, place.lng]}
              radius={curated ? 8 : 5}
              pathOptions={{
                color: '#ffffff',
                weight: 1.5,
                fillColor: PIN_COLORS[state],
                fillOpacity: curated ? 1 : 0.8,
              }}
              eventHandlers={{ click: () => onSelect(place) }}
            />
          );
        })}
        {userLocation && <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon} />}
      </MapContainer>
      <div className="map-legend">
        <span><i className="map-pin map-pin-open" /> Open</span>
        <span><i className="map-pin map-pin-soon" /> Closing</span>
        <span><i className="map-pin map-pin-closed" /> Closed</span>
        <span><i className="map-pin map-pin-unknown" /> Unknown</span>
      </div>
    </div>
  );
}
