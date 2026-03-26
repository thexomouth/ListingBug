const fs = require('fs');
const path = 'C:/Users/User/Downloads/ListingBug FIGMA MVP/src/components/IntegrationsPage.tsx';
let c = fs.readFileSync(path, 'utf8');

const start = c.indexOf('    const justConnected = params.get(\'connected\');');
const end = c.indexOf('  }, ', start) + 5;

const oldBlock = c.slice(start, end);
console.log('replacing:', JSON.stringify(oldBlock.slice(0, 200)));

const newBlock = `    const justConnected = params.get('connected');
    if (justConnected) {
      window.history.replaceState({}, '', '/integrations');
      // Reload connected state from DB then show success
      loadConnectedIntegrations().then(() => {
        const names: Record<string, string> = {
          google: 'Google Sheets', mailchimp: 'Mailchimp', hubspot: 'HubSpot',
          sendgrid: 'SendGrid', twilio: 'Twilio',
        };
        toast.success(\`\${names[justConnected] ?? justConnected} connected successfully!\`);
      });
    }
  }, `;

c = c.slice(0, start) + newBlock + c.slice(end);
fs.writeFileSync(path, c);
console.log('done, modal no longer opened on return:', !c.includes('handleConnectClick(justConnected)'));
