const fs = require('fs');
const path = require('path');
const srcDir = 'C:/Users/User/Downloads/ListingBug FIGMA MVP/src';

function walk(d) {
  fs.readdirSync(d).forEach(item => {
    const full = path.join(d, item);
    if (fs.statSync(full).isDirectory()) walk(full);
    else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
      const c = fs.readFileSync(full, 'utf8');
      if (c.includes('preview') && c.includes('payload') || c.includes('PreviewModal') || c.includes('TestModal') || c.includes('previewPayload')) {
        console.log('FILE:', path.basename(full));
        c.split('\n').forEach((l,i) => {
          if (l.includes('preview') && l.includes('payload') || l.includes('previewPayload') || l.includes('PreviewModal') || l.includes('TestModal') || l.includes('sampleData') || l.includes('mockData')) {
            console.log(' ', i+1, l.trim().substring(0,120));
          }
        });
      }
    }
  });
}
walk(srcDir);
