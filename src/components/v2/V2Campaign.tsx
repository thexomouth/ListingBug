// Individual campaign detail page — deferred
// Route: /v2/campaign?id=<campaign_id>
// Visual reference: /Users/jake/Downloads/listingbug_customer_dashboard.html

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export function V2Campaign() {
  const [campaignName, setCampaignName] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const campaignId = params.get('id');
    if (!campaignId) return;

    supabase
      .from('campaigns')
      .select('campaign_name')
      .eq('id', campaignId)
      .single()
      .then(({ data }) => {
        if (data) setCampaignName(data.campaign_name);
      });
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-[#0f0f0f] flex items-center justify-center">
      <div className="text-center px-4">
        <div className="text-base font-medium text-foreground mb-2">
          {campaignName || 'Campaign detail'}
        </div>
        <div className="text-sm text-muted-foreground mb-6">
          Full activity view coming soon.
        </div>
        <button
          onClick={() => { window.location.href = '/v2/dashboard'; }}
          className="px-5 py-2 rounded-lg text-sm font-medium"
          style={{ background: '#F3C302', color: '#2c2600' }}
        >
          ← Back to dashboard
        </button>
      </div>
    </div>
  );
}
