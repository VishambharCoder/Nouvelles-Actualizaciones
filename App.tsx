
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Header from './components/Header';
// import LoadingSpinner from './components/LoadingSpinner'; // No longer used directly for initial load
import ErrorDisplay from './components/ErrorDisplay';
import AiInteractionModal from './components/AiInteractionModal';
import FeedStatusNotifier from './components/FeedStatusNotifier'; 
import SkeletonCardList from './components/SkeletonCardList'; // Import for initial load
import NewsList from './components/NewsList'; // Added import for NewsList
import { useNewsFeed } from './hooks/useNewsFeed';
import { NewsItem, NewsCategory, AiInteractionModalData } from './types';
import { ARTICLES_PER_PAGE, APP_TITLE } from './constants';

// Removed: getInitialDarkMode function

const App: React.FC = () => {
  const { 
    allNewsItems,
    isLoading: isLoadingFeed, 
    error, 
    fetchAllNewsFromFeeds, 
    lastUpdated,
    individualFeedStatuses, 
  } = useNewsFeed();

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<NewsCategory>(NewsCategory.ALL);
  
  // Removed: isDarkMode state and its initialization
  
  const [aiModalData, setAiModalData] = useState<AiInteractionModalData | null>(null);
  const [currentFilteredPage, setCurrentFilteredPage] = useState<number>(1);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

  // Removed: useEffect for managing dark mode class and localStorage

  // Removed: toggleDarkMode function

  const handleRefresh = () => {
    setSearchTerm(""); 
    // setSelectedCategory(NewsCategory.ALL); // Removed: This line was resetting the category.
    setCurrentFilteredPage(1);
    fetchAllNewsFromFeeds(true); // This will now refresh data for the currently selected category
  };
  
  const filteredNewsItems = useMemo(() => {
    let items = allNewsItems;
    if (selectedCategory !== NewsCategory.ALL) {
      items = items.filter(item => item.category === selectedCategory);
    }
    if (searchTerm.trim() !== "") {
      const lowerSearchTerm = searchTerm.toLowerCase();
      items = items.filter(item => 
        item.title.toLowerCase().includes(lowerSearchTerm) ||
        item.description.toLowerCase().includes(lowerSearchTerm) ||
        item.sourceName.toLowerCase().includes(lowerSearchTerm)
      );
    }
    return items;
  }, [allNewsItems, selectedCategory, searchTerm]);

  useEffect(() => {
    setCurrentFilteredPage(1);
  }, [searchTerm, selectedCategory]);
  
  const displayedItems = useMemo(() => {
    return filteredNewsItems.slice(0, currentFilteredPage * ARTICLES_PER_PAGE);
  }, [filteredNewsItems, currentFilteredPage]);

  const hasMore = useMemo(() => {
    return displayedItems.length < filteredNewsItems.length;
  }, [displayedItems.length, filteredNewsItems.length]);

  const loadMoreItems = useCallback(() => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    // Simulate network delay for loading more
    setTimeout(() => {
      setCurrentFilteredPage(prevPage => prevPage + 1);
      setIsLoadingMore(false);
    }, 500);
  }, [isLoadingMore, hasMore]);

  const handleAskAi = (data: AiInteractionModalData) => {
    setAiModalData(data);
  };

  const closeAiModal = () => {
    setAiModalData(null);
  };

  const showInitialLoading = isLoadingFeed && allNewsItems.length === 0 && individualFeedStatuses.length === 0;

  // Key for NewsList that changes when fundamental filters are applied
  const newsListKey = `${selectedCategory}-${searchTerm.trim()}`; // More sensitive key

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <Header 
        onRefresh={handleRefresh} 
        lastUpdated={lastUpdated} 
        isLoading={isLoadingFeed}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        // Removed: isDarkMode={isDarkMode}
        // Removed: onToggleDarkMode={toggleDarkMode}
      />
      <main className="flex-grow container mx-auto flex flex-col overflow-hidden px-0 sm:px-2 md:px-4 py-1 sm:py-4">
        {showInitialLoading && <SkeletonCardList count={ARTICLES_PER_PAGE / 2} message="Fetching latest news..." /> /* Use SkeletonCardList */}
        {error && <ErrorDisplay message={error} />}
        <FeedStatusNotifier feedStatuses={individualFeedStatuses} />
        
        {!showInitialLoading && !error && (
          <NewsList 
            key={newsListKey} 
            newsItems={displayedItems}
            // isLoading prop is removed as NewsList is only rendered when not initial loading
            isLoadingMore={isLoadingMore}
            loadMoreNews={loadMoreItems}
            hasMore={hasMore}
            onAskAi={handleAskAi}
          />
        )}
      </main>
      <footer className="text-center py-6 bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-sm transition-colors duration-300">
        <p>&copy; {new Date().getFullYear()} {APP_TITLE}. All rights reserved.</p>
        <p className="mt-1">News content provided by respective sources. For educational/demonstration purposes.</p>
      </footer>
      {aiModalData && (
        <AiInteractionModal 
          isOpen={!!aiModalData}
          onClose={closeAiModal}
          newsItem={aiModalData.newsItem}
        />
      )}
    </div>
  );
};

export default App;
