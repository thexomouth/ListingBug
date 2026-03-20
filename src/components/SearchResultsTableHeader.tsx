/**
 * SearchResultsTableHeader Component
 * Renders table headers for search results with customizable columns
 */

import { LBTableHead, LBTableRow } from './design-system/LBTable';
import { ColumnConfig, TableColumnCustomizer } from './TableColumnCustomizer';

type SortColumn = 'address' | 'city' | 'price' | 'yearBuilt' | 'agentName' | 'daysListed' | 'status';

interface SearchResultsTableHeaderProps {
  columns: ColumnConfig[];
  onSort: (column: SortColumn) => void;
  SortIcon: React.ComponentType<{ column: SortColumn }>;
  onColumnsChange: (columns: ColumnConfig[]) => void;
}

export function SearchResultsTableHeader({
  columns,
  onSort,
  SortIcon,
  onColumnsChange,
}: SearchResultsTableHeaderProps) {
  const visibleColumns = columns.filter(col => col.visible);

  const columnProps: { [key: string]: any } = {
    address: { className: 'min-w-[160px] cursor-pointer hover:bg-gray-50', sortable: true },
    city: { className: 'min-w-[100px] cursor-pointer hover:bg-gray-50', sortable: true },
    price: { className: 'min-w-[110px] cursor-pointer hover:bg-gray-50', sortable: true },
    yearBuilt: { className: 'cursor-pointer hover:bg-gray-50', sortable: true },
    agentName: { className: 'min-w-[130px] cursor-pointer hover:bg-gray-50', sortable: true },
    daysListed: { className: 'cursor-pointer hover:bg-gray-50', sortable: true, centered: true },
    reList: { className: 'text-center', sortable: false },
    priceDrop: { className: 'text-center', sortable: false },
    status: { className: 'cursor-pointer hover:bg-gray-50', sortable: true },
    actions: { className: 'w-[100px]', sortable: false },
  };

  return (
    <LBTableRow>
      {visibleColumns.map((col, index) => {
        const props = columnProps[col.id] || {};
        const isLastColumn = index === visibleColumns.length - 1;
        
        return (
          <LBTableHead 
            key={col.id} 
            className={props.className} 
            onClick={props.sortable ? () => onSort(col.id as SortColumn) : undefined}
          >
            <div className="flex items-center justify-between">
              {props.sortable ? (
                <div className={`flex items-center ${props.centered ? 'justify-center' : ''} flex-1`}>
                  {col.label}
                  <SortIcon column={col.id as SortColumn} />
                </div>
              ) : (
                <span className="flex-1">{col.label}</span>
              )}
              {isLastColumn && (
                <TableColumnCustomizer
                  tableId="search-results"
                  columns={columns}
                  onColumnsChange={onColumnsChange}
                  compact={true}
                />
              )}
            </div>
          </LBTableHead>
        );
      })}
    </LBTableRow>
  );
}