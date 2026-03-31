import { Link } from "react-router-dom";
import { posts } from "./BlogPostPage";
import { Clock, ArrowRight, BookOpen } from "lucide-react";

const CATEGORY_COLORS: Record<string, string> = {
  "Strategy": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  "Use Cases": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  "How-To": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  "Tools & Comparison": "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
};

export function BlogPage() {
  const featured = posts[0];
  const rest = posts.slice(1);

  return (
    <div className="min-h-screen bg-white dark:bg-[#0F1115]">

      {/* Hero */}
      <div className="bg-gray-50 dark:bg-[#141418] border-b border-gray-200 dark:border-white/10 py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-5">
            <BookOpen className="w-7 h-7 text-[#FFCE0A]" />
            <h1 className="text-4xl font-bold text-[#342e37] dark:text-white">Blog</h1>
          </div>
          <p className="text-lg text-gray-600 dark:text-[#EBF2FA]/70 max-w-xl">
            Strategy, how-tos, and real-world use cases for real estate service providers using listing data to grow their business.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-14">

        {/* Featured post */}
        <div className="mb-14">
          <p className="text-xs font-semibold text-[#FFCE0A] uppercase tracking-widest mb-5">Featured</p>
          <Link
            to={`/blog/${featured.slug}`}
            className="group flex flex-col md:flex-row gap-8 p-8 rounded-2xl border border-gray-200 dark:border-white/10 hover:border-[#FFCE0A]/50 dark:bg-[#1a1a1f] transition-colors"
          >
            <div className="flex-1">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-4 ${CATEGORY_COLORS[featured.category] ?? "bg-gray-100 text-gray-600"}`}>
                {featured.category}
              </span>
              <h2 className="text-2xl font-bold text-[#342e37] dark:text-white mb-3 leading-snug group-hover:text-[#FFCE0A] transition-colors">
                {featured.title}
              </h2>
              <p className="text-gray-600 dark:text-[#EBF2FA]/70 leading-relaxed mb-5 text-sm">
                {featured.excerpt}
              </p>
              <div className="flex items-center gap-4 text-xs text-gray-400 dark:text-[#EBF2FA]/40">
                <span>{featured.date}</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{featured.readTime}</span>
              </div>
            </div>
            <div className="flex items-center md:items-end">
              <span className="inline-flex items-center gap-2 text-[#FFCE0A] font-semibold text-sm whitespace-nowrap">
                Read article <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </div>
          </Link>
        </div>

        {/* All posts grid */}
        <div>
          <p className="text-xs font-semibold text-gray-400 dark:text-[#EBF2FA]/40 uppercase tracking-widest mb-7">All articles</p>
          <div className="grid md:grid-cols-2 gap-6">
            {rest.map((post) => (
              <Link
                key={post.slug}
                to={`/blog/${post.slug}`}
                className="group flex flex-col p-6 rounded-xl border border-gray-200 dark:border-white/10 hover:border-[#FFCE0A]/50 dark:bg-[#1a1a1f] transition-colors"
              >
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold mb-3 self-start ${CATEGORY_COLORS[post.category] ?? "bg-gray-100 text-gray-600"}`}>
                  {post.category}
                </span>
                <h2 className="font-bold text-[#342e37] dark:text-white mb-3 leading-snug text-base group-hover:text-[#FFCE0A] transition-colors">
                  {post.title}
                </h2>
                <p className="text-sm text-gray-600 dark:text-[#EBF2FA]/60 leading-relaxed mb-4 flex-1">
                  {post.excerpt}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-[#EBF2FA]/40">
                    <span>{post.date}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{post.readTime}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#FFCE0A] group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 p-8 bg-[#342e37] dark:bg-[#1e1e24] rounded-2xl text-center">
          <h2 className="text-2xl font-bold text-white mb-3">Ready to automate your outreach?</h2>
          <p className="text-white/70 mb-6 text-sm">Start a 14-day free trial — no credit card required.</p>
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 px-8 py-3 bg-[#FFCE0A] hover:bg-[#FFD447] text-[#342e37] font-bold rounded-lg transition-colors"
          >
            Start Free Trial <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
