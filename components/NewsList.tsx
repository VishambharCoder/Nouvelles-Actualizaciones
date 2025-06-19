import React from 'react';
import { NewsItem, AiInteractionModalData } from '../types';
import NewsCard from './NewsCard';
import SkeletonCardList from './SkeletonCardList';

interface NewsListProps {
  newsItems: NewsItem[];
  isLoadingMore: boolean;
  loadMoreNews: () => void;
  hasMore: boolean;
  onAskAi: (data: AiInteractionModalData) => void;
}

const NewsList: React.FC<NewsListProps> = ({ newsItems, isLoadingMore, loadMoreNews, hasMore, onAskAi }) => {
  
  if (newsItems.length === 0 && !isLoadingMore) {
    return <p className="text-center text-gray-600 dark:text-gray-300 py-10 text-lg">No news articles match your criteria. Try adjusting filters or search.</p>;
  }

  return (
    <div className="flex flex-col h-full"> {/* Outer container takes full height */}
      {/* Scrollable area for the news cards grid */}
      <div className="flex-grow overflow-y-auto">
        {newsItems.length > 0 && (
          // Grid for news cards, gap managed here. Page padding is handled by App.tsx's <main> element.
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"> 
            {newsItems.map(item => (
              <NewsCard key={item.id} item={item} onAskAi={onAskAi} />
            ))}
          </div>
        )}
      </div>
      
      {/* Load More Button and Skeleton for loading more */}
      {hasMore && (
        <div className="flex justify-center pt-4 pb-2">
          <button
            onClick={loadMoreNews}
            disabled={isLoadingMore}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-colors duration-150 ease-in-out disabled:opacity-70 disabled:cursor-wait flex items-center"
          >
            {isLoadingMore ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading More...
              </>
            ) : (
              'Load More News'
            )}
          </button>
        </div>
      )}
       {isLoadingMore && newsItems.length > 0 && (
         <div className="py-2"> {/* Wrapper for skeleton when loading more */}
            <SkeletonCardList count={4} message="Fetching more articles..." />
         </div>
       )}
    </div>
  );
};

export default NewsList;