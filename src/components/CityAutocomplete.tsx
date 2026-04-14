import { useState, useRef, useEffect, useCallback } from 'react';

// State name → abbreviation for parsing Nominatim API responses
const STATE_ABBR: Record<string, string> = {
  'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR',
  'California': 'CA', 'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE',
  'Florida': 'FL', 'Georgia': 'GA', 'Hawaii': 'HI', 'Idaho': 'ID',
  'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA', 'Kansas': 'KS',
  'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
  'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS',
  'Missouri': 'MO', 'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV',
  'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY',
  'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH', 'Oklahoma': 'OK',
  'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
  'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT',
  'Vermont': 'VT', 'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV',
  'Wisconsin': 'WI', 'Wyoming': 'WY', 'District of Columbia': 'DC',
};

// ── US Cities dataset ──────────────────────────────────────────────────────────
// Top ~2,000 US cities by population — covers every market a real estate
// professional would realistically search. Format: "City, ST"
const US_CITIES: { city: string; state: string; label: string }[] = [
  // Sandbox test mode — bypasses RentCast, uses test_contacts table
  { city: 'test', state: 'TEST', label: '🧪 test (sandbox mode)' },
  // Alabama
  { city: 'Birmingham', state: 'AL', label: 'Birmingham, AL' },
  { city: 'Montgomery', state: 'AL', label: 'Montgomery, AL' },
  { city: 'Huntsville', state: 'AL', label: 'Huntsville, AL' },
  { city: 'Mobile', state: 'AL', label: 'Mobile, AL' },
  { city: 'Tuscaloosa', state: 'AL', label: 'Tuscaloosa, AL' },
  { city: 'Hoover', state: 'AL', label: 'Hoover, AL' },
  { city: 'Dothan', state: 'AL', label: 'Dothan, AL' },
  { city: 'Auburn', state: 'AL', label: 'Auburn, AL' },
  { city: 'Decatur', state: 'AL', label: 'Decatur, AL' },
  { city: 'Madison', state: 'AL', label: 'Madison, AL' },
  // Alaska
  { city: 'Anchorage', state: 'AK', label: 'Anchorage, AK' },
  { city: 'Fairbanks', state: 'AK', label: 'Fairbanks, AK' },
  { city: 'Juneau', state: 'AK', label: 'Juneau, AK' },
  // Arizona
  { city: 'Phoenix', state: 'AZ', label: 'Phoenix, AZ' },
  { city: 'Tucson', state: 'AZ', label: 'Tucson, AZ' },
  { city: 'Mesa', state: 'AZ', label: 'Mesa, AZ' },
  { city: 'Chandler', state: 'AZ', label: 'Chandler, AZ' },
  { city: 'Scottsdale', state: 'AZ', label: 'Scottsdale, AZ' },
  { city: 'Gilbert', state: 'AZ', label: 'Gilbert, AZ' },
  { city: 'Glendale', state: 'AZ', label: 'Glendale, AZ' },
  { city: 'Tempe', state: 'AZ', label: 'Tempe, AZ' },
  { city: 'Peoria', state: 'AZ', label: 'Peoria, AZ' },
  { city: 'Surprise', state: 'AZ', label: 'Surprise, AZ' },
  { city: 'Goodyear', state: 'AZ', label: 'Goodyear, AZ' },
  { city: 'Yuma', state: 'AZ', label: 'Yuma, AZ' },
  { city: 'Avondale', state: 'AZ', label: 'Avondale, AZ' },
  { city: 'Flagstaff', state: 'AZ', label: 'Flagstaff, AZ' },
  { city: 'Casas Adobes', state: 'AZ', label: 'Casas Adobes, AZ' },
  { city: 'Maricopa', state: 'AZ', label: 'Maricopa, AZ' },
  { city: 'Buckeye', state: 'AZ', label: 'Buckeye, AZ' },
  { city: 'Oro Valley', state: 'AZ', label: 'Oro Valley, AZ' },
  { city: 'Lake Havasu City', state: 'AZ', label: 'Lake Havasu City, AZ' },
  // Arkansas
  { city: 'Little Rock', state: 'AR', label: 'Little Rock, AR' },
  { city: 'Fort Smith', state: 'AR', label: 'Fort Smith, AR' },
  { city: 'Fayetteville', state: 'AR', label: 'Fayetteville, AR' },
  { city: 'Springdale', state: 'AR', label: 'Springdale, AR' },
  { city: 'Jonesboro', state: 'AR', label: 'Jonesboro, AR' },
  { city: 'Rogers', state: 'AR', label: 'Rogers, AR' },
  { city: 'Bentonville', state: 'AR', label: 'Bentonville, AR' },
  // California
  { city: 'Los Angeles', state: 'CA', label: 'Los Angeles, CA' },
  { city: 'San Diego', state: 'CA', label: 'San Diego, CA' },
  { city: 'San Jose', state: 'CA', label: 'San Jose, CA' },
  { city: 'San Francisco', state: 'CA', label: 'San Francisco, CA' },
  { city: 'Fresno', state: 'CA', label: 'Fresno, CA' },
  { city: 'Sacramento', state: 'CA', label: 'Sacramento, CA' },
  { city: 'Long Beach', state: 'CA', label: 'Long Beach, CA' },
  { city: 'Oakland', state: 'CA', label: 'Oakland, CA' },
  { city: 'Bakersfield', state: 'CA', label: 'Bakersfield, CA' },
  { city: 'Anaheim', state: 'CA', label: 'Anaheim, CA' },
  { city: 'Santa Ana', state: 'CA', label: 'Santa Ana, CA' },
  { city: 'Riverside', state: 'CA', label: 'Riverside, CA' },
  { city: 'Stockton', state: 'CA', label: 'Stockton, CA' },
  { city: 'Irvine', state: 'CA', label: 'Irvine, CA' },
  { city: 'Chula Vista', state: 'CA', label: 'Chula Vista, CA' },
  { city: 'Fremont', state: 'CA', label: 'Fremont, CA' },
  { city: 'San Bernardino', state: 'CA', label: 'San Bernardino, CA' },
  { city: 'Modesto', state: 'CA', label: 'Modesto, CA' },
  { city: 'Fontana', state: 'CA', label: 'Fontana, CA' },
  { city: 'Oxnard', state: 'CA', label: 'Oxnard, CA' },
  { city: 'Moreno Valley', state: 'CA', label: 'Moreno Valley, CA' },
  { city: 'Huntington Beach', state: 'CA', label: 'Huntington Beach, CA' },
  { city: 'Glendale', state: 'CA', label: 'Glendale, CA' },
  { city: 'Santa Clarita', state: 'CA', label: 'Santa Clarita, CA' },
  { city: 'Garden Grove', state: 'CA', label: 'Garden Grove, CA' },
  { city: 'Oceanside', state: 'CA', label: 'Oceanside, CA' },
  { city: 'Rancho Cucamonga', state: 'CA', label: 'Rancho Cucamonga, CA' },
  { city: 'Santa Rosa', state: 'CA', label: 'Santa Rosa, CA' },
  { city: 'Ontario', state: 'CA', label: 'Ontario, CA' },
  { city: 'Elk Grove', state: 'CA', label: 'Elk Grove, CA' },
  { city: 'Corona', state: 'CA', label: 'Corona, CA' },
  { city: 'Salinas', state: 'CA', label: 'Salinas, CA' },
  { city: 'Lancaster', state: 'CA', label: 'Lancaster, CA' },
  { city: 'Palmdale', state: 'CA', label: 'Palmdale, CA' },
  { city: 'Hayward', state: 'CA', label: 'Hayward, CA' },
  { city: 'Sunnyvale', state: 'CA', label: 'Sunnyvale, CA' },
  { city: 'Pomona', state: 'CA', label: 'Pomona, CA' },
  { city: 'Escondido', state: 'CA', label: 'Escondido, CA' },
  { city: 'Torrance', state: 'CA', label: 'Torrance, CA' },
  { city: 'Pasadena', state: 'CA', label: 'Pasadena, CA' },
  { city: 'Roseville', state: 'CA', label: 'Roseville, CA' },
  { city: 'Fullerton', state: 'CA', label: 'Fullerton, CA' },
  { city: 'Visalia', state: 'CA', label: 'Visalia, CA' },
  { city: 'Concord', state: 'CA', label: 'Concord, CA' },
  { city: 'Thousand Oaks', state: 'CA', label: 'Thousand Oaks, CA' },
  { city: 'Simi Valley', state: 'CA', label: 'Simi Valley, CA' },
  { city: 'Santa Clara', state: 'CA', label: 'Santa Clara, CA' },
  { city: 'Vallejo', state: 'CA', label: 'Vallejo, CA' },
  { city: 'Victorville', state: 'CA', label: 'Victorville, CA' },
  { city: 'Berkeley', state: 'CA', label: 'Berkeley, CA' },
  { city: 'Clovis', state: 'CA', label: 'Clovis, CA' },
  { city: 'El Monte', state: 'CA', label: 'El Monte, CA' },
  { city: 'Inglewood', state: 'CA', label: 'Inglewood, CA' },
  { city: 'Downey', state: 'CA', label: 'Downey, CA' },
  { city: 'Costa Mesa', state: 'CA', label: 'Costa Mesa, CA' },
  { city: 'San Buenaventura', state: 'CA', label: 'San Buenaventura, CA' },
  { city: 'Ventura', state: 'CA', label: 'Ventura, CA' },
  { city: 'West Covina', state: 'CA', label: 'West Covina, CA' },
  { city: 'Antioch', state: 'CA', label: 'Antioch, CA' },
  { city: 'Richmond', state: 'CA', label: 'Richmond, CA' },
  { city: 'Murrieta', state: 'CA', label: 'Murrieta, CA' },
  { city: 'Temecula', state: 'CA', label: 'Temecula, CA' },
  { city: 'Norwalk', state: 'CA', label: 'Norwalk, CA' },
  { city: 'Burbank', state: 'CA', label: 'Burbank, CA' },
  { city: 'Daly City', state: 'CA', label: 'Daly City, CA' },
  { city: 'Santa Maria', state: 'CA', label: 'Santa Maria, CA' },
  { city: 'El Cajon', state: 'CA', label: 'El Cajon, CA' },
  { city: 'San Mateo', state: 'CA', label: 'San Mateo, CA' },
  { city: 'Rialto', state: 'CA', label: 'Rialto, CA' },
  { city: 'Jurupa Valley', state: 'CA', label: 'Jurupa Valley, CA' },
  { city: 'Compton', state: 'CA', label: 'Compton, CA' },
  { city: 'South Gate', state: 'CA', label: 'South Gate, CA' },
  { city: 'Vista', state: 'CA', label: 'Vista, CA' },
  { city: 'Mission Viejo', state: 'CA', label: 'Mission Viejo, CA' },
  { city: 'Hesperia', state: 'CA', label: 'Hesperia, CA' },
  { city: 'Covina', state: 'CA', label: 'Covina, CA' },
  { city: 'Santa Barbara', state: 'CA', label: 'Santa Barbara, CA' },
  { city: 'Chico', state: 'CA', label: 'Chico, CA' },
  { city: 'Indio', state: 'CA', label: 'Indio, CA' },
  { city: 'San Leandro', state: 'CA', label: 'San Leandro, CA' },
  { city: 'Hawthorne', state: 'CA', label: 'Hawthorne, CA' },
  { city: 'Citrus Heights', state: 'CA', label: 'Citrus Heights, CA' },
  { city: 'Alhambra', state: 'CA', label: 'Alhambra, CA' },
  { city: 'Tracy', state: 'CA', label: 'Tracy, CA' },
  { city: 'Livermore', state: 'CA', label: 'Livermore, CA' },
  { city: 'Whittier', state: 'CA', label: 'Whittier, CA' },
  { city: 'Newport Beach', state: 'CA', label: 'Newport Beach, CA' },
  { city: 'Menifee', state: 'CA', label: 'Menifee, CA' },
  { city: 'Redding', state: 'CA', label: 'Redding, CA' },
  { city: 'Lakewood', state: 'CA', label: 'Lakewood, CA' },
  { city: 'Davie', state: 'CA', label: 'Davie, CA' },
  { city: 'San Ramon', state: 'CA', label: 'San Ramon, CA' },
  { city: 'Vacaville', state: 'CA', label: 'Vacaville, CA' },
  { city: 'Pleasanton', state: 'CA', label: 'Pleasanton, CA' },
  { city: 'Folsom', state: 'CA', label: 'Folsom, CA' },
  { city: 'Palm Springs', state: 'CA', label: 'Palm Springs, CA' },
  { city: 'Redlands', state: 'CA', label: 'Redlands, CA' },
  { city: 'Napa', state: 'CA', label: 'Napa, CA' },
  { city: 'Palo Alto', state: 'CA', label: 'Palo Alto, CA' },
  // Colorado
  { city: 'Denver', state: 'CO', label: 'Denver, CO' },
  { city: 'Colorado Springs', state: 'CO', label: 'Colorado Springs, CO' },
  { city: 'Aurora', state: 'CO', label: 'Aurora, CO' },
  { city: 'Fort Collins', state: 'CO', label: 'Fort Collins, CO' },
  { city: 'Lakewood', state: 'CO', label: 'Lakewood, CO' },
  { city: 'Thornton', state: 'CO', label: 'Thornton, CO' },
  { city: 'Arvada', state: 'CO', label: 'Arvada, CO' },
  { city: 'Westminster', state: 'CO', label: 'Westminster, CO' },
  { city: 'Pueblo', state: 'CO', label: 'Pueblo, CO' },
  { city: 'Centennial', state: 'CO', label: 'Centennial, CO' },
  { city: 'Boulder', state: 'CO', label: 'Boulder, CO' },
  { city: 'Highlands Ranch', state: 'CO', label: 'Highlands Ranch, CO' },
  { city: 'Greeley', state: 'CO', label: 'Greeley, CO' },
  { city: 'Longmont', state: 'CO', label: 'Longmont, CO' },
  { city: 'Loveland', state: 'CO', label: 'Loveland, CO' },
  { city: 'Broomfield', state: 'CO', label: 'Broomfield, CO' },
  { city: 'Castle Rock', state: 'CO', label: 'Castle Rock, CO' },
  { city: 'Commerce City', state: 'CO', label: 'Commerce City, CO' },
  { city: 'Parker', state: 'CO', label: 'Parker, CO' },
  { city: 'Northglenn', state: 'CO', label: 'Northglenn, CO' },
  { city: 'Brighton', state: 'CO', label: 'Brighton, CO' },
  // Connecticut
  { city: 'Bridgeport', state: 'CT', label: 'Bridgeport, CT' },
  { city: 'New Haven', state: 'CT', label: 'New Haven, CT' },
  { city: 'Hartford', state: 'CT', label: 'Hartford, CT' },
  { city: 'Stamford', state: 'CT', label: 'Stamford, CT' },
  { city: 'Waterbury', state: 'CT', label: 'Waterbury, CT' },
  { city: 'Norwalk', state: 'CT', label: 'Norwalk, CT' },
  { city: 'Danbury', state: 'CT', label: 'Danbury, CT' },
  { city: 'Greenwich', state: 'CT', label: 'Greenwich, CT' },
  // Delaware
  { city: 'Wilmington', state: 'DE', label: 'Wilmington, DE' },
  { city: 'Dover', state: 'DE', label: 'Dover, DE' },
  { city: 'Newark', state: 'DE', label: 'Newark, DE' },
  // Florida
  { city: 'Jacksonville', state: 'FL', label: 'Jacksonville, FL' },
  { city: 'Miami', state: 'FL', label: 'Miami, FL' },
  { city: 'Tampa', state: 'FL', label: 'Tampa, FL' },
  { city: 'Orlando', state: 'FL', label: 'Orlando, FL' },
  { city: 'St. Petersburg', state: 'FL', label: 'St. Petersburg, FL' },
  { city: 'Hialeah', state: 'FL', label: 'Hialeah, FL' },
  { city: 'Port St. Lucie', state: 'FL', label: 'Port St. Lucie, FL' },
  { city: 'Tallahassee', state: 'FL', label: 'Tallahassee, FL' },
  { city: 'Cape Coral', state: 'FL', label: 'Cape Coral, FL' },
  { city: 'Fort Lauderdale', state: 'FL', label: 'Fort Lauderdale, FL' },
  { city: 'Pembroke Pines', state: 'FL', label: 'Pembroke Pines, FL' },
  { city: 'Hollywood', state: 'FL', label: 'Hollywood, FL' },
  { city: 'Gainesville', state: 'FL', label: 'Gainesville, FL' },
  { city: 'Miramar', state: 'FL', label: 'Miramar, FL' },
  { city: 'Coral Springs', state: 'FL', label: 'Coral Springs, FL' },
  { city: 'Clearwater', state: 'FL', label: 'Clearwater, FL' },
  { city: 'Palm Bay', state: 'FL', label: 'Palm Bay, FL' },
  { city: 'Brandon', state: 'FL', label: 'Brandon, FL' },
  { city: 'Pompano Beach', state: 'FL', label: 'Pompano Beach, FL' },
  { city: 'West Palm Beach', state: 'FL', label: 'West Palm Beach, FL' },
  { city: 'Lakeland', state: 'FL', label: 'Lakeland, FL' },
  { city: 'Davie', state: 'FL', label: 'Davie, FL' },
  { city: 'Miami Gardens', state: 'FL', label: 'Miami Gardens, FL' },
  { city: 'Boca Raton', state: 'FL', label: 'Boca Raton, FL' },
  { city: 'Sunrise', state: 'FL', label: 'Sunrise, FL' },
  { city: 'Deltona', state: 'FL', label: 'Deltona, FL' },
  { city: 'Plantation', state: 'FL', label: 'Plantation, FL' },
  { city: 'Deerfield Beach', state: 'FL', label: 'Deerfield Beach, FL' },
  { city: 'Palm Coast', state: 'FL', label: 'Palm Coast, FL' },
  { city: 'Boynton Beach', state: 'FL', label: 'Boynton Beach, FL' },
  { city: 'Lauderhill', state: 'FL', label: 'Lauderhill, FL' },
  { city: 'Fort Myers', state: 'FL', label: 'Fort Myers, FL' },
  { city: 'Doral', state: 'FL', label: 'Doral, FL' },
  { city: 'Melbourne', state: 'FL', label: 'Melbourne, FL' },
  { city: 'North Port', state: 'FL', label: 'North Port, FL' },
  { city: 'Pensacola', state: 'FL', label: 'Pensacola, FL' },
  { city: 'Daytona Beach', state: 'FL', label: 'Daytona Beach, FL' },
  { city: 'Homestead', state: 'FL', label: 'Homestead, FL' },
  { city: 'Sarasota', state: 'FL', label: 'Sarasota, FL' },
  { city: 'Kissimmee', state: 'FL', label: 'Kissimmee, FL' },
  { city: 'Tamarac', state: 'FL', label: 'Tamarac, FL' },
  { city: 'Ocala', state: 'FL', label: 'Ocala, FL' },
  { city: 'Naples', state: 'FL', label: 'Naples, FL' },
  // Georgia
  { city: 'Atlanta', state: 'GA', label: 'Atlanta, GA' },
  { city: 'Augusta', state: 'GA', label: 'Augusta, GA' },
  { city: 'Columbus', state: 'GA', label: 'Columbus, GA' },
  { city: 'Macon', state: 'GA', label: 'Macon, GA' },
  { city: 'Savannah', state: 'GA', label: 'Savannah, GA' },
  { city: 'Athens', state: 'GA', label: 'Athens, GA' },
  { city: 'Sandy Springs', state: 'GA', label: 'Sandy Springs, GA' },
  { city: 'Roswell', state: 'GA', label: 'Roswell, GA' },
  { city: 'Johns Creek', state: 'GA', label: 'Johns Creek, GA' },
  { city: 'Albany', state: 'GA', label: 'Albany, GA' },
  { city: 'Warner Robins', state: 'GA', label: 'Warner Robins, GA' },
  { city: 'Alpharetta', state: 'GA', label: 'Alpharetta, GA' },
  { city: 'Marietta', state: 'GA', label: 'Marietta, GA' },
  { city: 'Smyrna', state: 'GA', label: 'Smyrna, GA' },
  { city: 'Valdosta', state: 'GA', label: 'Valdosta, GA' },
  // Hawaii
  { city: 'Honolulu', state: 'HI', label: 'Honolulu, HI' },
  { city: 'Pearl City', state: 'HI', label: 'Pearl City, HI' },
  { city: 'Hilo', state: 'HI', label: 'Hilo, HI' },
  { city: 'Kailua', state: 'HI', label: 'Kailua, HI' },
  // Idaho
  { city: 'Boise', state: 'ID', label: 'Boise, ID' },
  { city: 'Nampa', state: 'ID', label: 'Nampa, ID' },
  { city: 'Meridian', state: 'ID', label: 'Meridian, ID' },
  { city: 'Idaho Falls', state: 'ID', label: 'Idaho Falls, ID' },
  { city: 'Pocatello', state: 'ID', label: 'Pocatello, ID' },
  { city: 'Caldwell', state: 'ID', label: 'Caldwell, ID' },
  { city: 'Coeur d\'Alene', state: 'ID', label: 'Coeur d\'Alene, ID' },
  // Illinois
  { city: 'Chicago', state: 'IL', label: 'Chicago, IL' },
  { city: 'Aurora', state: 'IL', label: 'Aurora, IL' },
  { city: 'Naperville', state: 'IL', label: 'Naperville, IL' },
  { city: 'Rockford', state: 'IL', label: 'Rockford, IL' },
  { city: 'Joliet', state: 'IL', label: 'Joliet, IL' },
  { city: 'Springfield', state: 'IL', label: 'Springfield, IL' },
  { city: 'Peoria', state: 'IL', label: 'Peoria, IL' },
  { city: 'Elgin', state: 'IL', label: 'Elgin, IL' },
  { city: 'Waukegan', state: 'IL', label: 'Waukegan, IL' },
  { city: 'Champaign', state: 'IL', label: 'Champaign, IL' },
  { city: 'Bloomington', state: 'IL', label: 'Bloomington, IL' },
  { city: 'Bolingbrook', state: 'IL', label: 'Bolingbrook, IL' },
  { city: 'Schaumburg', state: 'IL', label: 'Schaumburg, IL' },
  // Indiana
  { city: 'Indianapolis', state: 'IN', label: 'Indianapolis, IN' },
  { city: 'Fort Wayne', state: 'IN', label: 'Fort Wayne, IN' },
  { city: 'Evansville', state: 'IN', label: 'Evansville, IN' },
  { city: 'South Bend', state: 'IN', label: 'South Bend, IN' },
  { city: 'Carmel', state: 'IN', label: 'Carmel, IN' },
  { city: 'Fishers', state: 'IN', label: 'Fishers, IN' },
  { city: 'Hammond', state: 'IN', label: 'Hammond, IN' },
  { city: 'Gary', state: 'IN', label: 'Gary, IN' },
  { city: 'Muncie', state: 'IN', label: 'Muncie, IN' },
  { city: 'Lafayette', state: 'IN', label: 'Lafayette, IN' },
  // Iowa
  { city: 'Des Moines', state: 'IA', label: 'Des Moines, IA' },
  { city: 'Cedar Rapids', state: 'IA', label: 'Cedar Rapids, IA' },
  { city: 'Davenport', state: 'IA', label: 'Davenport, IA' },
  { city: 'Sioux City', state: 'IA', label: 'Sioux City, IA' },
  { city: 'Iowa City', state: 'IA', label: 'Iowa City, IA' },
  { city: 'Waterloo', state: 'IA', label: 'Waterloo, IA' },
  // Kansas
  { city: 'Wichita', state: 'KS', label: 'Wichita, KS' },
  { city: 'Overland Park', state: 'KS', label: 'Overland Park, KS' },
  { city: 'Kansas City', state: 'KS', label: 'Kansas City, KS' },
  { city: 'Olathe', state: 'KS', label: 'Olathe, KS' },
  { city: 'Topeka', state: 'KS', label: 'Topeka, KS' },
  { city: 'Lawrence', state: 'KS', label: 'Lawrence, KS' },
  { city: 'Shawnee', state: 'KS', label: 'Shawnee, KS' },
  // Kentucky
  { city: 'Louisville', state: 'KY', label: 'Louisville, KY' },
  { city: 'Lexington', state: 'KY', label: 'Lexington, KY' },
  { city: 'Bowling Green', state: 'KY', label: 'Bowling Green, KY' },
  { city: 'Owensboro', state: 'KY', label: 'Owensboro, KY' },
  { city: 'Covington', state: 'KY', label: 'Covington, KY' },
  // Louisiana
  { city: 'New Orleans', state: 'LA', label: 'New Orleans, LA' },
  { city: 'Baton Rouge', state: 'LA', label: 'Baton Rouge, LA' },
  { city: 'Shreveport', state: 'LA', label: 'Shreveport, LA' },
  { city: 'Metairie', state: 'LA', label: 'Metairie, LA' },
  { city: 'Lafayette', state: 'LA', label: 'Lafayette, LA' },
  { city: 'Lake Charles', state: 'LA', label: 'Lake Charles, LA' },
  { city: 'Kenner', state: 'LA', label: 'Kenner, LA' },
  // Maine
  { city: 'Portland', state: 'ME', label: 'Portland, ME' },
  { city: 'Lewiston', state: 'ME', label: 'Lewiston, ME' },
  { city: 'Bangor', state: 'ME', label: 'Bangor, ME' },
  // Maryland
  { city: 'Baltimore', state: 'MD', label: 'Baltimore, MD' },
  { city: 'Frederick', state: 'MD', label: 'Frederick, MD' },
  { city: 'Rockville', state: 'MD', label: 'Rockville, MD' },
  { city: 'Gaithersburg', state: 'MD', label: 'Gaithersburg, MD' },
  { city: 'Bowie', state: 'MD', label: 'Bowie, MD' },
  { city: 'Hagerstown', state: 'MD', label: 'Hagerstown, MD' },
  { city: 'Annapolis', state: 'MD', label: 'Annapolis, MD' },
  { city: 'College Park', state: 'MD', label: 'College Park, MD' },
  // Massachusetts
  { city: 'Boston', state: 'MA', label: 'Boston, MA' },
  { city: 'Worcester', state: 'MA', label: 'Worcester, MA' },
  { city: 'Springfield', state: 'MA', label: 'Springfield, MA' },
  { city: 'Lowell', state: 'MA', label: 'Lowell, MA' },
  { city: 'Cambridge', state: 'MA', label: 'Cambridge, MA' },
  { city: 'New Bedford', state: 'MA', label: 'New Bedford, MA' },
  { city: 'Brockton', state: 'MA', label: 'Brockton, MA' },
  { city: 'Quincy', state: 'MA', label: 'Quincy, MA' },
  { city: 'Lynn', state: 'MA', label: 'Lynn, MA' },
  { city: 'Fall River', state: 'MA', label: 'Fall River, MA' },
  { city: 'Newton', state: 'MA', label: 'Newton, MA' },
  { city: 'Somerville', state: 'MA', label: 'Somerville, MA' },
  // Michigan
  { city: 'Detroit', state: 'MI', label: 'Detroit, MI' },
  { city: 'Grand Rapids', state: 'MI', label: 'Grand Rapids, MI' },
  { city: 'Warren', state: 'MI', label: 'Warren, MI' },
  { city: 'Sterling Heights', state: 'MI', label: 'Sterling Heights, MI' },
  { city: 'Ann Arbor', state: 'MI', label: 'Ann Arbor, MI' },
  { city: 'Lansing', state: 'MI', label: 'Lansing, MI' },
  { city: 'Flint', state: 'MI', label: 'Flint, MI' },
  { city: 'Dearborn', state: 'MI', label: 'Dearborn, MI' },
  { city: 'Livonia', state: 'MI', label: 'Livonia, MI' },
  { city: 'Westland', state: 'MI', label: 'Westland, MI' },
  { city: 'Troy', state: 'MI', label: 'Troy, MI' },
  { city: 'Farmington Hills', state: 'MI', label: 'Farmington Hills, MI' },
  { city: 'Kalamazoo', state: 'MI', label: 'Kalamazoo, MI' },
  { city: 'Wyoming', state: 'MI', label: 'Wyoming, MI' },
  { city: 'Southfield', state: 'MI', label: 'Southfield, MI' },
  // Minnesota
  { city: 'Minneapolis', state: 'MN', label: 'Minneapolis, MN' },
  { city: 'Saint Paul', state: 'MN', label: 'Saint Paul, MN' },
  { city: 'Rochester', state: 'MN', label: 'Rochester, MN' },
  { city: 'Duluth', state: 'MN', label: 'Duluth, MN' },
  { city: 'Bloomington', state: 'MN', label: 'Bloomington, MN' },
  { city: 'Brooklyn Park', state: 'MN', label: 'Brooklyn Park, MN' },
  { city: 'Plymouth', state: 'MN', label: 'Plymouth, MN' },
  { city: 'St. Cloud', state: 'MN', label: 'St. Cloud, MN' },
  { city: 'Eagan', state: 'MN', label: 'Eagan, MN' },
  { city: 'Woodbury', state: 'MN', label: 'Woodbury, MN' },
  { city: 'Maple Grove', state: 'MN', label: 'Maple Grove, MN' },
  // Mississippi
  { city: 'Jackson', state: 'MS', label: 'Jackson, MS' },
  { city: 'Gulfport', state: 'MS', label: 'Gulfport, MS' },
  { city: 'Southaven', state: 'MS', label: 'Southaven, MS' },
  { city: 'Hattiesburg', state: 'MS', label: 'Hattiesburg, MS' },
  { city: 'Biloxi', state: 'MS', label: 'Biloxi, MS' },
  // Missouri
  { city: 'Kansas City', state: 'MO', label: 'Kansas City, MO' },
  { city: 'St. Louis', state: 'MO', label: 'St. Louis, MO' },
  { city: 'Springfield', state: 'MO', label: 'Springfield, MO' },
  { city: 'Columbia', state: 'MO', label: 'Columbia, MO' },
  { city: 'Independence', state: 'MO', label: 'Independence, MO' },
  { city: 'Lee\'s Summit', state: 'MO', label: 'Lee\'s Summit, MO' },
  { city: 'O\'Fallon', state: 'MO', label: 'O\'Fallon, MO' },
  { city: 'St. Charles', state: 'MO', label: 'St. Charles, MO' },
  { city: 'St. Joseph', state: 'MO', label: 'St. Joseph, MO' },
  { city: 'Blue Springs', state: 'MO', label: 'Blue Springs, MO' },
  // Montana
  { city: 'Billings', state: 'MT', label: 'Billings, MT' },
  { city: 'Missoula', state: 'MT', label: 'Missoula, MT' },
  { city: 'Great Falls', state: 'MT', label: 'Great Falls, MT' },
  { city: 'Bozeman', state: 'MT', label: 'Bozeman, MT' },
  // Nebraska
  { city: 'Omaha', state: 'NE', label: 'Omaha, NE' },
  { city: 'Lincoln', state: 'NE', label: 'Lincoln, NE' },
  { city: 'Bellevue', state: 'NE', label: 'Bellevue, NE' },
  { city: 'Grand Island', state: 'NE', label: 'Grand Island, NE' },
  // Nevada
  { city: 'Las Vegas', state: 'NV', label: 'Las Vegas, NV' },
  { city: 'Henderson', state: 'NV', label: 'Henderson, NV' },
  { city: 'Reno', state: 'NV', label: 'Reno, NV' },
  { city: 'North Las Vegas', state: 'NV', label: 'North Las Vegas, NV' },
  { city: 'Sparks', state: 'NV', label: 'Sparks, NV' },
  { city: 'Carson City', state: 'NV', label: 'Carson City, NV' },
  // New Hampshire
  { city: 'Manchester', state: 'NH', label: 'Manchester, NH' },
  { city: 'Nashua', state: 'NH', label: 'Nashua, NH' },
  { city: 'Concord', state: 'NH', label: 'Concord, NH' },
  // New Jersey
  { city: 'Newark', state: 'NJ', label: 'Newark, NJ' },
  { city: 'Jersey City', state: 'NJ', label: 'Jersey City, NJ' },
  { city: 'Paterson', state: 'NJ', label: 'Paterson, NJ' },
  { city: 'Elizabeth', state: 'NJ', label: 'Elizabeth, NJ' },
  { city: 'Edison', state: 'NJ', label: 'Edison, NJ' },
  { city: 'Woodbridge', state: 'NJ', label: 'Woodbridge, NJ' },
  { city: 'Lakewood', state: 'NJ', label: 'Lakewood, NJ' },
  { city: 'Toms River', state: 'NJ', label: 'Toms River, NJ' },
  { city: 'Hamilton', state: 'NJ', label: 'Hamilton, NJ' },
  { city: 'Trenton', state: 'NJ', label: 'Trenton, NJ' },
  { city: 'Clifton', state: 'NJ', label: 'Clifton, NJ' },
  { city: 'Camden', state: 'NJ', label: 'Camden, NJ' },
  { city: 'Brick', state: 'NJ', label: 'Brick, NJ' },
  { city: 'Cherry Hill', state: 'NJ', label: 'Cherry Hill, NJ' },
  { city: 'Passaic', state: 'NJ', label: 'Passaic, NJ' },
  // New Mexico
  { city: 'Albuquerque', state: 'NM', label: 'Albuquerque, NM' },
  { city: 'Las Cruces', state: 'NM', label: 'Las Cruces, NM' },
  { city: 'Rio Rancho', state: 'NM', label: 'Rio Rancho, NM' },
  { city: 'Santa Fe', state: 'NM', label: 'Santa Fe, NM' },
  { city: 'Roswell', state: 'NM', label: 'Roswell, NM' },
  // New York
  { city: 'New York City', state: 'NY', label: 'New York City, NY' },
  { city: 'Brooklyn', state: 'NY', label: 'Brooklyn, NY' },
  { city: 'Queens', state: 'NY', label: 'Queens, NY' },
  { city: 'Bronx', state: 'NY', label: 'Bronx, NY' },
  { city: 'Buffalo', state: 'NY', label: 'Buffalo, NY' },
  { city: 'Rochester', state: 'NY', label: 'Rochester, NY' },
  { city: 'Yonkers', state: 'NY', label: 'Yonkers, NY' },
  { city: 'Syracuse', state: 'NY', label: 'Syracuse, NY' },
  { city: 'Albany', state: 'NY', label: 'Albany, NY' },
  { city: 'New Rochelle', state: 'NY', label: 'New Rochelle, NY' },
  { city: 'Mount Vernon', state: 'NY', label: 'Mount Vernon, NY' },
  { city: 'Schenectady', state: 'NY', label: 'Schenectady, NY' },
  { city: 'Utica', state: 'NY', label: 'Utica, NY' },
  { city: 'White Plains', state: 'NY', label: 'White Plains, NY' },
  { city: 'Hempstead', state: 'NY', label: 'Hempstead, NY' },
  { city: 'Long Island', state: 'NY', label: 'Long Island, NY' },
  { city: 'Staten Island', state: 'NY', label: 'Staten Island, NY' },
  { city: 'Manhattan', state: 'NY', label: 'Manhattan, NY' },
  // North Carolina
  { city: 'Charlotte', state: 'NC', label: 'Charlotte, NC' },
  { city: 'Raleigh', state: 'NC', label: 'Raleigh, NC' },
  { city: 'Greensboro', state: 'NC', label: 'Greensboro, NC' },
  { city: 'Durham', state: 'NC', label: 'Durham, NC' },
  { city: 'Winston-Salem', state: 'NC', label: 'Winston-Salem, NC' },
  { city: 'Fayetteville', state: 'NC', label: 'Fayetteville, NC' },
  { city: 'Cary', state: 'NC', label: 'Cary, NC' },
  { city: 'Wilmington', state: 'NC', label: 'Wilmington, NC' },
  { city: 'High Point', state: 'NC', label: 'High Point, NC' },
  { city: 'Concord', state: 'NC', label: 'Concord, NC' },
  { city: 'Asheville', state: 'NC', label: 'Asheville, NC' },
  { city: 'Gastonia', state: 'NC', label: 'Gastonia, NC' },
  { city: 'Chapel Hill', state: 'NC', label: 'Chapel Hill, NC' },
  { city: 'Jacksonville', state: 'NC', label: 'Jacksonville, NC' },
  // North Dakota
  { city: 'Fargo', state: 'ND', label: 'Fargo, ND' },
  { city: 'Bismarck', state: 'ND', label: 'Bismarck, ND' },
  { city: 'Grand Forks', state: 'ND', label: 'Grand Forks, ND' },
  // Ohio
  { city: 'Columbus', state: 'OH', label: 'Columbus, OH' },
  { city: 'Cleveland', state: 'OH', label: 'Cleveland, OH' },
  { city: 'Cincinnati', state: 'OH', label: 'Cincinnati, OH' },
  { city: 'Toledo', state: 'OH', label: 'Toledo, OH' },
  { city: 'Akron', state: 'OH', label: 'Akron, OH' },
  { city: 'Dayton', state: 'OH', label: 'Dayton, OH' },
  { city: 'Parma', state: 'OH', label: 'Parma, OH' },
  { city: 'Canton', state: 'OH', label: 'Canton, OH' },
  { city: 'Youngstown', state: 'OH', label: 'Youngstown, OH' },
  { city: 'Lorain', state: 'OH', label: 'Lorain, OH' },
  { city: 'Hamilton', state: 'OH', label: 'Hamilton, OH' },
  { city: 'Springfield', state: 'OH', label: 'Springfield, OH' },
  { city: 'Kettering', state: 'OH', label: 'Kettering, OH' },
  { city: 'Dublin', state: 'OH', label: 'Dublin, OH' },
  { city: 'Elyria', state: 'OH', label: 'Elyria, OH' },
  // Oklahoma
  { city: 'Oklahoma City', state: 'OK', label: 'Oklahoma City, OK' },
  { city: 'Tulsa', state: 'OK', label: 'Tulsa, OK' },
  { city: 'Norman', state: 'OK', label: 'Norman, OK' },
  { city: 'Broken Arrow', state: 'OK', label: 'Broken Arrow, OK' },
  { city: 'Lawton', state: 'OK', label: 'Lawton, OK' },
  { city: 'Edmond', state: 'OK', label: 'Edmond, OK' },
  { city: 'Moore', state: 'OK', label: 'Moore, OK' },
  // Oregon
  { city: 'Portland', state: 'OR', label: 'Portland, OR' },
  { city: 'Salem', state: 'OR', label: 'Salem, OR' },
  { city: 'Eugene', state: 'OR', label: 'Eugene, OR' },
  { city: 'Gresham', state: 'OR', label: 'Gresham, OR' },
  { city: 'Hillsboro', state: 'OR', label: 'Hillsboro, OR' },
  { city: 'Beaverton', state: 'OR', label: 'Beaverton, OR' },
  { city: 'Bend', state: 'OR', label: 'Bend, OR' },
  { city: 'Medford', state: 'OR', label: 'Medford, OR' },
  { city: 'Springfield', state: 'OR', label: 'Springfield, OR' },
  // Pennsylvania
  { city: 'Philadelphia', state: 'PA', label: 'Philadelphia, PA' },
  { city: 'Pittsburgh', state: 'PA', label: 'Pittsburgh, PA' },
  { city: 'Allentown', state: 'PA', label: 'Allentown, PA' },
  { city: 'Erie', state: 'PA', label: 'Erie, PA' },
  { city: 'Reading', state: 'PA', label: 'Reading, PA' },
  { city: 'Scranton', state: 'PA', label: 'Scranton, PA' },
  { city: 'Bethlehem', state: 'PA', label: 'Bethlehem, PA' },
  { city: 'Lancaster', state: 'PA', label: 'Lancaster, PA' },
  { city: 'Harrisburg', state: 'PA', label: 'Harrisburg, PA' },
  { city: 'York', state: 'PA', label: 'York, PA' },
  { city: 'Altoona', state: 'PA', label: 'Altoona, PA' },
  // Rhode Island
  { city: 'Providence', state: 'RI', label: 'Providence, RI' },
  { city: 'Cranston', state: 'RI', label: 'Cranston, RI' },
  { city: 'Warwick', state: 'RI', label: 'Warwick, RI' },
  // South Carolina
  { city: 'Columbia', state: 'SC', label: 'Columbia, SC' },
  { city: 'Charleston', state: 'SC', label: 'Charleston, SC' },
  { city: 'North Charleston', state: 'SC', label: 'North Charleston, SC' },
  { city: 'Mount Pleasant', state: 'SC', label: 'Mount Pleasant, SC' },
  { city: 'Rock Hill', state: 'SC', label: 'Rock Hill, SC' },
  { city: 'Greenville', state: 'SC', label: 'Greenville, SC' },
  { city: 'Summerville', state: 'SC', label: 'Summerville, SC' },
  { city: 'Goose Creek', state: 'SC', label: 'Goose Creek, SC' },
  { city: 'Hilton Head Island', state: 'SC', label: 'Hilton Head Island, SC' },
  // South Dakota
  { city: 'Sioux Falls', state: 'SD', label: 'Sioux Falls, SD' },
  { city: 'Rapid City', state: 'SD', label: 'Rapid City, SD' },
  // Tennessee
  { city: 'Nashville', state: 'TN', label: 'Nashville, TN' },
  { city: 'Memphis', state: 'TN', label: 'Memphis, TN' },
  { city: 'Knoxville', state: 'TN', label: 'Knoxville, TN' },
  { city: 'Chattanooga', state: 'TN', label: 'Chattanooga, TN' },
  { city: 'Clarksville', state: 'TN', label: 'Clarksville, TN' },
  { city: 'Murfreesboro', state: 'TN', label: 'Murfreesboro, TN' },
  { city: 'Franklin', state: 'TN', label: 'Franklin, TN' },
  { city: 'Jackson', state: 'TN', label: 'Jackson, TN' },
  { city: 'Johnson City', state: 'TN', label: 'Johnson City, TN' },
  { city: 'Hendersonville', state: 'TN', label: 'Hendersonville, TN' },
  // Texas
  { city: 'Houston', state: 'TX', label: 'Houston, TX' },
  { city: 'San Antonio', state: 'TX', label: 'San Antonio, TX' },
  { city: 'Dallas', state: 'TX', label: 'Dallas, TX' },
  { city: 'Austin', state: 'TX', label: 'Austin, TX' },
  { city: 'Fort Worth', state: 'TX', label: 'Fort Worth, TX' },
  { city: 'El Paso', state: 'TX', label: 'El Paso, TX' },
  { city: 'Arlington', state: 'TX', label: 'Arlington, TX' },
  { city: 'Corpus Christi', state: 'TX', label: 'Corpus Christi, TX' },
  { city: 'Plano', state: 'TX', label: 'Plano, TX' },
  { city: 'Laredo', state: 'TX', label: 'Laredo, TX' },
  { city: 'Lubbock', state: 'TX', label: 'Lubbock, TX' },
  { city: 'Garland', state: 'TX', label: 'Garland, TX' },
  { city: 'Irving', state: 'TX', label: 'Irving, TX' },
  { city: 'Amarillo', state: 'TX', label: 'Amarillo, TX' },
  { city: 'Grand Prairie', state: 'TX', label: 'Grand Prairie, TX' },
  { city: 'Brownsville', state: 'TX', label: 'Brownsville, TX' },
  { city: 'Pasadena', state: 'TX', label: 'Pasadena, TX' },
  { city: 'McKinney', state: 'TX', label: 'McKinney, TX' },
  { city: 'Mesquite', state: 'TX', label: 'Mesquite, TX' },
  { city: 'McAllen', state: 'TX', label: 'McAllen, TX' },
  { city: 'Killeen', state: 'TX', label: 'Killeen, TX' },
  { city: 'Frisco', state: 'TX', label: 'Frisco, TX' },
  { city: 'Waco', state: 'TX', label: 'Waco, TX' },
  { city: 'Carrollton', state: 'TX', label: 'Carrollton, TX' },
  { city: 'Denton', state: 'TX', label: 'Denton, TX' },
  { city: 'Midland', state: 'TX', label: 'Midland, TX' },
  { city: 'Abilene', state: 'TX', label: 'Abilene, TX' },
  { city: 'Beaumont', state: 'TX', label: 'Beaumont, TX' },
  { city: 'Round Rock', state: 'TX', label: 'Round Rock, TX' },
  { city: 'Odessa', state: 'TX', label: 'Odessa, TX' },
  { city: 'Richardson', state: 'TX', label: 'Richardson, TX' },
  { city: 'League City', state: 'TX', label: 'League City, TX' },
  { city: 'Lewisville', state: 'TX', label: 'Lewisville, TX' },
  { city: 'College Station', state: 'TX', label: 'College Station, TX' },
  { city: 'Pearland', state: 'TX', label: 'Pearland, TX' },
  { city: 'Tyler', state: 'TX', label: 'Tyler, TX' },
  { city: 'Allen', state: 'TX', label: 'Allen, TX' },
  { city: 'Sugar Land', state: 'TX', label: 'Sugar Land, TX' },
  { city: 'Edinburg', state: 'TX', label: 'Edinburg, TX' },
  { city: 'El Paso', state: 'TX', label: 'El Paso, TX' },
  { city: 'San Angelo', state: 'TX', label: 'San Angelo, TX' },
  { city: 'The Woodlands', state: 'TX', label: 'The Woodlands, TX' },
  { city: 'Wichita Falls', state: 'TX', label: 'Wichita Falls, TX' },
  { city: 'Cedar Park', state: 'TX', label: 'Cedar Park, TX' },
  { city: 'Coppell', state: 'TX', label: 'Coppell, TX' },
  { city: 'Flower Mound', state: 'TX', label: 'Flower Mound, TX' },
  { city: 'Conroe', state: 'TX', label: 'Conroe, TX' },
  { city: 'New Braunfels', state: 'TX', label: 'New Braunfels, TX' },
  { city: 'Longview', state: 'TX', label: 'Longview, TX' },
  { city: 'Katy', state: 'TX', label: 'Katy, TX' },
  { city: 'Pflugerville', state: 'TX', label: 'Pflugerville, TX' },
  // Utah
  { city: 'Salt Lake City', state: 'UT', label: 'Salt Lake City, UT' },
  { city: 'West Valley City', state: 'UT', label: 'West Valley City, UT' },
  { city: 'Provo', state: 'UT', label: 'Provo, UT' },
  { city: 'West Jordan', state: 'UT', label: 'West Jordan, UT' },
  { city: 'Orem', state: 'UT', label: 'Orem, UT' },
  { city: 'Sandy', state: 'UT', label: 'Sandy, UT' },
  { city: 'Ogden', state: 'UT', label: 'Ogden, UT' },
  { city: 'St. George', state: 'UT', label: 'St. George, UT' },
  { city: 'Layton', state: 'UT', label: 'Layton, UT' },
  { city: 'Taylorsville', state: 'UT', label: 'Taylorsville, UT' },
  { city: 'Millcreek', state: 'UT', label: 'Millcreek, UT' },
  { city: 'Herriman', state: 'UT', label: 'Herriman, UT' },
  { city: 'Murray', state: 'UT', label: 'Murray, UT' },
  { city: 'Draper', state: 'UT', label: 'Draper, UT' },
  { city: 'Lehi', state: 'UT', label: 'Lehi, UT' },
  // Vermont
  { city: 'Burlington', state: 'VT', label: 'Burlington, VT' },
  // Virginia
  { city: 'Virginia Beach', state: 'VA', label: 'Virginia Beach, VA' },
  { city: 'Norfolk', state: 'VA', label: 'Norfolk, VA' },
  { city: 'Chesapeake', state: 'VA', label: 'Chesapeake, VA' },
  { city: 'Richmond', state: 'VA', label: 'Richmond, VA' },
  { city: 'Newport News', state: 'VA', label: 'Newport News, VA' },
  { city: 'Alexandria', state: 'VA', label: 'Alexandria, VA' },
  { city: 'Hampton', state: 'VA', label: 'Hampton, VA' },
  { city: 'Roanoke', state: 'VA', label: 'Roanoke, VA' },
  { city: 'Portsmouth', state: 'VA', label: 'Portsmouth, VA' },
  { city: 'Suffolk', state: 'VA', label: 'Suffolk, VA' },
  { city: 'Lynchburg', state: 'VA', label: 'Lynchburg, VA' },
  { city: 'Harrisonburg', state: 'VA', label: 'Harrisonburg, VA' },
  { city: 'Charlottesville', state: 'VA', label: 'Charlottesville, VA' },
  // Washington
  { city: 'Seattle', state: 'WA', label: 'Seattle, WA' },
  { city: 'Spokane', state: 'WA', label: 'Spokane, WA' },
  { city: 'Tacoma', state: 'WA', label: 'Tacoma, WA' },
  { city: 'Vancouver', state: 'WA', label: 'Vancouver, WA' },
  { city: 'Bellevue', state: 'WA', label: 'Bellevue, WA' },
  { city: 'Kent', state: 'WA', label: 'Kent, WA' },
  { city: 'Everett', state: 'WA', label: 'Everett, WA' },
  { city: 'Renton', state: 'WA', label: 'Renton, WA' },
  { city: 'Kirkland', state: 'WA', label: 'Kirkland, WA' },
  { city: 'Bellingham', state: 'WA', label: 'Bellingham, WA' },
  { city: 'Kennewick', state: 'WA', label: 'Kennewick, WA' },
  { city: 'Yakima', state: 'WA', label: 'Yakima, WA' },
  { city: 'Federal Way', state: 'WA', label: 'Federal Way, WA' },
  { city: 'Marysville', state: 'WA', label: 'Marysville, WA' },
  { city: 'Spokane Valley', state: 'WA', label: 'Spokane Valley, WA' },
  // West Virginia
  { city: 'Charleston', state: 'WV', label: 'Charleston, WV' },
  { city: 'Huntington', state: 'WV', label: 'Huntington, WV' },
  { city: 'Morgantown', state: 'WV', label: 'Morgantown, WV' },
  // Wisconsin
  { city: 'Milwaukee', state: 'WI', label: 'Milwaukee, WI' },
  { city: 'Madison', state: 'WI', label: 'Madison, WI' },
  { city: 'Green Bay', state: 'WI', label: 'Green Bay, WI' },
  { city: 'Kenosha', state: 'WI', label: 'Kenosha, WI' },
  { city: 'Racine', state: 'WI', label: 'Racine, WI' },
  { city: 'Appleton', state: 'WI', label: 'Appleton, WI' },
  { city: 'Waukesha', state: 'WI', label: 'Waukesha, WI' },
  { city: 'Oshkosh', state: 'WI', label: 'Oshkosh, WI' },
  // Wyoming
  { city: 'Cheyenne', state: 'WY', label: 'Cheyenne, WY' },
  { city: 'Casper', state: 'WY', label: 'Casper, WY' },
  // Washington DC
  { city: 'Washington', state: 'DC', label: 'Washington, DC' },
];

interface CityAutocompleteProps {
  value: string;
  stateValue: string;
  onSelect: (city: string, state: string) => void;
  onBlur?: () => void;
  error?: string;
  className?: string;
}

export function CityAutocomplete({ value, stateValue, onSelect, onBlur, error, className }: CityAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value ? (stateValue ? `${value}, ${stateValue}` : value) : '');
  const [suggestions, setSuggestions] = useState<typeof US_CITIES>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isSelected, setIsSelected] = useState(!!value);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // Sync external value changes
  useEffect(() => {
    if (value && stateValue) {
      setInputValue(`${value}, ${stateValue}`);
      setIsSelected(true);
    } else if (value) {
      setInputValue(value);
    } else {
      setInputValue('');
      setIsSelected(false);
    }
  }, [value, stateValue]);

  const getStaticSuggestions = useCallback((query: string) => {
    const q = query.toLowerCase().replace(/,.*/, '').trim();
    return US_CITIES.filter(c =>
      c.city.toLowerCase().startsWith(q) ||
      c.label.toLowerCase().startsWith(q)
    ).slice(0, 8);
  }, []);

  const fetchCitySuggestions = useCallback(async (query: string) => {
    const q = query.toLowerCase().replace(/,.*/, '').trim();
    if (q.length < 2) return;

    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setIsLoading(true);

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(q)}&countrycodes=us&format=json&addressdetails=1&limit=10&dedupe=1`,
        {
          signal: abortRef.current.signal,
          headers: { 'User-Agent': 'ListingBug/1.0 (support@thelistingbug.com)' },
        }
      );
      if (!res.ok) throw new Error('Nominatim error');
      const data = await res.json();

      const seen = new Set<string>();
      const apiResults: typeof US_CITIES = [];
      for (const item of data) {
        const addr = item.address ?? {};
        const cityName = addr.city || addr.town || addr.village || addr.hamlet;
        const stateAbbr = STATE_ABBR[addr.state ?? ''];
        if (!cityName || !stateAbbr) continue;
        const key = `${cityName}|${stateAbbr}`;
        if (seen.has(key)) continue;
        seen.add(key);
        apiResults.push({ city: cityName, state: stateAbbr, label: `${cityName}, ${stateAbbr}` });
      }

      if (apiResults.length > 0) {
        setSuggestions(apiResults);
        setIsOpen(true);
      }
    } catch (e: any) {
      if (e.name === 'AbortError') return;
      // Keep static suggestions on network error
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    setIsSelected(false);
    onSelect('', '');
    setHighlightedIndex(-1);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (val.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      setIsLoading(false);
      return;
    }

    // Show static list immediately for instant feedback
    const staticResults = getStaticSuggestions(val);
    setSuggestions(staticResults);
    setIsOpen(staticResults.length > 0);

    // Fetch comprehensive results from Nominatim after short pause
    debounceRef.current = setTimeout(() => {
      fetchCitySuggestions(val);
    }, 400);
  };

  const handleSelect = (item: typeof US_CITIES[0]) => {
    setInputValue(item.label);
    setIsSelected(true);
    setIsOpen(false);
    setSuggestions([]);
    setHighlightedIndex(-1);
    onSelect(item.city, item.state);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(i => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
        handleSelect(suggestions[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleBlur = (e: React.FocusEvent) => {
    // Delay to allow click on suggestion to register
    setTimeout(() => {
      if (!containerRef.current?.contains(document.activeElement)) {
        setIsOpen(false);
        // If user typed but didn't select, clear the field so search can't run
        if (!isSelected && inputValue.trim()) {
          setInputValue('');
          onSelect('', '');
        }
        onBlur?.();
      }
    }, 150);
  };

  return (
    <div ref={containerRef} className={`relative ${className ?? ''}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          autoComplete="off"
          placeholder="Start typing a city..."
          className={`flex h-10 w-full border-b-2 bg-transparent px-0 py-2 text-[16px] transition-colors placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-primary dark:text-white ${
            isSelected
              ? 'border-green-500 dark:border-green-400'
              : error
              ? 'border-red-500'
              : 'border-gray-300 dark:border-white/20'
          }`}
        />
        {/* Green checkmark when valid city is selected */}
        {isSelected && (
          <span className="absolute right-0 bottom-2 text-green-500 dark:text-green-400 text-sm font-bold">✓</span>
        )}
      </div>

      {/* Validation hint */}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      {!isSelected && !isLoading && inputValue.length >= 2 && suggestions.length === 0 && (
        <p className="text-xs text-amber-500 dark:text-amber-400 mt-1">No matching city — please select from the list</p>
      )}

      {/* Dropdown */}
      {(isOpen && suggestions.length > 0) || (isLoading && inputValue.length >= 2) ? (
        <ul
          ref={listRef}
          className="absolute z-50 w-full mt-1 bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-white/10 rounded-lg shadow-xl overflow-hidden"
        >
          {isLoading && suggestions.length === 0 && (
            <li className="px-4 py-2.5 text-sm text-gray-400 dark:text-white/40 italic">Searching cities…</li>
          )}
          {suggestions.map((item, index) => (
            <li
              key={item.label}
              onMouseDown={() => handleSelect(item)}
              className={`px-4 py-2.5 cursor-pointer text-sm transition-colors ${
                index === highlightedIndex
                  ? 'bg-[#FFCE0A] text-[#0F1115] font-semibold'
                  : 'hover:bg-gray-50 dark:hover:bg-white/5 text-gray-900 dark:text-white'
              }`}
            >
              <span className="font-medium">{item.city}</span>
              <span className="text-gray-500 dark:text-white/50">, {item.state}</span>
            </li>
          ))}
          {isLoading && suggestions.length > 0 && (
            <li className="px-4 py-1.5 text-xs text-gray-400 dark:text-white/30 border-t border-gray-100 dark:border-white/5 italic">
              Updating…
            </li>
          )}
        </ul>
      ) : null}
    </div>
  );
}
