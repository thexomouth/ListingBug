const fs = require('fs');
const PNG = require('pngjs').PNG;

const buf = fs.readFileSync('/mnt/user-data/uploads/listing_bug_bug_logo.png');
const png = PNG.sync.read(buf);
console.log('width:', png.width, 'height:', png.height);

// Sample key pixel positions to understand the design
// Center of image
const cx = Math.floor(png.width / 2);
const cy = Math.floor(png.height / 2);

function px(x, y) {
  const i = (y * png.width + x) * 4;
  return { r: png.data[i], g: png.data[i+1], b: png.data[i+2], a: png.data[i+3] };
}

console.log('center pixel:', px(cx, cy));
console.log('top-left:', px(0, 0));
console.log('top-right:', px(png.width-1, 0));

// Scan for bounding box of dark content (the bug icon)
let minX = png.width, maxX = 0, minY = png.height, maxY = 0;
for (let y = 0; y < png.height; y++) {
  for (let x = 0; x < png.width; x++) {
    const p = px(x, y);
    // Dark pixel = part of the bug icon (r < 100)
    if (p.r < 100 && p.a > 200) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
}
console.log('dark content bounds:', {minX, maxX, minY, maxY});
console.log('content width:', maxX - minX, 'height:', maxY - minY);
console.log('content center X:', Math.floor((minX+maxX)/2), 'Y:', Math.floor((minY+maxY)/2));
