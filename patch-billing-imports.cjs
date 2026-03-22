const fs = require('fs');

// Fix BillingPage useState import to add useEffect
const bpPath = 'C:\\Users\\User\\Downloads\\ListingBug FIGMA MVP\\src\\components\\BillingPage.tsx';
let bp = fs.readFileSync(bpPath, 'utf8');

if (!bp.includes('useEffect')) {
  bp = bp.replace(
    "import { useState } from 'react';",
    "import { useState, useEffect } from 'react';\nimport { supabase } from '../lib/supabase';"
  );
  fs.writeFileSync(bpPath, bp, 'utf8');
  console.log('BillingPage imports fixed');
} else {
  console.log('BillingPage already has useEffect');
}
