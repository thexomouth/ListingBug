const { execSync } = require('child_process');
const fs = require('fs');

const projectPath = 'C:/Users/User/Downloads/ListingBug FIGMA MVP';
const filePath = 'src/components/AutomationsManagementPage.tsx';

// Get the file from HEAD using git show
try {
  const gitContent = execSync(
    `"C:\\Program Files\\Git\\bin\\git.exe" show HEAD:${filePath}`,
    { cwd: projectPath, maxBuffer: 10 * 1024 * 1024, timeout: 30000 }
  ).toString();
  
  fs.writeFileSync(`${projectPath}/automations-head.tsx`, gitContent);
  const lines = gitContent.split('\n');
  console.log('HEAD version lines:', lines.length);
  
  // Find the return ( in the HEAD version
  const returnIdx = lines.findIndex((l, i) => i > 200 && l.trim() === 'return (');
  console.log('return( at index:', returnIdx, '| line:', returnIdx + 1);
  
  // Also find export function
  const exportMatches = [];
  lines.forEach((l, i) => {
    if (l.includes('export function AutomationsManagementPage')) exportMatches.push(i + 1);
  });
  console.log('export fn at lines:', exportMatches);
  
  // Save just the JSX portion
  if (returnIdx > 0) {
    const jsxPart = lines.slice(returnIdx).join('\n');
    fs.writeFileSync(`${projectPath}/automations-jsx-only.txt`, jsxPart);
    console.log('JSX part saved, lines:', lines.slice(returnIdx).length);
    console.log('First 3 lines of JSX:', lines.slice(returnIdx, returnIdx + 3));
    console.log('Last 3 lines:', lines.slice(-3));
  }
} catch (e) {
  console.error('Git error:', e.message);
}
