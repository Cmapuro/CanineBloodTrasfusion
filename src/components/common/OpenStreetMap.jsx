import React from 'react'
import { CircleMarker, MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const clinicPin = L.divIcon({
  className: 'canine-map-pin',
  html: '<span></span>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -14],
})

export function OpenStreetMap({ latitude, longitude, title, address, className = 'h-56', draggable = false, onPositionChange }) {
  const coordinates = [Number(latitude), Number(longitude)]
  const hasCoordinates = coordinates.every(Number.isFinite)

  if (!hasCoordinates) {
    return (
      <div className={`${className} flex items-center justify-center bg-slate-100 px-6 text-center text-sm text-gray-500`}>
        Map coordinates are not available.
      </div>
    )
  }

  return (
    <MapContainer center={coordinates} zoom={15} scrollWheelZoom className={`${className} w-full`}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {draggable ? (
        <Marker
          position={coordinates}
          icon={clinicPin}
          draggable
          eventHandlers={{
            dragend: (event) => {
              const position = event.target.getLatLng()
              onPositionChange?.({ latitude: position.lat, longitude: position.lng })
            },
          }}
        >
          <Popup>
            <strong>{title || 'Clinic location'}</strong>
            <br />Drag this pin to set the permanent location.
            {address && <><br />{address}</>}
          </Popup>
        </Marker>
      ) : (
        <CircleMarker center={coordinates} radius={10} pathOptions={{ color: '#991b1b', fillColor: '#e11d48', fillOpacity: 0.9, weight: 3 }}>
          <Popup><strong>{title || 'Clinic location'}</strong>{address && <><br />{address}</>}</Popup>
        </CircleMarker>
      )}
    </MapContainer>
  )
}

export default OpenStreetMap
