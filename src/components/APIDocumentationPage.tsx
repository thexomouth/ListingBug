import { Code } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

export function APIDocumentationPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <Code className="w-7 h-7 text-[#342e37]" />
          <h1 className="mb-0 text-4xl font-bold text-[36px]">API Documentation</h1>
        </div>
        <p className="text-gray-600 leading-relaxed text-[14px]">
          Comprehensive API reference and integration guides
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-bold text-[21px]">Getting Started</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 leading-relaxed text-[14px]">
              Learn how to integrate ListingBug's powerful real estate data API into your applications.
              Our RESTful API provides programmatic access to all listing data, search capabilities, and automation features.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-bold text-[21px]">Authentication</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 leading-relaxed text-[14px]">
              All API requests require authentication using API keys. You can generate and manage your API keys
              from your account settings.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-bold text-[21px]">Endpoints</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 leading-relaxed text-[14px]">
              Browse our complete API endpoints for searching listings, managing reports, and accessing historical data.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}