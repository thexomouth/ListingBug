const fs = require('fs');
const SUPABASE_URL = 'https://ynqmisrlahjberhmlviz.supabase.co';

const files = [
  'C:/Users/User/Downloads/ListingBug FIGMA MVP/src/components/IntegrationConnectionModal.tsx',
  'C:/Users/User/Downloads/ListingBug FIGMA MVP/src/components/AutomationsManagementPage.tsx',
];

files.forEach(path => {
  let c = fs.readFileSync(path, 'utf8');
  const before = (c.match(/VITE_SUPABASE_URL/g) || []).length;
  c = c.replaceAll('${import.meta.env.VITE_SUPABASE_URL}', SUPABASE_URL);
  c = c.replaceAll('import.meta.env.VITE_SUPABASE_URL', `'${SUPABASE_URL}'`);
  const after = (c.match(/VITE_SUPABASE_URL/g) || []).length;
  fs.writeFileSync(path, c);
  console.log(path.split('/').pop(), ': replaced', before - after, 'of', before);
});
