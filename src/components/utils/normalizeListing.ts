/**
 * Normalize any listing object from:
 *   - RentCast API response (camelCase, e.g. yearBuilt, squareFootage, listingAgent.name)
 *   - Supabase DB row (snake_case, e.g. year_built, square_footage, agent_name)
 *   - automation_run_listings.listing_data blobs (raw RentCast JSON stored as-is)
 *   - saved_listings.listing_data_json blobs (previously normalized or raw)
 *
 * Strategy: for every field, always check BOTH camelCase and snake_case variants,
 * plus any known nested shapes. Never branch on isAlreadyCamel — that heuristic
 * fails silently when a listing happens to lack the trigger keys (no agent, no
 * formattedAddress, etc.) which causes fields like yearBuilt/lotSize to drop to null.
 *
 * This is the SINGLE source of truth for field mapping.
 * Update here to fix data display across all consumers.
 */
export function normalizeListing(raw: any): any {
  if (!raw) return raw;

  // ── Coordinates ──────────────────────────────────────────────────────────
  // Check top-level, nested location object, and lat/lng shorthand keys.
  // Coerce strings to numbers (some blobs serialize coords as strings).
  // Reject 0,0 (null island) and NaN as missing.
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
  const _lat = rawLat != null ? Number(rawLat) : null;
  const _lng = rawLng != null ? Number(rawLng) : null;
  const validLatitude  = _lat != null && !isNaN(_lat)  && _lat  !== 0 ? _lat  : null;
  const validLongitude = _lng != null && !isNaN(_lng) && _lng !== 0 ? _lng : null;

  // ── Photos ───────────────────────────────────────────────────────────────
  // RentCast: raw.photos (array)
  // DB row:   raw.photos_json
  // Blobs:    either of the above
  const photosRaw = raw.photos ?? raw.photosJson ?? raw.photos_json ?? [];
  const photos = Array.isArray(photosRaw) ? photosRaw : [];

  // ── History ──────────────────────────────────────────────────────────────
  const history = raw.history ?? raw.historyJson ?? raw.history_json ?? null;

  return {
    id: raw.id,

    // ── Address ──────────────────────────────────────────────────────────
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
    city:       raw.city        ?? null,
    state:      raw.state       ?? null,
    zip:        raw.zip ?? raw.zipCode ?? raw.zip_code ?? null,
    county:     raw.county      ?? null,
    stateFips:  raw.stateFips   ?? raw.state_fips   ?? null,
    countyFips: raw.countyFips  ?? raw.county_fips  ?? null,
    latitude:   validLatitude,
    longitude:  validLongitude,

    // ── Listing ──────────────────────────────────────────────────────────
    price:             raw.price             ?? null,
    status:            raw.status            ?? null,
    listingType:       raw.listingType       ?? raw.listing_type        ?? null,
    listingTypeDetail: raw.listingTypeDetail ?? raw.listing_type_detail ?? null,
    mlsNumber:         raw.mlsNumber         ?? raw.mls_number          ?? null,
    mlsName:           raw.mlsName           ?? raw.mls_name            ?? null,
    priceDrop:         raw.priceDrop         ?? raw.priceReduced        ?? raw.price_reduced ?? false,
    listedDate:        raw.listedDate        ?? raw.listingDate         ?? raw.listed_date   ?? raw.listing_date ?? null,
    removedDate:       raw.removedDate       ?? raw.removed_date        ?? null,
    createdDate:       raw.createdDate       ?? raw.created_date        ?? raw.createdAt     ?? raw.created_at  ?? null,
    lastSeenDate:      raw.lastSeenDate      ?? raw.last_seen_date      ?? null,
    daysListed:        raw.daysListed        ?? raw.daysOnMarket        ?? raw.days_on_market ?? null,
    virtualTourUrl:    raw.virtualTourUrl    ?? raw.virtual_tour_url    ?? null,
    reList:            raw.reList            ?? raw.re_list             ?? false,

    // ── Property ─────────────────────────────────────────────────────────
    propertyType: raw.propertyType ?? raw.property_type   ?? null,
    bedrooms:     raw.bedrooms     ?? null,
    bathrooms:    raw.bathrooms    ?? null,
    // squareFootage is the RentCast camelCase key; square_footage is the DB key; sqft is our canonical name
    sqft:         raw.sqft ?? raw.squareFootage ?? raw.square_footage ?? 0,
    lotSize:      raw.lotSize      ?? raw.lot_size         ?? null,
    yearBuilt:    raw.yearBuilt    ?? raw.year_built       ?? null,
    garage:       raw.garage       ?? null,
    garageSpaces: raw.garageSpaces ?? raw.garage_spaces    ?? null,
    pool:         raw.pool         ?? null,
    stories:      raw.stories      ?? null,
    hoaFee:       raw.hoaFee       ?? raw.hoa?.fee         ?? raw.hoa_fee ?? null,
    description:  raw.description  ?? null,

    // ── Agent ─────────────────────────────────────────────────────────────
    // RentCast nests agent under listingAgent object; DB has flat agent_* columns;
    // some blobs have flat agentName from a prior normalization pass.
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

    // ── Office / Brokerage ───────────────────────────────────────────────
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

    // ── Builder / Development ────────────────────────────────────────────
    // RentCast returns these as top-level camelCase fields when present.
    builderName:
      raw.builderName ??
      raw.builder_name ??
      null,
    builderPhone:
      raw.builderPhone ??
      raw.builder_phone ??
      null,
    builderEmail:
      raw.builderEmail ??
      raw.builder_email ??
      null,
    builderWebsite:
      raw.builderWebsite ??
      raw.builder_website ??
      null,
    builderDevelopmentName:
      raw.builderDevelopmentName ??
      raw.builder_development_name ??
      raw.developmentName ??
      raw.development_name ??
      null,

    // ── Media & history ──────────────────────────────────────────────────
    photos,
    history,

    // ── Pass-through extras ──────────────────────────────────────────────
    _transferred: raw._transferred,
  };
}
