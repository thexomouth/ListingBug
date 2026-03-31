import { useState } from 'react';
import { Code, ChevronDown, ChevronUp, ExternalLink, Key, Zap, Search, Database } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface DocSection {
  id: string;
  icon: React.ElementType;
  title: string;
  summary: string;
  content: React.ReactNode;
}

export function APIDocumentationPage() {
  const [openSection, setOpenSection] = useState<string | null>('getting-started');

  const toggle = (id: string) => setOpenSection(openSection === id ? null : id);

  const sections: DocSection[] = [
    {
      id: 'getting-started',
      icon: Code,
      title: 'Getting Started',
      summary: 'Learn how to integrate ListingBug\'s real estate data API into your applications.',
      content: (
        <div className="space-y-4 text-[14px] text-gray-700 dark:text-[#EBF2FA]/80 leading-relaxed">
          <p>ListingBug's RESTful API gives you programmatic access to listing data, search capabilities, and automation features. All requests are made over HTTPS to the base URL:</p>
          <div className="bg-gray-50 dark:bg-[#1a1a1f] border border-gray-200 dark:border-white/10 rounded-lg p-4 font-mono text-sm">
            <span className="text-gray-400 select-none">Base URL: </span>
            <span className="text-[#342e37] dark:text-[#FFCE0A]">https://ynqmisrlahjberhmlviz.supabase.co/functions/v1</span>
          </div>
          <p>Before making API calls, you'll need to:</p>
          <ol className="list-none space-y-2">
            {['Generate an API key from Account → API Setup', 'Include the key in all requests via the Authorization header', 'Ensure your plan supports API access (Starter and above)'].map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="font-bold text-white bg-[#342e37] dark:bg-[#FFCE0A] dark:text-[#342e37] rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 text-[11px] mt-0.5">{i + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      ),
    },
    {
      id: 'authentication',
      icon: Key,
      title: 'Authentication',
      summary: 'All API requests require authentication using API keys generated from your account.',
      content: (
        <div className="space-y-4 text-[14px] text-gray-700 dark:text-[#EBF2FA]/80 leading-relaxed">
          <p>Include your API key in the <code className="bg-gray-100 dark:bg-[#1a1a1f] px-1.5 py-0.5 rounded text-[13px] font-mono">Authorization</code> header of every request:</p>
          <div className="bg-gray-50 dark:bg-[#1a1a1f] border border-gray-200 dark:border-white/10 rounded-lg p-4 font-mono text-sm space-y-1">
            <div><span className="text-gray-400">Authorization: </span><span className="text-[#342e37] dark:text-[#FFCE0A]">Bearer YOUR_API_KEY</span></div>
            <div><span className="text-gray-400">Content-Type: </span><span className="text-[#342e37] dark:text-[#FFCE0A]">application/json</span></div>
          </div>
          <p>Generate and manage your API keys at <strong>Account → API Setup</strong>. Keys can be revoked at any time. Each key is scoped to your account and plan limits apply to API-initiated searches.</p>
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-500/20 rounded-lg p-4">
            <p className="text-amber-800 dark:text-amber-300 text-[13px]"><strong>Keep your API key secure.</strong> Do not expose it in client-side code or public repositories. If a key is compromised, revoke it immediately from your account settings.</p>
          </div>
        </div>
      ),
    },
    {
      id: 'endpoints',
      icon: Zap,
      title: 'Endpoints',
      summary: 'Browse available API endpoints for searching listings and accessing data.',
      content: (
        <div className="space-y-6 text-[14px] text-gray-700 dark:text-[#EBF2FA]/80">
          {[
            {
              method: 'POST',
              path: '/search-listings',
              description: 'Search for property listings with filters. Returns listing data including agent contact info.',
              params: ['city / state / zipCode — location filters', 'propertyType — Single Family, Condo, Townhouse, etc.', 'minPrice / maxPrice — price range', 'minBeds / maxBeds, minBaths — bedroom and bathroom filters', 'daysOnMarketMax — maximum days on market', 'limit — max results to return (default: 50)'],
            },
            {
              method: 'GET',
              path: '/search-listings?preview=true',
              description: 'Run a preview search without consuming plan quota. Returns a limited sample of results.',
              params: ['Same filter parameters as POST /search-listings'],
            },
          ].map((ep) => (
            <div key={ep.path} className="border border-gray-200 dark:border-white/10 rounded-lg overflow-hidden">
              <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-[#1a1a1f]">
                <span className={`px-2 py-0.5 rounded text-xs font-bold font-mono ${ep.method === 'POST' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'}`}>{ep.method}</span>
                <code className="text-[13px] text-[#342e37] dark:text-[#FFCE0A] font-mono">{ep.path}</code>
              </div>
              <div className="p-4 space-y-3">
                <p>{ep.description}</p>
                <div>
                  <p className="font-semibold text-[#342e37] dark:text-white mb-2">Parameters:</p>
                  <ul className="space-y-1">
                    {ep.params.map((p, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-[#FFCE0A] flex-shrink-0">•</span>
                        <code className="text-[13px] font-mono">{p}</code>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: 'search-response',
      icon: Search,
      title: 'Response Format',
      summary: 'Understand the structure of listing data returned by the API.',
      content: (
        <div className="space-y-4 text-[14px] text-gray-700 dark:text-[#EBF2FA]/80">
          <p>Successful responses return a JSON object with a <code className="bg-gray-100 dark:bg-[#1a1a1f] px-1.5 py-0.5 rounded text-[13px] font-mono">listings</code> array. Each listing includes:</p>
          <div className="bg-gray-50 dark:bg-[#1a1a1f] border border-gray-200 dark:border-white/10 rounded-lg p-4 font-mono text-[12px] leading-relaxed overflow-x-auto whitespace-pre text-gray-700 dark:text-[#EBF2FA]/80">{`{
  "listings": [
    {
      "id": "string",
      "address": "string",
      "city": "string",
      "state": "string",
      "zipCode": "string",
      "price": number,
      "bedrooms": number,
      "bathrooms": number,
      "squareFootage": number,
      "yearBuilt": number,
      "propertyType": "string",
      "daysOnMarket": number,
      "listingDate": "ISO 8601 date",
      "status": "Active | Pending | Sold",
      "mlsNumber": "string",
      "agentName": "string",
      "agentPhone": "string",
      "agentEmail": "string",
      "officeName": "string",
      "latitude": number,
      "longitude": number
    }
  ],
  "total": number,
  "searchId": "string"
}`}</div>
        </div>
      ),
    },
    {
      id: 'rate-limits',
      icon: Database,
      title: 'Rate Limits & Quotas',
      summary: 'API usage is subject to your plan\'s monthly listing quota and request rate limits.',
      content: (
        <div className="space-y-4 text-[14px] text-gray-700 dark:text-[#EBF2FA]/80 leading-relaxed">
          <p>API-initiated searches count against your plan's monthly listing quota, the same as searches made through the ListingBug interface.</p>
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-white/10">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="bg-gray-50 dark:bg-[#1a1a1f] border-b border-gray-200 dark:border-white/10">
                  <th className="text-left p-3 font-semibold text-[#342e37] dark:text-white">Plan</th>
                  <th className="text-left p-3 font-semibold text-[#342e37] dark:text-white">Monthly Listings</th>
                  <th className="text-left p-3 font-semibold text-[#342e37] dark:text-white">API Access</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { plan: 'Trial', listings: '1,000', api: 'Yes (trial period)' },
                  { plan: 'Starter', listings: '4,000', api: 'Yes' },
                  { plan: 'Professional', listings: '10,000', api: 'Yes' },
                  { plan: 'Enterprise', listings: 'Unlimited', api: 'Yes — priority' },
                ].map((row) => (
                  <tr key={row.plan} className="border-t border-gray-100 dark:border-white/5">
                    <td className="p-3">{row.plan}</td>
                    <td className="p-3">{row.listings}</td>
                    <td className="p-3">{row.api}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>If you exceed your monthly quota, the API will return a <code className="bg-gray-100 dark:bg-[#1a1a1f] px-1.5 py-0.5 rounded font-mono">429 Too Many Requests</code> response. Quotas reset on your billing cycle date.</p>
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <Code className="w-7 h-7 text-[#FFCE0A]" />
          <h1 className="mb-0 font-bold text-[33px] dark:text-white">API Documentation</h1>
        </div>
        <p className="text-gray-600 dark:text-[#EBF2FA]/70 leading-relaxed text-[14px]">
          Comprehensive API reference for integrating ListingBug listing data into your applications.
        </p>
        <a
          href="/api-setup"
          className="inline-flex items-center gap-1.5 mt-3 text-sm text-[#FFCE0A] hover:underline font-medium"
        >
          <Key className="w-3.5 h-3.5" /> Generate your API key in Account → API Setup <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      <div className="space-y-3">
        {sections.map((section) => {
          const Icon = section.icon;
          const isOpen = openSection === section.id;
          return (
            <Card key={section.id} className="overflow-hidden border dark:border-white/10 dark:bg-[#1a1a1f]">
              <button
                className="w-full text-left"
                onClick={() => toggle(section.id)}
              >
                <CardHeader className="cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 text-[#FFCE0A] flex-shrink-0" />
                      <div>
                        <CardTitle className="font-bold text-[17px] dark:text-white text-left">{section.title}</CardTitle>
                        <p className="text-[13px] text-gray-500 dark:text-[#EBF2FA]/50 font-normal mt-0.5 text-left">{section.summary}</p>
                      </div>
                    </div>
                    {isOpen
                      ? <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      : <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />}
                  </div>
                </CardHeader>
              </button>
              {isOpen && (
                <CardContent className="pt-0 border-t border-gray-100 dark:border-white/10">
                  <div className="pt-4">{section.content}</div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
