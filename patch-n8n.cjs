const fs = require('fs');
const path = 'C:/Users/User/Downloads/ListingBug FIGMA MVP/src/components/CreateAutomationModal.tsx';
let c = fs.readFileSync(path, 'utf8');

// Find the webhook entry and insert n8n after it
const webhookEntry = c.indexOf("id: 'webhook'");
const webhookEnd = c.indexOf('    }', webhookEntry) + 5;
console.log('webhook ends at:', webhookEnd, JSON.stringify(c.slice(webhookEnd, webhookEnd+20)));

const n8nEntry = `,
    { 
      id: 'n8n', 
      name: 'n8n', 
      icon: Webhook, 
      connected: connectedIds.has('n8n'), 
      requiresSetup: true,
      setupFields: [
        { key: 'webhook_url', label: 'n8n Webhook URL', placeholder: 'https://your-n8n.com/webhook/...', type: 'url', hint: 'From a Webhook trigger node in your n8n workflow' },
        { key: 'send_mode', label: 'Delivery Mode', type: 'select', options: [{value:'batch',label:'Batch (one request with all listings)'},{value:'individual',label:'Individual (one request per listing)'}] }
      ]
    }`;

c = c.slice(0, webhookEnd) + n8nEntry + c.slice(webhookEnd);
fs.writeFileSync(path, c);
console.log('n8n added:', fs.readFileSync(path,'utf8').includes("id: 'n8n'"));
