import React, { useState } from 'react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Bookmark } from 'lucide-react';

export function ListingImageWithFallback({ listing, className = '' }) {
  const [photoError, setPhotoError] = useState(false);
  const [streetViewError, setStreetViewError] = useState(false);

  const hasPhoto = listing.photos && listing.photos.length > 0 && listing.photos[0];
  const hasLatLng = listing.latitude && listing.longitude;
  const streetViewUrl = hasLatLng
    ? `https://maps.googleapis.com/maps/api/streetview?size=800x400&location=${listing.latitude},${listing.longitude}&key=AIzaSyBx4RH4XvtQWTRfIw4EW-g1VzwEAihe628`
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

  // Last resort: bookmark icon
  return (
    <div className={`w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 ${className}`}>
      <Bookmark className="w-8 h-8 text-gray-300" />
    </div>
  );
}