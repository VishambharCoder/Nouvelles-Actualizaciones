import { RssFeed, NewsCategory } from './types';

export const RSS_FEEDS: RssFeed[] = [
  { name: "CNBC Top Business", url: "https://www.cnbc.com/id/10001147/device/rss/rss.html", category: NewsCategory.BUSINESS },
  // { name: "Reuters Business News", url: "https://feeds.reuters.com/reuters/businessNews", category: NewsCategory.BUSINESS }, // Removed
  { name: "Financial Times (Headlines)", url: "https://www.ft.com/?format=rss", category: NewsCategory.BUSINESS },
  { name: "ESPN Top News", url: "https://www.espn.com/espn/rss/news", category: NewsCategory.SPORTS },
  { name: "BBC Sport", url: "https://feeds.bbci.co.uk/sport/rss.xml", category: NewsCategory.SPORTS },
  { name: "Sky Sports Football", url: "https://www.skysports.com/rss/12040", category: NewsCategory.SPORTS },
  // Added new feeds
  { name: "BBC News World", url: "https://feeds.bbci.co.uk/news/rss.xml", category: NewsCategory.WORLD },
  { name: "NYT World News", url: "https://rss.nytimes.com/services/xml/rss/nyt/World.xml", category: NewsCategory.WORLD },
  { name: "The Guardian World", url: "https://www.theguardian.com/world/rss", category: NewsCategory.WORLD },
  { name: "Al Jazeera All", url: "https://www.aljazeera.com/xml/rss/all.xml", category: NewsCategory.WORLD },
];

export const CORS_PROXY_URL = "https://api.allorigins.win/raw?url=";

export const UPDATE_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes for auto-refresh
export const ARTICLES_PER_PAGE = 12; // Number of articles to load per page/batch

export const DEFAULT_PLACEHOLDER_IMAGE = "https://picsum.photos/seed/newsfallback/400/200";
export const APP_TITLE = "Nouvelles Actualizaciones";
export const GEMINI_MODEL_NAME = "gemini-2.5-flash-preview-04-17";
export const GEMINI_IMAGE_MODEL_NAME = "imagen-3.0-generate-002"; // Though not used in this iteration after removal