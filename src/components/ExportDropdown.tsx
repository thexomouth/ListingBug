/**
 * ExportDropdown Component
 * 
 * Dropdown menu for exporting search results in multiple formats
 * and sending to connected integrations
 */

import { useState } from 'react';
import { Download, FileText, Send, ChevronDown } from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { toast } from 'sonner@2.0.3';

interface ExportDropdownProps {
  onExportCSV: () => void;
  onExportPDF?: () => void;
  onSendToIntegration?: (integration: string) => void;
  className?: string;
}

export function ExportDropdown({
  onExportCSV,
  onExportPDF,
  onSendToIntegration,
  className = '',
}: ExportDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleExportCSV = () => {
    onExportCSV();
    setIsOpen(false);
  };

  const handleExportPDF = () => {
    if (onExportPDF) {
      onExportPDF();
    } else {
      toast.info('PDF export coming soon');
    }
    setIsOpen(false);
  };

  const handleSendToIntegration = (integration: string) => {
    if (onSendToIntegration) {
      onSendToIntegration(integration);
    } else {
      toast.success(`Sending results to ${integration}...`);
    }
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="default"
          size="sm" 
          className={`whitespace-nowrap gap-1 bg-[#FFCE0A] hover:bg-[#FFD447] text-[#0F1115] dark:bg-[#FFCE0A] dark:hover:bg-[#FFD447] dark:text-[#0F1115] ${className}`}
        >
          <Download className="w-4 h-4" />
          <span>Export</span>
          <ChevronDown className="w-3.5 h-3.5 ml-0.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        side="bottom"
        sideOffset={4}
        alignOffset={0}
        className="w-[200px]"
      >
        <DropdownMenuLabel className="text-xs text-gray-600">
          Download
        </DropdownMenuLabel>
        <DropdownMenuItem 
          onClick={handleExportCSV}
          className="cursor-pointer"
        >
          <Download className="w-4 h-4 mr-2" />
          <span>Download CSV</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={handleExportPDF}
          className="cursor-pointer"
        >
          <FileText className="w-4 h-4 mr-2" />
          <span>Download PDF</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuLabel className="text-xs text-gray-600">
          Send to Integration
        </DropdownMenuLabel>
        <DropdownMenuItem 
          onClick={() => handleSendToIntegration('Mailchimp')}
          className="cursor-pointer"
        >
          <Send className="w-4 h-4 mr-2" />
          <span>Mailchimp</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}