import React, { useState } from 'react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Bookmark } from 'lucide-react';

const GMAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyBx4RH4XvtQWTRfIw4EW-g1VzwEAihe628';

export function ListingImageWithFallback({ listing, className = '' }) {
  const [photoError, setPhotoError] = useState(false);
  const [streetViewError, setStreetViewError] = useState(false);

  const hasPhoto = listing.photos && listing.photos.length > 0 && listing.photos[0];

  // Guard: only build the Street View URL if we have real numeric coordinates.
  // A null/undefined lat or lng would produce ?location=null,null which Google
  // returns as a valid gray "no imagery" thumbnail — visually misleading.
  const lat = listing.latitude;
  const lng = listing.longitude;
  const hasLatLng =
    lat != null && lng != null &&
    typeof lat === 'number' && typeof lng === 'number' &&
    !isNaN(lat) && !isNaN(lng) &&
    lat !== 0 && lng !== 0;

  const streetViewUrl = hasLatLng
    ? `https://maps.googleapis.com/maps/api/streetview?size=800x400&location=${lat},${lng}&key=${GMAPS_KEY}`
    : null;

  if (hasPhoto && !photoError) {
    return (
      <ImageWithFallback
        src={listing.photos[0]}
        alt={listing.address}
        className={`w-full h-full object-cover ${className}`}
        onError={() => setPhotoError(true)}
      />
    );
  }

  if (streetViewUrl && !streetViewError) {
    return (
      <img
        src={streetViewUrl}
        alt={`Street view of ${listing.address}`}
        className={`w-full h-full object-cover ${className}`}
        onError={() => setStreetViewError(true)}
      />
    );
  }

  // Last resort: placeholder icon
  return (
    <div className={`w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 ${className}`}>
      <Bookmark className="w-8 h-8 text-gray-300" />
    </div>
  );
}
