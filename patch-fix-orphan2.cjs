const fs = require('fs');
const path = 'C:/Users/User/Downloads/ListingBug FIGMA MVP/src/components/IntegrationsPage.tsx';
let c = fs.readFileSync(path, 'utf8');

// Find and remove the orphaned }, 400);\n    }\n that the old block left behind
const orphan = c.indexOf('  }, 400);\n    }\n  }, []);');
const orphanCrlf = c.indexOf('  }, 400);\r\n    }\r\n  }, []);');
const idx = orphan >= 0 ? orphan : orphanCrlf;
console.log('orphan at:', idx);

if (idx >= 0) {
  // Replace the orphaned bit with just the closing of useEffect
  const sep = orphan >= 0 ? '\n' : '\r\n';
  c = c.replace(`  }, 400);${sep}    }${sep}  }, []);`, `  }, []);`);
  fs.writeFileSync(path, c);
  console.log('fixed');
} else {
  console.log('NOT FOUND, checking nearby...');
  const i = c.indexOf('}, 400)');
  console.log('}, 400) at:', i, JSON.stringify(c.slice(i-10, i+30)));
}

const v = fs.readFileSync(path, 'utf8');
console.log('orphan gone:', !v.includes('}, 400)'));
