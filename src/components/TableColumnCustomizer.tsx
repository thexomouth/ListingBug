/**
 * TableColumnCustomizer Component
 * 
 * Provides a subtle, non-intrusive way for users to:
 * - Show/hide table columns
 * - Reorder columns via drag-and-drop
 * - Reset to default column configuration
 * - Persist preferences to localStorage
 */

import { useState, useRef, useEffect } from 'react';
import { Settings, GripVertical, Eye, EyeOff, RotateCcw, X, ChevronDown } from 'lucide-react';
import { Button } from './ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';
import { toast } from 'sonner@2.0.3';

export interface ColumnConfig {
  id: string;
  label: string;
  visible: boolean;
  required?: boolean; // Required columns cannot be hidden
}

interface TableColumnCustomizerProps {
  tableId: string; // Unique identifier for localStorage persistence
  columns: ColumnConfig[];
  onColumnsChange: (columns: ColumnConfig[]) => void;
  className?: string;
  compact?: boolean; // New prop for compact mode
}

export function TableColumnCustomizer({
  tableId,
  columns,
  onColumnsChange,
  className = '',
  compact = false,
}: TableColumnCustomizerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localColumns, setLocalColumns] = useState<ColumnConfig[]>(columns);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Load column preferences from localStorage on mount
  useEffect(() => {
    const savedConfig = localStorage.getItem(`lb_table_columns_${tableId}`);
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig) as ColumnConfig[];
        // Merge saved config with current columns to handle new columns being added
        const mergedColumns = columns.map(col => {
          const saved = parsed.find(p => p.id === col.id);
          return saved ? { ...col, visible: saved.visible } : col;
        });
        setLocalColumns(mergedColumns);
        onColumnsChange(mergedColumns);
      } catch (e) {
        console.error('Failed to parse saved column config:', e);
      }
    }
  }, [tableId]);

  // Sync local columns with prop changes
  useEffect(() => {
    setLocalColumns(columns);
  }, [columns]);

  const handleToggleColumn = (columnId: string) => {
    const updated = localColumns.map(col =>
      col.id === columnId && !col.required
        ? { ...col, visible: !col.visible }
        : col
    );
    setLocalColumns(updated);
    onColumnsChange(updated);
    saveToLocalStorage(updated);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null) return;

    const updated = [...localColumns];
    const [draggedItem] = updated.splice(draggedIndex, 1);
    updated.splice(dropIndex, 0, draggedItem);

    setLocalColumns(updated);
    onColumnsChange(updated);
    saveToLocalStorage(updated);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleReset = () => {
    // Reset to default (all visible)
    const defaultColumns = columns.map(col => ({ ...col, visible: true }));
    setLocalColumns(defaultColumns);
    onColumnsChange(defaultColumns);
    localStorage.removeItem(`lb_table_columns_${tableId}`);
    toast.success('Columns reset to default');
  };

  const handleShowAll = () => {
    const updated = localColumns.map(col => ({ ...col, visible: true }));
    setLocalColumns(updated);
    onColumnsChange(updated);
    saveToLocalStorage(updated);
    toast.success('All columns shown');
  };

  const handleHideOptional = () => {
    const updated = localColumns.map(col => 
      col.required ? col : { ...col, visible: false }
    );
    setLocalColumns(updated);
    onColumnsChange(updated);
    saveToLocalStorage(updated);
    toast.success('Optional columns hidden');
  };

  const saveToLocalStorage = (cols: ColumnConfig[]) => {
    localStorage.setItem(`lb_table_columns_${tableId}`, JSON.stringify(cols));
  };

  const visibleCount = localColumns.filter(c => c.visible).length;
  const totalCount = localColumns.length;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger className="text-[#785050] text-[#774f4f] text-[#744f4f] text-[#604a4a] text-[#000000] text-[#000000] text-[#000000]" asChild>
        {compact ? (
          <button
            className={`inline-flex items-center justify-center h-6 w-6 border border-gray-300 rounded hover:bg-gray-50 transition-colors ${className}`}
            title="Customize table columns"
          >
            <ChevronDown className="w-3.5 h-3.5 text-gray-600" />
          </button>
        ) : (
          <Button 
            variant="outline" 
            size="sm" 
            className={`h-8 px-3 text-xs ${className}`}
            title="Customize table columns - show/hide and reorder"
          >
            <Settings className="w-3.5 h-3.5 mr-1.5" />
            Columns ({visibleCount}/{totalCount})
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent
        className="w-[320px] p-0 bg-white dark:bg-[#2F2F2F] border-gray-200 dark:border-gray-700"
        align="end"
        sideOffset={5}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#1a1a1a]">
          <div>
            <h4 className="font-bold text-[14px] text-gray-900 dark:text-white">Customize Columns</h4>
            <p className="text-[11px] text-gray-600 dark:text-[#EBF2FA]/70 mt-0.5">
              Drag to reorder, click to show/hide
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="h-6 w-6 p-0 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Column List */}
        <div className="max-h-[400px] overflow-y-auto py-2 bg-white dark:bg-[#2F2F2F]">
          {localColumns.map((column, index) => (
            <div
              key={column.id}
              draggable={!column.required}
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              className={`
                flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 dark:border-gray-700 last:border-b-0
                ${column.required ? 'opacity-60 cursor-not-allowed' : 'cursor-move hover:bg-gray-50 dark:hover:bg-white/5'}
                ${dragOverIndex === index && draggedIndex !== index ? 'bg-blue-50 dark:bg-[#FFCE0A]/10 border-t-2 border-t-blue-400 dark:border-t-[#FFCE0A]' : ''}
                ${draggedIndex === index ? 'opacity-50' : ''}
                transition-colors
              `}
            >
              {/* Drag Handle */}
              <GripVertical
                className={`w-4 h-4 flex-shrink-0 ${column.required ? 'text-gray-300 dark:text-gray-600' : 'text-gray-400 dark:text-gray-500'}`}
              />

              {/* Checkbox/Eye Icon */}
              <button
                onClick={() => handleToggleColumn(column.id)}
                disabled={column.required}
                className={`
                  flex items-center justify-center w-5 h-5 flex-shrink-0 rounded
                  ${column.required ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-gray-100 dark:hover:bg-white/10'}
                `}
                title={column.required ? 'Required column' : column.visible ? 'Hide column' : 'Show column'}
              >
                {column.visible ? (
                  <Eye className="w-4 h-4 text-blue-600 dark:text-[#FFCE0A]" />
                ) : (
                  <EyeOff className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                )}
              </button>

              {/* Column Label */}
              <span className={`flex-1 text-[13px] ${column.visible ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
                {column.label}
                {column.required && (
                  <span className="ml-1.5 text-[10px] text-gray-500 dark:text-gray-400 font-normal">(required)</span>
                )}
              </span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#1a1a1a]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-gray-600 dark:text-[#EBF2FA]/70">
              {visibleCount} of {totalCount} visible
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="text-[11px] h-6 px-2 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/10"
              title="Reset all columns to default visibility and order"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Reset
            </Button>
          </div>
          <div className="flex gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handleShowAll}
              className="text-[11px] h-6 px-2 flex-1 bg-[#FFCE0A] hover:bg-[#FFD447] text-[#0F1115] border-[#FFCE0A] dark:bg-[#FFCE0A] dark:hover:bg-[#FFD447] dark:text-[#0F1115] dark:border-[#FFCE0A]"
              title="Show all columns"
            >
              <Eye className="w-3 h-3 mr-1" />
              Show All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleHideOptional}
              className="text-[11px] h-6 px-2 flex-1 bg-[#FFCE0A] hover:bg-[#FFD447] text-[#0F1115] border-[#FFCE0A] dark:bg-[#FFCE0A] dark:hover:bg-[#FFD447] dark:text-[#0F1115] dark:border-[#FFCE0A]"
              title="Hide all optional columns (keep only required)"
            >
              <EyeOff className="w-3 h-3 mr-1" />
              Minimal
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}