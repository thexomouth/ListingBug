const fs = require('fs');
const path = 'C:/Users/User/Downloads/ListingBug FIGMA MVP/src/components/APIKeysSection.tsx';
let c = fs.readFileSync(path, 'utf8');

// Replace the insert to include key_hash (SHA-256 of the key using Web Crypto)
const oldInsert = `    const { data, error } = await supabase
      .from('api_keys')
      .insert({
        user_id: userId,
        name: newKeyName.trim(),
        key: fullKey,
      })
      .select()
      .single();`;

const newInsert = `    // Generate key_hash (SHA-256) — required by DB constraint
    const encoder = new TextEncoder();
    const keyBuffer = encoder.encode(fullKey);
    const hashBuffer = await crypto.subtle.digest('SHA-256', keyBuffer);
    const keyHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

    const { data, error } = await supabase
      .from('api_keys')
      .insert({
        user_id: userId,
        name: newKeyName.trim(),
        key: fullKey,
        key_hash: keyHash,
      })
      .select()
      .single();`;

if (c.includes(oldInsert.trim().slice(0, 60))) {
  c = c.replace(oldInsert, newInsert);
  console.log('patched');
} else {
  // Try regex
  c = c.replace(
    /const \{ data, error \} = await supabase\s+\.from\('api_keys'\)\s+\.insert\(\{\s+user_id: userId,\s+name: newKeyName\.trim\(\),\s+key: fullKey,\s+\}\)/,
    `// Generate key_hash (SHA-256) — required by DB constraint
    const encoder = new TextEncoder();
    const keyBuffer = encoder.encode(fullKey);
    const hashBuffer = await crypto.subtle.digest('SHA-256', keyBuffer);
    const keyHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

    const { data, error } = await supabase
      .from('api_keys')
      .insert({
        user_id: userId,
        name: newKeyName.trim(),
        key: fullKey,
        key_hash: keyHash,
      })`
  );
  console.log('regex patched');
}

fs.writeFileSync(path, c);
console.log(c.includes('key_hash') ? 'key_hash present' : 'NOT FOUND');
