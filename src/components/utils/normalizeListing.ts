/**
 * Normalize any listing object — whether it came from the RentCast API (camelCase),
 * the Supabase DB (snake_case), or a saved listing_data_json blob — into the
 * consistent camelCase shape that ListingDetailModal expects.
 *
 * This is the SINGLE source of truth for field mapping. Update here to fix
 * data display across Dashboard, AutomationRunPage, and any future consumer.
 */
export function normalizeListing(raw: any): any {
  if (!raw) return raw;

  // Detect format: RentCast/camelCase vs DB/snake_case
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

  return {
    id: raw.id,

    // ── Address ──────────────────────────────────────────────────────────────
    // RentCast uses addressLine1; DB uses address_line1; some blobs use address
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
    latitude:   raw.latitude  ?? null,
    longitude:  raw.longitude ?? null,

    // ── Listing ───────────────────────────────────────────────────────────────
    price:            raw.price            ?? null,
    status:           raw.status           ?? null,
    listingType:      raw.listingType      ?? raw.listing_type       ?? null,
    listingTypeDetail:raw.listingTypeDetail?? raw.listing_type_detail?? null,
    mlsNumber:        raw.mlsNumber        ?? raw.mls_number         ?? null,
    mlsName:          raw.mlsName          ?? raw.mls_name           ?? null,
    priceDrop:        raw.priceDrop        ?? raw.priceReduced       ?? raw.price_reduced ?? false,
    listedDate:       raw.listedDate       ?? raw.listingDate        ?? raw.listed_date        ?? raw.listing_date ?? null,
    removedDate:      raw.removedDate      ?? raw.removed_date       ?? null,
    lastSeenDate:     raw.lastSeenDate     ?? raw.last_seen_date     ?? null,
    daysListed:       raw.daysListed       ?? raw.daysOnMarket       ?? raw.days_on_market ?? null,
    virtualTourUrl:   raw.virtualTourUrl   ?? raw.virtual_tour_url   ?? null,

    // ── Property ─────────────────────────────────────────────────────────────
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

    // ── Agent ─────────────────────────────────────────────────────────────────
    // RentCast can return either a flat agentName or nested listingAgent.name
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

    // ── Office / Brokerage ───────────────────────────────────────────────────
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

    // ── Media & history ──────────────────────────────────────────────────────
    photos:  Array.isArray(photos) ? photos : [],
    history: history,

    // ── Pass-through extras ──────────────────────────────────────────────────
    _transferred: raw._transferred,
  };
}
