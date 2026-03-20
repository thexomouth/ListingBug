import { Search, MapPin, Filter, Bookmark, PlayCircle, Save, ExternalLink, Zap } from 'lucide-react';
import { ManualSearchActivity } from '../../RecentActivitySection';
import { LBButton } from '../../../design-system/LBButton';
import { Button } from '../../../ui/button';
import { toast } from 'sonner@2.0.3';

interface ManualSearchActivityPaneProps {
  activity: ManualSearchActivity;
}

export function ManualSearchActivityPane({ activity }: ManualSearchActivityPaneProps) {
  const formatDateTime = (date: Date) => {
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="space-y-6">
      {/* Search Summary */}
      <div className="p-4 rounded-lg border-2 bg-purple-50 border-purple-200">
        <div className="flex items-center gap-3 mb-3">
          <Search className="w-6 h-6 text-purple-600 flex-shrink-0" />
          <div>
            <h3 className="font-bold text-[15px] mb-1">
              {activity.searchName || 'Manual Search'}
            </h3>
            <p className="text-[13px] text-gray-700">
              Found {activity.resultsCount} matching listing{activity.resultsCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        
        {activity.saved && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-100 border border-purple-300 rounded w-fit">
            <Bookmark className="w-4 h-4 text-purple-700" />
            <span className="text-[12px] font-medium text-purple-900">This search is saved</span>
          </div>
        )}
      </div>

      {/* Search Parameters */}
      <div>
        <h4 className="font-bold text-[14px] text-gray-900 dark:text-white mb-3">Search Parameters</h4>
        <div className="space-y-3 bg-gray-50 dark:bg-[#252525] rounded-lg p-4">
          <div>
            <div className="text-[12px] text-gray-600 mb-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              Location
            </div>
            <div className="text-[14px] font-medium text-gray-900">{activity.location}</div>
          </div>
          <div>
            <div className="text-[12px] text-gray-600 mb-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              Search Criteria
            </div>
            <div className="text-[14px] font-medium text-gray-900">{activity.criteria}</div>
          </div>
          <div>
            <div className="text-[12px] text-gray-600 mb-1">Search Date</div>
            <div className="text-[14px] text-gray-900">{formatDateTime(activity.timestamp)}</div>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div>
        <h4 className="font-bold text-[14px] text-gray-900 mb-3">Results Summary</h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
            <div className="text-[12px] text-purple-700 mb-1">Listings Found</div>
            <div className="text-[24px] font-bold text-purple-900">{activity.resultsCount}</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-[12px] text-blue-700 mb-1">Search Status</div>
            <div className="text-[14px] font-bold text-blue-900">
              {activity.saved ? 'Saved' : 'Not Saved'}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h4 className="font-bold text-[14px] text-gray-900 mb-3">Quick Actions</h4>
        <div className="space-y-2">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => {
              toast.success('Running search again...');
              // TODO: Re-run search with same params
            }}
          >
            <PlayCircle className="w-4 h-4 mr-2" />
            Run This Search Again
          </Button>
          
          {!activity.saved && (
            <Button
              variant="outline"
              className="w-full justify-start border-purple-300 text-purple-700 hover:bg-purple-50"
              onClick={() => {
                toast.success('Search saved!');
                // TODO: Save search
              }}
            >
              <Save className="w-4 h-4 mr-2" />
              Save This Search
            </Button>
          )}

          {activity.saved && (
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => {
                toast.info('Opening saved search...');
                // TODO: Navigate to saved searches
              }}
            >
              <Bookmark className="w-4 h-4 mr-2" />
              Manage Saved Search
            </Button>
          )}
          
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => {
              toast.info('Opening results...');
              // TODO: Show results
            }}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            View All Results
          </Button>

          <LBButton 
            className="w-full"
            onClick={() => {
              toast.info('Creating automation...');
              // TODO: Open automation wizard with this search
            }}
          >
            <Zap className="w-4 h-4 mr-2" />
            Automate This Search
          </LBButton>
        </div>
      </div>

      {/* Search Tips */}
      {!activity.saved && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h5 className="font-bold text-[13px] text-blue-900 mb-2">💡 Tip</h5>
          <p className="text-[12px] text-blue-800">
            Save this search to re-run it anytime or automate it to deliver new listings automatically to your email, CRM, or other tools.
          </p>
        </div>
      )}
    </div>
  );
}