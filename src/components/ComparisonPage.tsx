import { useLocation, Link } from "react-router-dom";
import { CheckCircle2, XCircle, ArrowRight, ChevronRight } from "lucide-react";

interface ComparisonRow {
  feature: string;
  us: string | true | false;
  them: string | true | false;
}

interface ComparisonData {
  slug: string;
  competitor: string;
  metaTitle: string;
  h1: string;
  subheadline: string;
  ourTagline: string;
  theirTagline: string;
  rows: ComparisonRow[];
  keyDifference: { heading: string; body: string };
  whenTheyWin: string;
  whenWeWin: string[];
  ctaHeading: string;
  ctaBody: string;
  relatedSlugs: { slug: string; label: string }[];
}

const comparisons: ComparisonData[] = [
  {
    slug: "zillow",
    competitor: "Zillow",
    metaTitle: "ListingBug vs Zillow | Built for Real Estate Professionals",
    h1: "ListingBug vs Zillow",
    subheadline:
      "Zillow is built for homebuyers. ListingBug is built for real estate service providers. Here's exactly what the difference means for your business.",
    ourTagline: "Real estate service provider platform — listing data, agent contacts, CRM integrations, and workflow automation.",
    theirTagline: "Consumer real estate portal — property search, Zestimates, and connecting buyers with agents.",
    rows: [
      { feature: "Primary audience", us: "Real estate service providers & professionals", them: "Homebuyers & sellers" },
      { feature: "Listing agent contact info (phone + email)", us: true, them: false },
      { feature: "CRM integration (HubSpot, Salesforce, Zoho)", us: true, them: false },
      { feature: "Email marketing integration (Mailchimp, Constant Contact, SendGrid)", us: true, them: false },
      { feature: "Automation / scheduled recurring searches", us: true, them: false },
      { feature: "Zapier / Make.com / n8n integration", us: true, them: false },
      { feature: "Webhook / API access", us: true, them: false },
      { feature: "CSV export of search results", us: true, them: false },
      { feature: "Filter by year built", us: true, them: "Limited" },
      { feature: "Filter by days on market (0-day for new listings)", us: true, them: "Basic" },
      { feature: "Price drop / re-listed property filter", us: true, them: "Partial" },
      { feature: "Multiple markets simultaneously", us: true, them: false },
      { feature: "Data delivered into your workflow tools", us: true, them: false },
      { feature: "Homebuyer property search", us: false, them: true },
      { feature: "Zestimate / consumer valuation", us: false, them: true },
      { feature: "Agent advertising (Premier Agent)", us: false, them: true },
    ],
    keyDifference: {
      heading: "The integration gap is what matters most",
      body: "Zillow has no integrations with professional tools. When you get a new listing alert from Zillow, it arrives in your email — and stays there. There's no path from 'new listing notification' to 'contact added to HubSpot with sequence enrolled.' ListingBug's nine native integrations — HubSpot, Salesforce, Zoho CRM, Mailchimp, Constant Contact, SendGrid, Zapier, Make.com, and generic webhooks — mean new listing data flows directly into the tools where your outreach workflows already live. That's the fundamental difference.",
    },
    whenTheyWin:
      "If you're a homebuyer or seller looking for properties, Zillow is excellent and ListingBug isn't built for you. If you're a real estate agent seeking buyer leads through paid advertising, Zillow Premier Agent may be worth exploring.",
    whenWeWin: [
      "You need listing agent contact information (phone + email) with every search result.",
      "You want new listing data to flow automatically into your CRM, email tool, or automation platform.",
      "You need to monitor multiple markets simultaneously on a recurring schedule.",
      "You want to filter by year built, price drops, or re-listed properties to find specific opportunity types.",
      "You need CSV export or API/webhook access for custom integrations.",
      "You're a home inspector, stager, contractor, mortgage broker, photographer, insurance agent, or any other real estate service provider.",
    ],
    ctaHeading: "See what ListingBug can do for your business",
    ctaBody:
      "14-day free trial. No credit card required. Connect your CRM and run your first automation in under 10 minutes.",
    relatedSlugs: [
      { slug: "real-estate-listing-alerts-guide", label: "The Complete Guide to Real Estate Listing Alerts" },
      { slug: "automate-agent-outreach", label: "How to Automate Real Estate Agent Outreach" },
      { slug: "listing-alerts-for-mortgage-brokers", label: "Listing Alerts for Mortgage Brokers" },
    ],
  },
];

const comparisonMap = Object.fromEntries(comparisons.map((c) => [c.slug, c]));

function Cell({ value }: { value: string | boolean }) {
  if (value === true) return <CheckCircle2 className="w-5 h-5 text-green-500" />;
  if (value === false) return <XCircle className="w-5 h-5 text-gray-300 dark:text-white/20" />;
  return <span className="text-sm text-gray-600 dark:text-[#EBF2FA]/70">{value}</span>;
}

export function ComparisonPage() {
  const location = useLocation();
  const slug = location.pathname.replace("/vs/", "");
  const data = comparisonMap[slug];

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#0F1115]">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#342e37] dark:text-white mb-4">Comparison not found</h1>
          <Link to="/" className="text-[#FFCE0A] hover:underline">← Back to home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0F1115]">

      {/* Hero */}
      <section className="bg-gray-50 dark:bg-[#141418] border-b border-gray-200 dark:border-white/10 py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-[#342e37] dark:text-white mb-5">
            {data.h1}
          </h1>
          <p className="text-lg text-gray-600 dark:text-[#EBF2FA]/70 max-w-2xl mx-auto mb-10">
            {data.subheadline}
          </p>
          {/* Taglines */}
          <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto text-left">
            <div className="p-5 rounded-xl bg-[#FFCE0A]/10 border border-[#FFCE0A]/30">
              <p className="text-xs font-bold text-[#FFCE0A] uppercase tracking-wide mb-2">ListingBug</p>
              <p className="text-sm text-[#342e37] dark:text-white leading-relaxed">{data.ourTagline}</p>
            </div>
            <div className="p-5 rounded-xl bg-gray-100 dark:bg-[#1a1a1f] border border-gray-200 dark:border-white/10">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">{data.competitor}</p>
              <p className="text-sm text-gray-600 dark:text-[#EBF2FA]/70 leading-relaxed">{data.theirTagline}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison table */}
      <section className="py-16 px-6 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-[#342e37] dark:text-white mb-8">Feature comparison</h2>
        <div className="rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-[#1a1a1f] border-b border-gray-200 dark:border-white/10">
                <th className="text-left p-4 text-gray-500 dark:text-[#EBF2FA]/50 font-medium w-1/2">Feature</th>
                <th className="text-center p-4 font-bold text-[#342e37] dark:text-[#FFCE0A] w-1/4">ListingBug</th>
                <th className="text-center p-4 font-medium text-gray-500 dark:text-[#EBF2FA]/50 w-1/4">{data.competitor}</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row, i) => (
                <tr
                  key={i}
                  className="border-t border-gray-100 dark:border-white/5 hover:bg-gray-50/50 dark:hover:bg-white/[0.02]"
                >
                  <td className="p-4 text-gray-700 dark:text-[#EBF2FA]/80">{row.feature}</td>
                  <td className="p-4 text-center">
                    <div className="flex justify-center"><Cell value={row.us} /></div>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex justify-center"><Cell value={row.them} /></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Key difference */}
      <section className="bg-gray-50 dark:bg-[#141418] py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-[#342e37] dark:text-white mb-5">
            {data.keyDifference.heading}
          </h2>
          <p className="text-gray-600 dark:text-[#EBF2FA]/80 leading-relaxed text-lg">
            {data.keyDifference.body}
          </p>
        </div>
      </section>

      {/* When each wins */}
      <section className="py-16 px-6 max-w-4xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-bold text-[#342e37] dark:text-white mb-5">
              When {data.competitor} is the right choice
            </h2>
            <div className="p-6 rounded-xl bg-gray-50 dark:bg-[#1a1a1f] border border-gray-200 dark:border-white/10">
              <p className="text-gray-600 dark:text-[#EBF2FA]/70 text-sm leading-relaxed">
                {data.whenTheyWin}
              </p>
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#342e37] dark:text-white mb-5">
              When ListingBug is the right choice
            </h2>
            <ul className="space-y-3">
              {data.whenWeWin.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-[#FFCE0A] mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-[#EBF2FA]/80 leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Related reading */}
      <section className="bg-gray-50 dark:bg-[#141418] py-14 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-lg font-bold text-[#342e37] dark:text-white mb-6">Related reading</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {data.relatedSlugs.map((post) => (
              <Link
                key={post.slug}
                to={`/blog/${post.slug}`}
                className="group flex items-start gap-2 p-5 rounded-xl border border-gray-200 dark:border-white/10 hover:border-[#FFCE0A]/40 dark:bg-[#1a1a1f] transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-[#FFCE0A] mt-0.5 flex-shrink-0" />
                <span className="text-sm text-[#342e37] dark:text-white font-medium leading-snug group-hover:text-[#FFCE0A] transition-colors">
                  {post.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-[#FFCE0A]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-[#342e37] mb-4">{data.ctaHeading}</h2>
          <p className="text-[#342e37]/80 text-lg mb-8">{data.ctaBody}</p>
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 px-10 py-4 bg-[#342e37] text-white font-bold text-base rounded-lg hover:bg-[#231e25] transition-colors"
          >
            Start Free Trial <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
