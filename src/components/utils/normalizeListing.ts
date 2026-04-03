/**
 * Normalize any listing object from RentCast API (camelCase),
 * Supabase DB (snake_case), or saved listing_data_json blobs into the
 * consistent camelCase shape ListingDetailModal expects.
 */
export function normalizeListing(raw: any): any {
  if (!raw) return raw;

  const isAlreadyCamel =
    'formattedAddress' in raw ||
    'addressLine1' in raw ||
    'daysOnMarket' in raw ||
    'agentName' in raw ||
    'listingAgent' in raw ||
    'squareFootage' in raw;

  const photos = isAlreadyCamel
    ? (raw.photos ?? raw.photosJson ?? raw.photos_json ?? [])
    : (raw.photos_json ?? raw.photos ?? []);

  const history = isAlreadyCamel
    ? (raw.history ?? raw.historyJson ?? raw.history_json ?? null)
    : (raw.history_json ?? raw.history ?? null);

  // Resolve lat/lng from multiple shapes:
  // 1. Top-level numbers (standard RentCast / Dashboard path)
  // 2. Top-level strings (some stored blobs stringify coords)
  // 3. Nested location object: { location: { latitude, longitude } }
  // 4. Nested location object with lat/lng keys: { location: { lat, lng } }
  const rawLat =
    raw.latitude ??
    raw.location?.latitude ??
    raw.location?.lat ??
    raw.lat ??
    null;
  const rawLng =
    raw.longitude ??
    raw.location?.longitude ??
    raw.location?.lng ??
    raw.lng ??
    null;

  const latitude  = rawLat  != null ? Number(rawLat)  : null;
  const longitude = rawLng  != null ? Number(rawLng)  : null;

  // Treat 0,0 (null island) or NaN as missing coords
  const validLatitude  = latitude  != null && !isNaN(latitude)  && latitude  !== 0 ? latitude  : null;
  const validLongitude = longitude != null && !isNaN(longitude) && longitude !== 0 ? longitude : null;

  return {
    id: raw.id,

    address:
      raw.address ??
      raw.addressLine1 ??
      raw.address_line1 ??
      raw.streetAddress ??
      raw.street_address ??
      '',
    formattedAddress:
      raw.formattedAddress ??
      raw.formatted_address ??
      null,
    city:    raw.city    ?? null,
    state:   raw.state   ?? null,
    zip:     raw.zip ?? raw.zipCode ?? raw.zip_code ?? null,
    county:  raw.county  ?? null,
    stateFips:  raw.stateFips  ?? raw.state_fips  ?? null,
    countyFips: raw.countyFips ?? raw.county_fips ?? null,
    latitude:  validLatitude,
    longitude: validLongitude,

    price:            raw.price            ?? null,
    status:           raw.status           ?? null,
    listingType:      raw.listingType      ?? raw.listing_type       ?? null,
    listingTypeDetail:raw.listingTypeDetail?? raw.listing_type_detail?? null,
    mlsNumber:        raw.mlsNumber        ?? raw.mls_number         ?? null,
    mlsName:          raw.mlsName          ?? raw.mls_name           ?? null,
    priceDrop:        raw.priceDrop        ?? raw.priceReduced       ?? raw.price_reduced ?? false,
    listedDate:       raw.listedDate       ?? raw.listingDate        ?? raw.listed_date   ?? raw.listing_date ?? null,
    removedDate:      raw.removedDate      ?? raw.removed_date       ?? null,
    lastSeenDate:     raw.lastSeenDate     ?? raw.last_seen_date     ?? null,
    daysListed:       raw.daysListed       ?? raw.daysOnMarket       ?? raw.days_on_market ?? null,
    virtualTourUrl:   raw.virtualTourUrl   ?? raw.virtual_tour_url   ?? null,

    propertyType: raw.propertyType ?? raw.property_type ?? null,
    bedrooms:     raw.bedrooms     ?? null,
    bathrooms:    raw.bathrooms    ?? null,
    sqft:         raw.sqft ?? raw.squareFootage ?? raw.square_footage ?? 0,
    lotSize:      raw.lotSize      ?? raw.lot_size       ?? null,
    yearBuilt:    raw.yearBuilt    ?? raw.year_built     ?? null,
    garage:       raw.garage       ?? null,
    garageSpaces: raw.garageSpaces ?? raw.garage_spaces  ?? null,
    pool:         raw.pool         ?? null,
    stories:      raw.stories      ?? null,
    hoaFee:       raw.hoaFee       ?? raw.hoa?.fee       ?? raw.hoa_fee ?? null,
    description:  raw.description  ?? null,

    agentName:
      raw.agentName ??
      raw.listingAgent?.name ??
      raw.agent_name ??
      null,
    agentPhone:
      raw.agentPhone ??
      raw.listingAgent?.phone ??
      raw.agent_phone ??
      null,
    agentEmail:
      raw.agentEmail ??
      raw.listingAgent?.email ??
      raw.agent_email ??
      null,
    agentWebsite:
      raw.agentWebsite ??
      raw.listingAgent?.website ??
      raw.agent_website ??
      null,

    officeName:
      raw.officeName ??
      raw.listingOffice?.name ??
      raw.office_name ??
      null,
    officePhone:
      raw.officePhone ??
      raw.listingOffice?.phone ??
      raw.office_phone ??
      null,
    officeEmail:
      raw.officeEmail ??
      raw.listingOffice?.email ??
      raw.office_email ??
      null,
    officeWebsite:
      raw.officeWebsite ??
      raw.listingOffice?.website ??
      raw.office_website ??
      null,
    brokerage:
      raw.brokerage ??
      raw.listingOffice?.name ??
      raw.broker_name ??
      raw.office_name ??
      null,

    photos:  Array.isArray(photos) ? photos : [],
    history: history,

    _transferred: raw._transferred,
  };
}
