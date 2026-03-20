/**
 * SearchResultsTableRow Component
 * Renders a single table row for search results with customizable columns
 */

import { Save } from 'lucide-react';
import { LBTableCell, LBTableRow } from './design-system/LBTable';
import { LBButton } from './design-system/LBButton';
import { ColumnConfig } from './TableColumnCustomizer';

interface SearchResultsTableRowProps {
  result: any;
  columns: ColumnConfig[];
  onSelect: (result: any) => void;
  onSave: (result: any) => void;
  isSaved: (id: string) => boolean;
}

export function SearchResultsTableRow({
  result,
  columns,
  onSelect,
  onSave,
  isSaved,
}: SearchResultsTableRowProps) {
  const visibleColumns = columns.filter(col => col.visible);

  const renderCell = (columnId: string) => {
    switch (columnId) {
      case 'address':
        return <LBTableCell key={columnId} className="font-medium">{result.address}</LBTableCell>;
      
      case 'city':
        return <LBTableCell key={columnId}>{result.city}</LBTableCell>;
      
      case 'price':
        return <LBTableCell key={columnId} className="font-medium">${result.price.toLocaleString()}</LBTableCell>;
      
      case 'yearBuilt':
        return <LBTableCell key={columnId}>{result.yearBuilt}</LBTableCell>;
      
      case 'agentName':
        return <LBTableCell key={columnId}>{result.agentName}</LBTableCell>;
      
      case 'daysListed':
        return (
          <LBTableCell key={columnId} className="text-center">
            <span className={`${result.daysListed > 14 ? 'text-orange-600 font-medium' : ''}`}>
              {result.daysListed}
            </span>
          </LBTableCell>
        );
      
      case 'reList':
        return (
          <LBTableCell key={columnId} className="text-center">
            {result.reList ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-orange-100 text-orange-800">
                🔁 Yes
              </span>
            ) : (
              <span className="text-gray-400 text-xs">—</span>
            )}
          </LBTableCell>
        );
      
      case 'priceDrop':
        return (
          <LBTableCell key={columnId} className="text-center">
            {result.priceDrop ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-red-100 text-red-800">
                📉 -{result.priceDropPercent}%
              </span>
            ) : (
              <span className="text-gray-400 text-xs">—</span>
            )}
          </LBTableCell>
        );
      
      case 'status':
        return (
          <LBTableCell key={columnId}>
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${
              result.status === 'Active' ? 'bg-green-100 text-green-800' :
              result.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
              result.status === 'Sold' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {result.status}
            </span>
          </LBTableCell>
        );
      
      case 'actions':
        return (
          <LBTableCell key={columnId} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-1">
              <LBButton
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onSave(result);
                }}
                className="h-8 w-8 p-0"
                title={isSaved(result.id) ? 'Remove from saved' : 'Save listing'}
              >
                <Save className={`w-4 h-4 ${isSaved(result.id) ? 'fill-[#FFD447] text-[#342E37]' : ''}`} />
              </LBButton>
            </div>
          </LBTableCell>
        );
      
      default:
        return null;
    }
  };

  return (
    <LBTableRow className="cursor-pointer" onClick={() => onSelect(result)}>
      {visibleColumns.map(col => renderCell(col.id))}
    </LBTableRow>
  );
}