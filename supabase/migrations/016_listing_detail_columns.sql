-- Expand test_contacts with full listing detail (mirrors the normalized shape
-- from run-automation so the V2 UI has the same richness as Agents Page).
alter table test_contacts
  add column if not exists beds           integer,
  add column if not exists baths          numeric(4,1),
  add column if not exists sqft           integer,
  add column if not exists year_built     integer,
  add column if not exists zip            text,
  add column if not exists property_type  text not null default 'Single Family',
  add column if not exists photo_url      text,
  add column if not exists brokerage      text,
  add column if not exists office_name    text,
  add column if not exists mls_number     text,
  add column if not exists days_on_market integer,
  add column if not exists description    text;

-- Expand campaign_sends with the same listing detail so real campaign sends
-- are just as rich as test sends.
alter table campaign_sends
  add column if not exists listing_beds           integer,
  add column if not exists listing_baths          numeric(4,1),
  add column if not exists listing_sqft           integer,
  add column if not exists listing_year_built     integer,
  add column if not exists listing_zip            text,
  add column if not exists listing_property_type  text,
  add column if not exists listing_photo_url      text,
  add column if not exists listing_brokerage      text,
  add column if not exists listing_mls_number     text,
  add column if not exists listing_days_on_market integer;

-- Backfill test_contacts seed rows with realistic Denver property detail.
-- Using Unsplash photo IDs that look like real residential listings.
update test_contacts set
  beds           = 4,
  baths          = 2.5,
  sqft           = 2340,
  year_built     = 1998,
  zip            = '80206',
  property_type  = 'Single Family',
  photo_url      = 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80',
  brokerage      = 'Kentwood Real Estate',
  office_name    = 'Kentwood Cherry Creek',
  mls_number     = 'RE-2024-0042',
  days_on_market = 1,
  description    = 'Beautifully updated home in Congress Park. Open floor plan, chef''s kitchen with quartz counters, hardwood floors throughout. Primary suite with 5-piece bath. Finished basement. Two-car garage. Steps from restaurants, coffee shops, and City Park.'
where listing_address = '1234 Maple Drive';

update test_contacts set
  beds           = 3,
  baths          = 2.0,
  sqft           = 1680,
  year_built     = 1985,
  zip            = '80209',
  property_type  = 'Single Family',
  photo_url      = 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80',
  brokerage      = 'LIV Sotheby''s International Realty',
  office_name    = 'LIV Sotheby''s Denver',
  mls_number     = 'RE-2024-0091',
  days_on_market = 2,
  description    = 'Charming Washington Park bungalow fully remodeled in 2021. New kitchen, updated baths, fresh paint inside and out. Large fenced backyard with mature trees. Walk to Wash Park, local dining, and the light rail. Move-in ready.'
where listing_address = '567 Oak Street';

update test_contacts set
  beds           = 5,
  baths          = 3.5,
  sqft           = 3120,
  year_built     = 2007,
  zip            = '80218',
  property_type  = 'Single Family',
  photo_url      = 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&q=80',
  brokerage      = 'Coldwell Banker Realty',
  office_name    = 'Coldwell Banker Cherry Creek',
  mls_number     = 'RE-2024-0137',
  days_on_market = 3,
  description    = 'Stunning Capitol Hill Victorian fully restored with modern upgrades. Soaring ceilings, original millwork, chef''s kitchen, three en-suite bedrooms. Rooftop deck with mountain views. Oversized lot with off-street parking. A rare find in the heart of Denver.'
where listing_address = '890 Pine Avenue';
