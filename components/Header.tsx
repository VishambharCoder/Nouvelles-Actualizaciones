import React from 'react';
import { APP_TITLE } from '../constants';
import { NewsCategory } from '../types';

interface HeaderProps {
  onRefresh: () => void;
  lastUpdated: Date | null;
  isLoading: boolean;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  selectedCategory: NewsCategory;
  onCategoryChange: (category: NewsCategory) => void;
  // Removed: isDarkMode: boolean;
  // Removed: onToggleDarkMode: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  onRefresh, lastUpdated, isLoading, 
  searchTerm, onSearchChange, 
  selectedCategory, onCategoryChange
  // Removed: isDarkMode, onToggleDarkMode
}) => {
  const categoryOptions = [NewsCategory.ALL, NewsCategory.WORLD, NewsCategory.BUSINESS, NewsCategory.SPORTS]; // Added WORLD

  return (
    <header className="bg-gradient-to-r from-blue-700 to-indigo-800 dark:from-blue-800 dark:to-indigo-900 text-white p-4 shadow-lg sticky top-0 z-50">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-3">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2 md:mb-0">
            {APP_TITLE}
          </h1>
          <div className="flex items-center space-x-2 sm:space-x-4">
            {lastUpdated && (
              <p className="text-xs text-blue-200 dark:text-blue-300 hidden sm:block">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
            {/* Removed dark mode toggle button */}
            <button
              onClick={() => onRefresh()}
              disabled={isLoading}
              className="px-3 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-800 font-semibold rounded-lg shadow-md transition-colors duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              title="Refresh News Feed"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className={`h-5 w-5 ${isLoading && !lastUpdated ? 'animate-spin' : ''} ${isLoading && lastUpdated ? 'animate-ping opacity-50' : ''} mr-1 sm:mr-2`}
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m-15.357-2a8.001 8.001 0 0015.357 2M9 15h4.581" 
                />
              </svg>
              <span className="hidden sm:inline">{isLoading && !lastUpdated ? 'Fetching...' : 'Refresh'}</span>
            </button>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4">
          <div className="relative flex-grow w-full sm:w-auto">
            <input 
              type="search"
              placeholder="Search news..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-transparent focus:border-blue-300 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-600 outline-none transition-all duration-150 ease-in-out shadow"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 text-gray-400 dark:text-gray-500"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
            </div>
          </div>
          <div className="flex space-x-2">
            {categoryOptions.map(category => (
              <button
                key={category}
                onClick={() => onCategoryChange(category)}
                className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ease-in-out shadow ${
                  selectedCategory === category 
                  ? 'bg-yellow-400 text-gray-800' 
                  : 'bg-white/20 hover:bg-white/30 text-white dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;