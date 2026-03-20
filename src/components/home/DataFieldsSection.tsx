import { Database, CheckCircle } from 'lucide-react';

export function DataFieldsSection() {
  const dataCategories = [
    {
      name: 'Location Information',
      fields: [
        { name: 'Unique ID', memberOnly: false },
        { name: 'Formatted Address', memberOnly: false },
        { name: 'Address Line 1', memberOnly: false },
        { name: 'City', memberOnly: false },
        { name: 'State', memberOnly: false },
        { name: 'ZIP Code', memberOnly: false },
        { name: 'County', memberOnly: false },
        { name: 'Latitude', memberOnly: false },
        { name: 'Longitude', memberOnly: false },
      ],
    },
    {
      name: 'Property Details',
      fields: [
        { name: 'Property Type', memberOnly: false },
        { name: 'Bedrooms', memberOnly: false },
        { name: 'Bathrooms', memberOnly: false },
        { name: 'Square Footage', memberOnly: false },
        { name: 'Lot Size', memberOnly: false },
        { name: 'Year Built', memberOnly: false },
      ],
    },
    {
      name: 'Listing Information',
      fields: [
        { name: 'Price', memberOnly: false },
        { name: 'Status', memberOnly: false },
        { name: 'Days on Market', memberOnly: false },
        { name: 'Listing Date', memberOnly: false },
        { name: 'Last Seen Date', memberOnly: false },
        { name: 'Removed Date', memberOnly: false },
        { name: 'Created Date', memberOnly: false },
      ],
    },
    {
      name: 'Agent Information',
      fields: [
        { name: 'Agent Name', memberOnly: false },
        { name: 'Agent Email', memberOnly: true },
        { name: 'Agent Phone', memberOnly: true },
        { name: 'Agent Website', memberOnly: true },
      ],
    },
    {
      name: 'Office Information',
      fields: [
        { name: 'Office Name', memberOnly: false },
        { name: 'Office Email', memberOnly: true },
        { name: 'Office Phone', memberOnly: true },
        { name: 'Office Website', memberOnly: true },
        { name: 'Broker Name', memberOnly: false },
      ],
    },
    {
      name: 'MLS Information',
      fields: [
        { name: 'MLS Number', memberOnly: false },
        { name: 'MLS Name', memberOnly: false },
      ],
    },
    {
      name: 'Builder Information',
      fields: [
        { name: 'Builder Name', memberOnly: false },
        { name: 'Builder Phone', memberOnly: true },
        { name: 'Builder Email', memberOnly: true },
      ],
    },
    {
      name: 'Special Filters',
      fields: [
        { name: 'Re-Listed Properties', memberOnly: false },
        { name: 'Price Drops', memberOnly: false },
        { name: 'New Construction', memberOnly: false },
        { name: 'Foreclosures', memberOnly: false },
      ],
    },
  ];

  // Find the maximum number of fields in any category
  const maxFields = Math.max(...dataCategories.map(cat => cat.fields.length));

  return (
    <div className="bg-white dark:bg-[#0F1115] py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-8 md:mb-12 text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Database className="w-5 h-5 md:w-6 md:h-6 text-[#342e37] dark:text-[#FFCE0A]" />
            <h2 className="mb-0 md:text-[36px] font-bold text-[48px] dark:text-white">Complete Data Table</h2>
          </div>
          <p className="text-gray-600 dark:text-[#EBF2FA] text-[14px] max-w-3xl mx-auto">
            Access 41 verified data points for every property listing in your market.
          </p>
        </div>

        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
          <div className="border-2 border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-[#0F1115] shadow-lg">
            <table className="w-full">
              <thead>
                <tr className="bg-[#342e37] dark:bg-[#2F2F2F]">
                  {dataCategories.map((category) => (
                    <th
                      key={category.name}
                      className="py-3 px-3 text-white text-[14px] text-center align-top border-r border-white/20 last:border-r-0 font-bold leading-tight"
                    >
                      <div className="break-words whitespace-normal">
                        {category.name}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="dark:bg-[#0F1115]">
                {Array.from({ length: maxFields }).map((_, rowIndex) => (
                  <tr key={rowIndex} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                    {dataCategories.map((category) => (
                      <td
                        key={`${category.name}-${rowIndex}`}
                        className={`py-2.5 px-3 text-center text-[13px] border-r border-gray-100 dark:border-gray-700 last:border-r-0 align-middle ${
                          category.fields[rowIndex]?.memberOnly ? 'bg-yellow-50 dark:bg-[#FFCE0A]/20' : 'bg-white dark:bg-[#0F1115]'
                        }`}
                      >
                        {category.fields[rowIndex] ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <CheckCircle className="w-3.5 h-3.5 text-green-600 dark:text-green-500 flex-shrink-0" />
                            <span className="text-gray-900 dark:text-white text-[13px]">{category.fields[rowIndex]?.name}</span>
                          </div>
                        ) : (
                          <span className="text-gray-300 dark:text-gray-600">—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Legend */}
          <div className="mt-4 flex items-center justify-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-white border border-gray-300 rounded"></div>
              <span className="text-gray-600 dark:text-[#EBF2FA] text-[13px]">Sample Items</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-50 border border-gray-300 rounded"></div>
              <span className="text-gray-600 dark:text-[#EBF2FA] text-[13px]">Member Only</span>
            </div>
          </div>
        </div>

        {/* Tablet View (3 columns) */}
        <div className="hidden md:block lg:hidden">
          <div className="grid grid-cols-3 gap-2">
            {dataCategories.slice(0, 6).map((category) => (
              <div key={category.name} className={`border-2 border-gray-200 rounded-lg overflow-hidden ${category.fields.some(field => field.memberOnly) ? 'bg-yellow-50' : 'bg-white'}`}>
                <div className="bg-[#342e37] py-1.5 px-2">
                  <h3 className="text-white text-[11px] font-bold text-center leading-tight">{category.name}</h3>
                </div>
                <div className="p-1.5 space-y-0.5">
                  {category.fields.map((field) => (
                    <div key={field.name} className="flex items-start gap-1.5 text-[11px] py-0.5">
                      <CheckCircle className="w-2.5 h-2.5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 leading-tight">{field.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          {/* Builder Information Card - Full Width on Tablet */}
          {dataCategories.length > 6 && (
            <div className={`mt-2 border-2 border-gray-200 rounded-lg overflow-hidden ${dataCategories[6].fields.some(field => field.memberOnly) ? 'bg-yellow-50' : 'bg-white'}`}>
              <div className="bg-[#342e37] py-1.5 px-2">
                <h3 className="text-white text-[11px] font-bold text-center leading-tight">{dataCategories[6].name}</h3>
              </div>
              <div className="p-1.5 grid grid-cols-2 gap-x-2 gap-y-0.5">
                {dataCategories[6].fields.map((field) => (
                  <div key={field.name} className="flex items-start gap-1.5 text-[11px] py-0.5">
                    <CheckCircle className="w-2.5 h-2.5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 leading-tight">{field.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Special Filters Card - Full Width on Tablet */}
          {dataCategories.length > 7 && (
            <div className={`mt-2 border-2 border-gray-200 rounded-lg overflow-hidden ${dataCategories[7].fields.some(field => field.memberOnly) ? 'bg-yellow-50' : 'bg-white'}`}>
              <div className="bg-[#342e37] py-1.5 px-2">
                <h3 className="text-white text-[11px] font-bold text-center leading-tight">{dataCategories[7].name}</h3>
              </div>
              <div className="p-1.5 grid grid-cols-2 gap-x-2 gap-y-0.5">
                {dataCategories[7].fields.map((field) => (
                  <div key={field.name} className="flex items-start gap-1.5 text-[11px] py-0.5">
                    <CheckCircle className="w-2.5 h-2.5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 leading-tight">{field.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Legend */}
          <div className="mt-4 flex items-center justify-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-white border border-gray-300 rounded"></div>
              <span className="text-gray-600 text-[13px]">Sample Items</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-50 border border-gray-300 rounded"></div>
              <span className="text-gray-600 text-[13px]">Member Only</span>
            </div>
          </div>
        </div>

        {/* Mobile View (Stacked Cards) */}
        <div className="block md:hidden space-y-2 m-[0px] p-[0px]">
          {dataCategories.map((category) => (
            <div key={category.name} className={`border-2 border-gray-200 rounded-lg overflow-hidden ${category.fields.some(field => field.memberOnly) ? 'bg-yellow-50' : 'bg-white'}`}>
              <div className="bg-[#342e37] py-1 px-1.5">
                <h3 className="text-white text-[18px] text-center font-bold leading-tight font-normal">{category.name}</h3>
              </div>
              <div className="p-1.5 grid grid-cols-2 gap-x-1.5 gap-y-0.5 mt-[0px] mr-[0px] mb-[12px] ml-[0px] m-[0px]">
                {category.fields.map((field) => (
                  <div key={field.name} className="flex items-start gap-1 text-[10px] py-[2px] px-[3px]">
                    <CheckCircle className="w-2.5 h-2.5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 leading-tight break-words text-[14px]">{field.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          {/* Legend */}
          <div className="mt-4 flex items-center justify-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-white border border-gray-300 rounded"></div>
              <span className="text-gray-600 text-[12px]">Sample Items</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-50 border border-gray-300 rounded"></div>
              <span className="text-gray-600 text-[12px]">Member Only</span>
            </div>
          </div>
        </div>

        {/* Bottom Note */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 dark:text-[#EBF2FA] text-[13px] max-w-2xl mx-auto">
            <strong className="text-[#342e37] dark:text-white">Data Integrity Guarantee:</strong> All fields are verified and updated in real-time. 
            We maintain a 95%+ data completeness rate across all listings.
          </p>
        </div>
      </div>
    </div>
  );
}