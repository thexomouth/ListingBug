const fs = require('fs');
const projectPath = 'C:/Users/User/Downloads/ListingBug FIGMA MVP';
const headLines = fs.readFileSync(`${projectPath}/automations-head.tsx`, 'utf8').split('\n');

console.log('HEAD total lines:', headLines.length);

// Show lines 530-535 to confirm the cut point before the second loadAutomations fragment
console.log('\nLines 530-536:');
for (let i = 529; i <= 535; i++) {
  console.log(i+1, ':', JSON.stringify(headLines[i]));
}

// Show lines 671-676 to confirm the return( cut point
console.log('\nLines 671-677:');
for (let i = 670; i <= 676; i++) {
  console.log(i+1, ':', JSON.stringify(headLines[i]));
}
