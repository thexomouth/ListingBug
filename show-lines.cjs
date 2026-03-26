const fs = require('fs');
const projectPath = 'C:/Users/User/Downloads/ListingBug FIGMA MVP';
const headLines = fs.readFileSync(`${projectPath}/automations-head.tsx`, 'utf8').split('\n');

// Show lines 535-560 to find exact corruption start
console.log('=== Lines 535-560 ===');
for (let i = 534; i <= 559; i++) {
  console.log(`${i+1}: ${headLines[i]}`);
}
