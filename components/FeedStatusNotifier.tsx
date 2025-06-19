import React from 'react';
import { FeedStatus } from '../hooks/useNewsFeed';

interface FeedStatusNotifierProps {
  feedStatuses: FeedStatus[];
}

const FeedStatusNotifier: React.FC<FeedStatusNotifierProps> = ({ feedStatuses }) => {
  const [isVisible, setIsVisible] = React.useState(true);
  const erroredFeeds = feedStatuses.filter(fs => fs.status === 'error');

  if (!erroredFeeds.length || !isVisible) {
    return null;
  }

  return (
    <div className="bg-yellow-100 dark:bg-yellow-900 border-l-4 border-yellow-500 dark:border-yellow-400 text-yellow-700 dark:text-yellow-200 p-4 my-3 rounded-md shadow relative" role="alert">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-bold mb-1">Notice: Some news sources could not be updated</p>
          <ul className="list-disc list-inside text-sm">
            {erroredFeeds.map(feed => (
              <li key={feed.feedName}>
                <strong>{feed.feedName}:</strong> {feed.errorMessage || 'Failed to load.'}
              </li>
            ))}
          </ul>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="ml-4 p-1 text-yellow-700 dark:text-yellow-200 hover:text-yellow-900 dark:hover:text-yellow-100"
          aria-label="Dismiss notification"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
       <p className="text-xs mt-2 text-yellow-600 dark:text-yellow-300">Other news sources may have loaded correctly. The application will continue to attempt fetching all sources during auto-updates or manual refresh.</p>
    </div>
  );
};

export default FeedStatusNotifier;