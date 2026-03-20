import { useState } from 'react';
import { Activity, Search, Zap, Database, ChevronRight } from 'lucide-react';
import { AutomationActivityCard } from './activity/AutomationActivityCard';
import { ManualSearchActivityCard } from './activity/ManualSearchActivityCard';
import { IntegrationActivityCard } from './activity/IntegrationActivityCard';
import { ActivityDetailsModal } from './activity/ActivityDetailsModal';

/**
 * RECENT ACTIVITY SECTION
 * 
 * Displays different types of user activity:
 * - Automation Runs (successful/failed deliveries)
 * - Manual Searches (user-initiated searches)
 * - Integration Activity (connections, transfers, sync events)
 */

export interface AutomationActivity {
  id: string;
  type: 'automation';
  automationName: string;
  searchName: string;
  destination: {
    type: string;
    label: string;
  };
  status: 'success' | 'failed';
  listingsDelivered: number;
  timestamp: Date;
  details?: string;
}

export interface ManualSearchActivity {
  id: string;
  type: 'manual-search';
  searchName?: string;
  location: string;
  criteria: string;
  resultsCount: number;
  timestamp: Date;
  saved: boolean;
  searchParams?: any;
}

export interface IntegrationActivity {
  id: string;
  type: 'integration';
  action: 'connected' | 'disconnected' | 'transfer' | 'sync' | 'error';
  integrationName: string;
  details: string;
  timestamp: Date;
  status: 'success' | 'failed' | 'info';
  metadata?: any;
}

export type Activity = AutomationActivity | ManualSearchActivity | IntegrationActivity;

interface RecentActivitySectionProps {
  activities?: Activity[];
  onActivityClick?: (activity: Activity) => void;
}

export function RecentActivitySection({ activities, onActivityClick }: RecentActivitySectionProps) {
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'automation' | 'manual-search' | 'integration'>('all');

  // Initialize with empty activities - data comes from localStorage
  const mockActivities: Activity[] = [];

  const displayActivities = activities || mockActivities;

  // Sort by timestamp
  const sortedActivities = [...displayActivities].sort(
    (a, b) => {
      const aTime = typeof a.timestamp === 'string' ? new Date(a.timestamp).getTime() : a.timestamp.getTime();
      const bTime = typeof b.timestamp === 'string' ? new Date(b.timestamp).getTime() : b.timestamp.getTime();
      return bTime - aTime;
    }
  );

  // Filter activities based on active filter
  const filteredActivities = activeFilter === 'all' 
    ? sortedActivities 
    : sortedActivities.filter(a => a.type === activeFilter);

  // Group by type for stats
  const automationCount = sortedActivities.filter(a => a.type === 'automation').length;
  const searchCount = sortedActivities.filter(a => a.type === 'manual-search').length;
  const integrationCount = sortedActivities.filter(a => a.type === 'integration').length;

  const handleActivityClick = (activity: Activity) => {
    setSelectedActivity(activity);
    setIsModalOpen(true);
    onActivityClick?.(activity);
  };

  const handleFilterClick = (filterType: 'all' | 'automation' | 'manual-search' | 'integration') => {
    setActiveFilter(filterType);
  };

  return (
    <>
      <div className="mb-6">
        {/* Section Header */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-5 h-5 text-[#342e37]" />
            <h2 className="font-bold text-[#342e37] text-xl md:text-2xl">Recent Activity</h2>
          </div>
          <p className="text-xs md:text-sm text-gray-600">
            {sortedActivities.length} activities in the last 7 days
          </p>
        </div>

        {/* Activity Type Filters/Stats */}
        <div className="flex flex-wrap gap-3 mb-4">
          <button
            onClick={() => handleFilterClick('automation')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
              activeFilter === 'automation'
                ? 'bg-blue-100 border-2 border-blue-600 shadow-sm'
                : 'bg-blue-50 border border-blue-200 hover:bg-blue-100 hover:border-blue-300'
            }`}
          >
            <Zap className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">
              {automationCount} Automation{automationCount !== 1 ? 's' : ''}
            </span>
          </button>
          <button
            onClick={() => handleFilterClick('manual-search')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
              activeFilter === 'manual-search'
                ? 'bg-purple-100 border-2 border-purple-600 shadow-sm'
                : 'bg-purple-50 border border-purple-200 hover:bg-purple-100 hover:border-purple-300'
            }`}
          >
            <Search className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-900">
              {searchCount} Search{searchCount !== 1 ? 'es' : ''}
            </span>
          </button>
          <button
            onClick={() => handleFilterClick('integration')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
              activeFilter === 'integration'
                ? 'bg-green-100 border-2 border-green-600 shadow-sm'
                : 'bg-green-50 border border-green-200 hover:bg-green-100 hover:border-green-300'
            }`}
          >
            <Database className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-900">
              {integrationCount} Integration Event{integrationCount !== 1 ? 's' : ''}
            </span>
          </button>
          {activeFilter !== 'all' && (
            <button
              onClick={() => handleFilterClick('all')}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-all text-sm font-medium text-gray-700"
            >
              Clear Filter
            </button>
          )}
        </div>

        {/* Activity List */}
        <div className="space-y-3">
          {filteredActivities.map((activity) => {
            if (activity.type === 'automation') {
              return (
                <AutomationActivityCard
                  key={activity.id}
                  activity={activity}
                  onClick={() => handleActivityClick(activity)}
                />
              );
            }
            if (activity.type === 'manual-search') {
              return (
                <ManualSearchActivityCard
                  key={activity.id}
                  activity={activity}
                  onClick={() => handleActivityClick(activity)}
                />
              );
            }
            if (activity.type === 'integration') {
              return (
                <IntegrationActivityCard
                  key={activity.id}
                  activity={activity}
                  onClick={() => handleActivityClick(activity)}
                />
              );
            }
            return null;
          })}
        </div>
      </div>

      {/* Activity Details Modal */}
      <ActivityDetailsModal
        activity={selectedActivity}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedActivity(null);
        }}
      />
    </>
  );
}