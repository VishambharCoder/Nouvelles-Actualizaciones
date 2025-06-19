import React from 'react';
import { NewsItem, AiInteractionModalData, NewsCategory } from '../types';
import { DEFAULT_PLACEHOLDER_IMAGE, CORS_PROXY_URL } from '../constants';

interface NewsCardProps {
  item: NewsItem;
  style?: React.CSSProperties; // For virtual list (though virtual list not currently used, kept for potential future use)
  onAskAi: (data: AiInteractionModalData) => void;
}

const getVariedPlaceholderUrl = (itemId: string): string => {
  const seed = itemId.replace(/[^a-zA-Z0-9-]/g, '_').substring(0, 30) || 'placeholder_seed';
  return `https://picsum.photos/seed/${seed}/400/200`;
};

// Checks if a URL likely points to a low-quality meta image (e.g., logo, tiny icon)
function isPotentiallyLowQualityMeta(imageUrl: string | null): boolean {
  if (!imageUrl) return true; 
  const lowerUrl = imageUrl.toLowerCase();
  const lowQualityKeywords = ['logo', 'icon', 'avatar', 'placeholder', 'default', 'spinner', 'transparent.gif', 'spacer.gif', 'blank.gif', 'loading.gif', 'gradient', 'pattern', 'bg.', 'captcha', 'badge', 'feed', 'rss', 'sprite'];
  if (lowQualityKeywords.some(keyword => lowerUrl.includes(keyword))) {
    return true;
  }
  // Checks for URL patterns like /32x32/ or w=32&h=32
  if (/\/\d{1,2}x\d{1,2}\//.test(lowerUrl) || /_\d{1,2}x\d{1,2}\./.test(lowerUrl) || /[?&](w|width|h|height)=\d{1,2}(&|$)/.test(lowerUrl)) {
      return true;
  }
  return false;
}

// Checks if an <img> element from scraped HTML is a plausible main content image
function isPlausibleContentImage(src: string, imgElement: HTMLImageElement): boolean {
  const lowerSrc = src.toLowerCase();
  const implausibleKeywords = [
    'ad', 'banner', 'pixel', 'tracker', 'default-image', 'profile-', 'avatar', 
    'author', 'user', 'comment', 'gravatar', 'share', 'social', 'button', 
    'icon', 'logo', 'spinner', 'loading', 'transparent', 'empty', 'spacer', 
    'placeholder', 'cover-default', 'thumb-default', 'sprite', 'captcha', 
    'badge', 'award', 'rating', 'star', 'rss', 'feed', 'widget', 'navigation', 'nav-', 'menu', 'breadcrumb',
    'bg-', 'background', 'pattern', 'bullet', 'arrow', 'disclosure'
  ];
  if (implausibleKeywords.some(keyword => lowerSrc.includes(keyword) || (imgElement.alt && implausibleKeywords.some(key => imgElement.alt.toLowerCase().includes(key))))) {
    return false;
  }

  let parent = imgElement.parentElement;
  for (let i = 0; i < 5 && parent; i++) { // Check up to 5 levels of parents
    const parentTag = parent.tagName.toLowerCase();
    const parentClass = (parent.className && typeof parent.className === 'string' ? parent.className : '').toLowerCase();
    const parentId = (parent.id && typeof parent.id === 'string' ? parent.id : '').toLowerCase();
    const parentRole = (parent.getAttribute('role') || '').toLowerCase();

    const nonContentIndicators = [
        'header', 'footer', 'nav', 'aside', 'sidebar', 'menu', 'toolbar', 'banner', 'masthead', 'topbar',
        'ad', 'ads', 'advertisement', 'promo', 'share', 'social', 'logo', 'authorbox', 'user-profile', 'avatar', 'profile',
        'bio', 'meta', 'timestamp', 'byline', 'comments', 'related-posts', 'pagination', 'carousel-controls',
        'modal', 'popup', 'dropdown', 'tooltip', 'breadcrumb', 'search', 'form', 'survey',
        'widget', 'toolbar', 'figcaption', 'caption', 'credit', 'source', 'tag', 'category-links', 'breadcrumbs'
    ];
     // Allow 'figure' itself, but not if figure is inside a clear non-content area.
    if (parentTag !== 'figure' && nonContentIndicators.some(indicator => 
        parentTag === indicator || parentClass.includes(indicator) || parentId.includes(indicator) || parentRole.includes(indicator) || parentRole === `doc-${indicator}`
    )) {
      return false;
    }
    parent = parent.parentElement;
  }
  
  const minDimension = 120; 
  const minArea = minDimension * minDimension * 0.8; // Slightly relax minArea if dimensions are good

  const width = imgElement.naturalWidth || parseInt(imgElement.getAttribute('width') || '0');
  const height = imgElement.naturalHeight || parseInt(imgElement.getAttribute('height') || '0');
  
  if ((width > 0 && width < minDimension) || (height > 0 && height < minDimension)) {
    return false;
  }
   if (width * height < minArea) {
    return false;
  }
  
  if (width > 0 && height > 0) {
    const aspectRatio = width / height;
    // Allow more skewed aspect ratios if image is very large (e.g. panoramas)
    const areaThresholdForSkew = 100000; // e.g. 500x200 or 200x500
    if ((aspectRatio > 4 || aspectRatio < 0.25) && (width * height < areaThresholdForSkew)) { 
        return false;
    }
  } else { 
    return false;
  }
  
  // URL patterns for tiny decorative images (e.g., 1x1 pixels, very small dimensions in URL)
  if (/\/\d{1,2}x\d{1,2}\//.test(lowerSrc) || /_\d{1,2}x\d{1,2}\./.test(lowerSrc) || /[?&](w|width|h|height)=\d{1,2}(&|$)/.test(lowerSrc)) {
      return false; 
  }

  return true;
}


const NewsCard: React.FC<NewsCardProps> = React.memo(({ item, style, onAskAi }) => {
  const [currentImageSrc, setCurrentImageSrc] = React.useState<string>(() => 
    (item.thumbnailUrl && !isPotentiallyLowQualityMeta(item.thumbnailUrl)) 
      ? item.thumbnailUrl 
      : getVariedPlaceholderUrl(item.id) // Initial placeholder if RSS thumb is bad/missing
  );
  const [isProcessingImage, setIsProcessingImage] = React.useState<boolean>(false);

  React.useEffect(() => {
    let isMounted = true;
    
    const performImageScraping = async () => {
      if (!item.link || !isMounted) {
        if(isMounted) {
            setCurrentImageSrc(getVariedPlaceholderUrl(item.id));
            setIsProcessingImage(false);
        }
        return;
      }

      setIsProcessingImage(true); // Set to true when scraping starts

      try {
        const response = await fetch(`${CORS_PROXY_URL}${encodeURIComponent(item.link)}`);
        if (!isMounted) return;

        if (!response.ok) {
          if (isMounted) setCurrentImageSrc(getVariedPlaceholderUrl(item.id));
          return;
        }

        const htmlText = await response.text();
        if (!isMounted) return;

        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, "text/html");
        let scrapedImageCandidate: string | null = null;

        // Scrape body for best plausible image
        const allBodyImages: { src: string; area: number; plausible: boolean; element: HTMLImageElement }[] = [];
        doc.querySelectorAll('img').forEach(imgNode => {
            if (!isMounted) return;
            const img = imgNode as HTMLImageElement;
            let srcAttr = img.src || img.dataset.src || img.getAttribute('data-lazy-src') || img.getAttribute('data-src');
            if (srcAttr && !srcAttr.startsWith('data:image/') && srcAttr.length > 10) {
                try {
                    const absoluteSrc = new URL(srcAttr, item.link).toString();
                    const plausible = isPlausibleContentImage(absoluteSrc, img);
                    const width = img.naturalWidth || parseInt(img.getAttribute('width') || '0');
                    const height = img.naturalHeight || parseInt(img.getAttribute('height') || '0');
                    const area = (width > 0 && height > 0) ? width * height : 0;
                    allBodyImages.push({ src: absoluteSrc, area, plausible, element: img });
                } catch (e) { /* Ignore invalid URLs */ }
            }
        });

        if (allBodyImages.length > 0) {
            allBodyImages.sort((a, b) => {
                if (a.plausible && !b.plausible) return -1;
                if (!a.plausible && b.plausible) return 1;
                return b.area - a.area; // Sort by area if plausibility is same
            });
            if (allBodyImages[0] && allBodyImages[0].plausible && allBodyImages[0].area > 0) {
                scrapedImageCandidate = allBodyImages[0].src;
            }
        }

        // If no good body image, try meta tags
        if (!scrapedImageCandidate && isMounted) {
            let bestMetaImageUrl: string | null = null;
            let anyQualityMetaImageUrl: string | null = null;
            const metaTagSelectors = [
                { selector: 'meta[property="og:image"]', attribute: 'content' },
                { selector: 'meta[name="twitter:image"]', attribute: 'content' },
                { selector: 'link[rel="image_src"]', attribute: 'href' },
            ];

            for (const { selector, attribute } of metaTagSelectors) {
                if (!isMounted) break;
                const element = doc.querySelector(selector);
                if (element) {
                    const rawUrl = element.getAttribute(attribute);
                    if (rawUrl) {
                        try {
                            const absoluteUrl = new URL(rawUrl, item.link).toString();
                            if (!isPotentiallyLowQualityMeta(absoluteUrl)) {
                                bestMetaImageUrl = absoluteUrl;
                                break; 
                            } else if (!anyQualityMetaImageUrl) {
                                anyQualityMetaImageUrl = absoluteUrl;
                            }
                        } catch (e) { /* ignore */ }
                    }
                }
            }
            scrapedImageCandidate = bestMetaImageUrl || anyQualityMetaImageUrl;
        }

        if (isMounted) {
            if (scrapedImageCandidate) {
                setCurrentImageSrc(scrapedImageCandidate);
            } else {
                setCurrentImageSrc(getVariedPlaceholderUrl(item.id)); // Fallback if scraping yielded nothing
            }
        }
      } catch (error) {
        // console.error(`Error scraping image for ${item.link}:`, error);
        if (isMounted) setCurrentImageSrc(getVariedPlaceholderUrl(item.id));
      } finally {
        if (isMounted) setIsProcessingImage(false);
      }
    };

    // Main decision logic for the effect
    const goodRssThumbnail = item.thumbnailUrl && !isPotentiallyLowQualityMeta(item.thumbnailUrl);

    if (goodRssThumbnail) {
      if (currentImageSrc !== item.thumbnailUrl) setCurrentImageSrc(item.thumbnailUrl!); // item.thumbnailUrl is checked
      setIsProcessingImage(false);
    } else if (item.link) { 
      // RSS thumb is bad/missing AND there's a link to scrape.
      performImageScraping();
    } else {
      // No good RSS thumbnail, and no link to scrape. Use placeholder.
      const variedPlaceholder = getVariedPlaceholderUrl(item.id);
      if (currentImageSrc !== variedPlaceholder) setCurrentImageSrc(variedPlaceholder);
      setIsProcessingImage(false);
    }

    return () => { isMounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id, item.link, item.thumbnailUrl]); 


  const handleError = () => {
    const variedPlaceholder = getVariedPlaceholderUrl(item.id);
    if (currentImageSrc !== variedPlaceholder && currentImageSrc !== DEFAULT_PLACEHOLDER_IMAGE) {
      setCurrentImageSrc(variedPlaceholder);
    } else if (currentImageSrc !== DEFAULT_PLACEHOLDER_IMAGE) {
      setCurrentImageSrc(DEFAULT_PLACEHOLDER_IMAGE);
    }
  };

  const formattedDate = item.parsedPubDate 
    ? item.parsedPubDate.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : item.pubDate || 'Date not available';
  
  const getCategoryStyles = (category: NewsCategory): string => {
    switch (category) {
      case NewsCategory.BUSINESS:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case NewsCategory.SPORTS:
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case NewsCategory.WORLD:
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  return (
    // Removed outer p-1, style prop retained for potential virtual list usage
    <div style={style} className="h-full"> 
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden flex flex-col hover:shadow-2xl dark:hover:shadow-gray-700/50 transition-shadow duration-300 ease-in-out h-full">
        <a href={item.link} target="_blank" rel="noopener noreferrer" className="block relative" aria-label={`Read more about ${item.title}`}>
          {isProcessingImage && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-700 bg-opacity-75 dark:bg-opacity-75 z-10">
              <svg className="animate-spin h-6 w-6 text-blue-600 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          )}
          <img 
            className="w-full h-48 object-cover" 
            src={currentImageSrc} 
            alt={`Thumbnail for ${item.title}`} 
            onError={handleError}
            loading="lazy"
          />
        </a>
        <div className="p-4 md:p-5 flex flex-col flex-grow">
          <div className="mb-1">
            <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full ${getCategoryStyles(item.category)}`}>
              {item.category}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2 leading-tight h-14 overflow-hidden">
            <a href={item.link} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-150">
              {item.title}
            </a>
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 flex-grow" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {item.description}
          </p>
          <div className="mt-auto pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-2">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                    Source: <span className="font-medium">{item.sourceName}</span>
                </div>
                 <div className="flex space-x-2">
                    <button onClick={() => onAskAi({ newsItem: item })} title="Ask AI about this article" className="text-gray-400 hover:text-blue-500 dark:hover:text-blue-300 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" /><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 12a8.25 8.25 0 11-16.5 0 8.25 8.25 0 0116.5 0z" /></svg>
                    </button>
                    <button title="Save for later (UI only)" className="text-gray-400 hover:text-green-500 dark:hover:text-green-300 transition-colors">
                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" /></svg>
                    </button>
                    <button title="Share (UI only)" className="text-gray-400 hover:text-purple-500 dark:hover:text-purple-300 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" /></svg>
                    </button>
                 </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Published: {formattedDate}
            </p>
             {item.author && item.author !== item.sourceName && <p className="text-xs text-gray-400 dark:text-gray-500 truncate">By: {item.author}</p>}
          </div>
        </div>
      </div>
    </div>
  );
});

export default NewsCard;