import React, { useState, useEffect, useCallback } from 'react';
import { NewsItem, RssFeed } from '../types';
import { RSS_FEEDS, UPDATE_INTERVAL_MS } from '../constants';
import { fetchAndParseRss } from '../services/rssParser';

export interface FeedStatus {
  feedName: string;
  status: 'ok' | 'error';
  errorMessage?: string;
}

export const useNewsFeed = () => {
  const [allNewsItems, setAllNewsItems] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null); // Global error for critical failures
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [individualFeedStatuses, setIndividualFeedStatuses] = useState<FeedStatus[]>([]);

  const processAndSortNews = (items: NewsItem[]): NewsItem[] => {
    const uniqueItems = Array.from(new Map(items.map(item => [item.link || item.title + item.pubDate, item])).values());
    uniqueItems.sort((a, b) => {
      const dateA = a.parsedPubDate ? a.parsedPubDate.getTime() : 0;
      const dateB = b.parsedPubDate ? b.parsedPubDate.getTime() : 0;
      return dateB - dateA;
    });
    return uniqueItems;
  };

  const fetchAllNewsFromFeeds = useCallback(async (isManualRefresh?: boolean) => {
    if (isLoading && !isManualRefresh && allNewsItems.length > 0) return;

    console.log("Fetching all news from feeds...", { isManualRefresh, isLoading, hasItems: allNewsItems.length > 0 });
    setIsLoading(true);
    setError(null);
    setIndividualFeedStatuses([]); // Reset statuses on new fetch

    try {
      const feedPromises = RSS_FEEDS.map(feed => fetchAndParseRss(feed));
      const results = await Promise.allSettled(feedPromises);

      let fetchedNews: NewsItem[] = [];
      const currentFeedStatuses: FeedStatus[] = [];

      results.forEach((result, index) => {
        const feedName = RSS_FEEDS[index].name;
        if (result.status === 'fulfilled' && result.value) {
          fetchedNews.push(...result.value);
          currentFeedStatuses.push({ feedName, status: 'ok' });
        } else if (result.status === 'rejected') {
          const reason = result.reason as Error;
          console.error(`A feed failed to load: ${feedName}`, reason);
          currentFeedStatuses.push({ feedName, status: 'error', errorMessage: reason.message || 'Unknown error' });
        }
      });
      
      setIndividualFeedStatuses(currentFeedStatuses);
      const processedNews = processAndSortNews(fetchedNews);
      setAllNewsItems(processedNews);
      
      if (processedNews.length === 0 && results.every(r => r.status === 'rejected')) {
        setError("Failed to load any news feeds. Please check your internet connection or try again later. CORS issues might also prevent loading from some sources without a proper backend proxy.");
      } else if (results.some(r => r.status === 'rejected') && processedNews.length > 0) {
        setError(null); // Clear global error if some feeds succeeded
      } else if (processedNews.length === 0 && results.some(r => r.status === 'fulfilled')) {
        setError(null); 
      }
      setLastUpdated(new Date());
    } catch (e) {
      console.error("Error fetching news:", e);
      setError(e instanceof Error ? e.message : "An unknown error occurred while fetching news.");
      setAllNewsItems([]);
      setIndividualFeedStatuses(RSS_FEEDS.map(feed => ({ feedName: feed.name, status: 'error', errorMessage: 'Network or general fetch error' })));
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, allNewsItems.length]);

  useEffect(() => {
    fetchAllNewsFromFeeds(true); 
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  useEffect(() => {
    const intervalId = setInterval(() => {
        console.log("Automatic news update triggered.");
        fetchAllNewsFromFeeds(false); 
    }, UPDATE_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [fetchAllNewsFromFeeds]);

  return { 
    allNewsItems,
    isLoading, 
    error, 
    fetchAllNewsFromFeeds, 
    lastUpdated,
    individualFeedStatuses,
  };
};