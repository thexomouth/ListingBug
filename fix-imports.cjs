const fs = require('fs');
const path = 'C:/Users/User/Downloads/ListingBug FIGMA MVP/src/components/AutomationsManagementPage.tsx';
let c = fs.readFileSync(path, 'utf8');

// Fix 1: remove duplicate Play import — the second one in the lucide block
// The block has Play twice: once early, once before Loader2
c = c.replace(
  `  Download,\r\n  Play,\r\n  Loader2`,
  `  Download,\r\n  Loader2`
);
// Also try without \r\n in case of LF only
c = c.replace(
  `  Download,\n  Play,\n  Loader2`,
  `  Download,\n  Loader2`
);

// Fix 2: sonner@2.0.3 → sonner
c = c.replace(/from 'sonner@[^']+'/g, "from 'sonner'");

fs.writeFileSync(path, c);

const v = fs.readFileSync(path, 'utf8');
console.log('Play import count:', (v.match(/^  Play,\r?$/gm)||[]).length, '(should be 1)');
console.log('sonner import:', (v.match(/from 'sonner'/g)||[]).length, '(should be 1)');
console.log('sonner versioned gone:', !v.includes("from 'sonner@"));
