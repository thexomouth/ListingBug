import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '../../ui/sheet';
import { Activity } from '../RecentActivitySection';
import { AutomationActivityPane } from './panes/AutomationActivityPane';
import { ManualSearchActivityPane } from './panes/ManualSearchActivityPane';
import { IntegrationActivityPane } from './panes/IntegrationActivityPane';

interface ActivityDetailsModalProps {
  activity: Activity | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ActivityDetailsModal({
  activity,
  isOpen,
  onClose,
}: ActivityDetailsModalProps) {
  if (!activity) return null;

  const getTitle = () => {
    switch (activity.type) {
      case 'automation':
        return activity.automationName;
      case 'manual-search':
        return activity.searchName || 'Manual Search';
      case 'integration':
        return `${activity.integrationName} Activity`;
      default:
        return 'Activity Details';
    }
  };

  const getDescription = () => {
    switch (activity.type) {
      case 'automation':
        return `Automation run details and delivery status`;
      case 'manual-search':
        return 'Search parameters and results';
      case 'integration':
        return 'Integration activity and sync details';
      default:
        return 'Activity information';
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-[600px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{getTitle()}</SheetTitle>
          <SheetDescription>{getDescription()}</SheetDescription>
        </SheetHeader>

        <div className="mt-6">
          {activity.type === 'automation' && (
            <AutomationActivityPane activity={activity} />
          )}
          {activity.type === 'manual-search' && (
            <ManualSearchActivityPane activity={activity} />
          )}
          {activity.type === 'integration' && (
            <IntegrationActivityPane activity={activity} />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
