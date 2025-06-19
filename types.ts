export enum NewsCategory {
  ALL = "All Categories",
  BUSINESS = "Business",
  SPORTS = "Sports",
  WORLD = "World News", // Added new category
}

export interface RssFeed {
  name: string;
  url: string;
  category: NewsCategory; // Should be Business, Sports, or World, not ALL
}

export interface NewsItem {
  id: string;
  title: string;
  link: string;
  description: string;
  pubDate?: string;
  parsedPubDate?: Date; // For sorting
  thumbnailUrl?: string;
  sourceName: string;
  category: NewsCategory; // Should be Business, Sports, or World
  author?: string;
}

export interface AiInteractionModalData {
  newsItem: NewsItem;
}