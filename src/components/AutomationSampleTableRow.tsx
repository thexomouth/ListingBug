/**
 * AutomationSampleTableRow Component
 * Renders a single table row for automation sample payload with customizable columns
 */

import { CheckCircle, AlertTriangle } from 'lucide-react';
import { ColumnConfig } from './TableColumnCustomizer';

interface AutomationSampleTableRowProps {
  row: any;
  columns: ColumnConfig[];
  index: number;
}

export function AutomationSampleTableRow({
  row,
  columns,
  index,
}: AutomationSampleTableRowProps) {
  const visibleColumns = columns.filter(col => col.visible);

  const renderCell = (columnId: string) => {
    switch (columnId) {
      case 'address':
        return (
          <td key={columnId} className="px-3 py-2 font-medium text-[#000000]">
            {row.property_address}
          </td>
        );
      
      case 'price':
        return (
          <td key={columnId} className="px-3 py-2 text-[#000000]">
            ${row.price.toLocaleString()}
          </td>
        );
      
      case 'contact':
        return (
          <td key={columnId} className="px-3 py-2 text-[#000000]">
            {row.contact_name}
          </td>
        );
      
      case 'email':
        return (
          <td key={columnId} className="px-3 py-2 font-mono text-xs text-[#000000]">
            {row.email}
          </td>
        );
      
      case 'consent':
        return (
          <td key={columnId} className="px-3 py-2">
            {row.consent_verified ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-800 border border-green-300 rounded text-xs font-bold">
                <CheckCircle className="w-3 h-3" />
                Verified
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-800 border border-red-300 rounded text-xs font-bold">
                <AlertTriangle className="w-3 h-3" />
                Suppress
              </span>
            )}
          </td>
        );
      
      default:
        return null;
    }
  };

  return (
    <tr className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
      {visibleColumns.map(col => renderCell(col.id))}
    </tr>
  );
}
