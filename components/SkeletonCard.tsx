import React from 'react';

interface SkeletonCardProps {
  style?: React.CSSProperties;
}

// This component is often defined within SkeletonCardList.tsx or imported.
// The key change is removing the outer p-1.
const SkeletonCard: React.FC<SkeletonCardProps> = ({ style }) => {
  return (
    // Removed outer p-1, style prop retained for potential virtual list usage
    <div style={style} className="h-full"> 
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden flex flex-col h-full animate-pulse">
        <div className="w-full h-48 bg-gray-300 dark:bg-gray-700"></div>
        <div className="p-4 md:p-5 flex flex-col flex-grow">
          <div className="mb-2 h-4 w-1/4 bg-gray-300 dark:bg-gray-700 rounded"></div>
          <div className="h-6 w-3/4 bg-gray-300 dark:bg-gray-700 rounded mb-2"></div>
          <div className="h-6 w-full bg-gray-300 dark:bg-gray-700 rounded mb-1"></div>
          <div className="h-6 w-5/6 bg-gray-300 dark:bg-gray-700 rounded mb-3"></div>
          
          <div className="space-y-1 mb-4 flex-grow">
            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-full"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-full"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
          </div>
          
          <div className="mt-auto pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="h-3 w-1/2 bg-gray-300 dark:bg-gray-700 rounded mb-1.5"></div>
            <div className="h-3 w-1/3 bg-gray-300 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkeletonCard;
