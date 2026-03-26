const fs = require('fs');
const path = require('path');

// Check edge functions too
const efDir = 'C:/Users/User/Downloads/ListingBug FIGMA MVP/supabase/functions';
function checkDir(d) {
  try {
    fs.readdirSync(d).forEach(item => {
      const full = path.join(d, item);
      if (fs.statSync(full).isDirectory()) checkDir(full);
      else if (item.endsWith('.ts')) {
        const c = fs.readFileSync(full, 'utf8');
        if (c.includes('trial') && c.includes('slot')) {
          c.split('\n').forEach((l,i) => {
            if (l.includes('trial') && (l.includes('slot') || l.includes('auto') || l.includes('0'))) {
              console.log(`${path.basename(full)}:${i+1}`, l.trim().substring(0,120));
            }
          });
        }
      }
    });
  } catch(e) {}
}
checkDir(efDir);

// Check Dashboard
const db = fs.readFileSync('C:/Users/User/Downloads/ListingBug FIGMA MVP/src/components/Dashboard.tsx', 'utf8');
db.split('\n').forEach((l,i) => {
  if (l.includes('PLAN_SLOTS') || (l.includes('trial') && l.includes('slot'))) console.log(`Dashboard:${i+1}`, l.trim().substring(0,120));
});
