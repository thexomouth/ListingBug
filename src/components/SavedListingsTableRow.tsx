/**
 * SavedListingsTableRow Component
 * Renders a single table row for saved listings with customizable columns
 */

import { Eye, Save, Trash2, MapPin, Calendar } from 'lucide-react';
import { LBTableCell, LBTableRow } from './design-system/LBTable';
import { LBButton } from './design-system/LBButton';
import { ColumnConfig } from './TableColumnCustomizer';

interface SavedListingsTableRowProps {
  listing: any;
  columns: ColumnConfig[];
  onSelect: (listing: any) => void;
  onRemove: (id: any, e: React.MouseEvent) => void;
}

export function SavedListingsTableRow({
  listing,
  columns,
  onSelect,
  onRemove,
}: SavedListingsTableRowProps) {
  const visibleColumns = columns.filter(col => col.visible);

  const renderCell = (columnId: string) => {
    switch (columnId) {
      case 'address':
        return (
          <LBTableCell key={columnId} className="font-medium">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">{listing.address}</p>
                {listing.priceDrop && (
                  <span className="inline-flex items-center text-[11px] text-red-600">
                    📉 Price drop: ${listing.priceDropAmount?.toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          </LBTableCell>
        );
      
      case 'city':
        return <LBTableCell key={columnId}>{listing.city}, {listing.state}</LBTableCell>;
      
      case 'price':
        return (
          <LBTableCell key={columnId} className="font-medium">
            ${listing.price.toLocaleString()}
          </LBTableCell>
        );
      
      case 'bedsBaths':
        return (
          <LBTableCell key={columnId}>
            {listing.bedrooms} bd / {listing.bathrooms} ba
          </LBTableCell>
        );
      
      case 'status':
        return (
          <LBTableCell key={columnId}>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${
                listing.status === 'Active'
                  ? 'bg-green-100 text-green-800'
                  : listing.status === 'Pending'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {listing.status}
            </span>
          </LBTableCell>
        );
      
      case 'savedOn':
        return (
          <LBTableCell key={columnId}>
            <div className="flex items-center gap-1 text-[13px] text-gray-600">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(listing.savedAt).toLocaleDateString()}
            </div>
          </LBTableCell>
        );
      
      case 'actions':
        return (
          <LBTableCell key={columnId}>
            <div className="flex items-center gap-1">
              <LBButton
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(listing);
                }}
                className="h-8 w-8 p-0"
                title="View details"
              >
                <Eye className="w-4 h-4" />
              </LBButton>
              <LBButton
                variant="ghost"
                size="sm"
                onClick={(e) => onRemove(listing.id, e)}
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                title="Remove from saved"
              >
                <Trash2 className="w-4 h-4" />
              </LBButton>
            </div>
          </LBTableCell>
        );
      
      default:
        return null;
    }
  };

  return (
    <LBTableRow 
      className="cursor-pointer"
      style={{ cursor: 'pointer' }}
      onClick={() => onSelect(listing)}
    >
      {visibleColumns.map(col => renderCell(col.id))}
    </LBTableRow>
  );
}