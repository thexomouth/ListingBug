const fs = require('fs');
const path = 'C:/Users/User/Downloads/ListingBug FIGMA MVP/src/components/IntegrationsPage.tsx';
let c = fs.readFileSync(path, 'utf8');

// Fix sheets → google using indexOf
const start = c.indexOf("id: 'sheets'");
const end = c.indexOf("category: 'available'", start) + "category: 'available'".length;
console.log('found:', start, end, JSON.stringify(c.slice(start, start+30)));

const replacement = `id: 'google', \r\n      name: 'Google Sheets', \r\n      icon: FileSpreadsheet, \r\n      connected: false, \r\n      description: 'Append listing data as rows in a spreadsheet',\r\n      category: 'available'`;

c = c.slice(0, start) + replacement + c.slice(end);
fs.writeFileSync(path, c);
console.log('fixed:', fs.readFileSync(path,'utf8').includes("id: 'google'"));
