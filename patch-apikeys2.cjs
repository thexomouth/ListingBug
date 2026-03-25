const fs = require('fs');
const path = 'C:/Users/User/Downloads/ListingBug FIGMA MVP/src/components/APIKeysSection.tsx';
let c = fs.readFileSync(path, 'utf8');

c = c.replace(
  /\.insert\(\{\s*user_id: userId,\s*name: newKeyName\.trim\(\),\s*key: fullKey,\s*key_hash: keyHash,\s*\}\)/,
  `.insert({
        user_id: userId,
        name: newKeyName.trim(),
        key: fullKey,
        key_hash: keyHash,
        key_preview: \`\${fullKey.substring(0, 16)}...\`,
      })`
);

fs.writeFileSync(path, c);
console.log(c.includes('key_preview') ? 'key_preview added' : 'NOT FOUND');
