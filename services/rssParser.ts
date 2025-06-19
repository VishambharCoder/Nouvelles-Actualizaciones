import { NewsItem, RssFeed } from '../types';
import { CORS_PROXY_URL } from '../constants';

const getElementText = (element: Element, tagName: string): string => {
  const node = element.querySelector(tagName);
  return node?.textContent?.trim() || '';
};

const getElementAttribute = (element: Element, tagName: string, attributeName: string): string | undefined => {
  const node = element.querySelector(tagName);
  return node?.getAttribute(attributeName) || undefined;
};

const extractThumbnailUrl = (itemElement: Element, description: string): string | undefined => {
  // Try media:thumbnail
  let mediaThumbnail = itemElement.querySelector('media\\:thumbnail');
  if (mediaThumbnail && mediaThumbnail.getAttribute('url')) {
    return mediaThumbnail.getAttribute('url')!;
  }
  // Try media:content with medium="image"
  const mediaContent = Array.from(itemElement.querySelectorAll('media\\:content'));
  const imageMediaContent = mediaContent.find(mc => mc.getAttribute('medium') === 'image' && mc.getAttribute('url'));
  if (imageMediaContent) {
    return imageMediaContent.getAttribute('url')!;
  }
  // Try enclosure with type="image/*"
  const enclosure = itemElement.querySelector('enclosure');
  if (enclosure && enclosure.getAttribute('url') && enclosure.getAttribute('type')?.startsWith('image/')) {
    return enclosure.getAttribute('url')!;
  }
  // Try to find image in description HTML (less reliable)
  if (description) {
    try {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = description; // This can be risky if description contains malicious script
      const imgTag = tempDiv.querySelector('img');
      if (imgTag && imgTag.src) {
        // Basic validation for src
        if (imgTag.src.startsWith('http://') || imgTag.src.startsWith('https://')) {
           return imgTag.src;
        }
      }
    } catch (e) {
      console.warn("Error parsing description for image:", e);
    }
  }
  return undefined;
};


export const fetchAndParseRss = async (feed: RssFeed): Promise<NewsItem[]> => {
  const newsItems: NewsItem[] = [];
  try {
    const response = await fetch(`${CORS_PROXY_URL}${encodeURIComponent(feed.url)}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch RSS feed ${feed.name}: ${response.statusText}`);
    }
    const xmlText = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, "application/xml");

    const parserError = doc.querySelector("parsererror");
    if (parserError) {
      console.error(`Error parsing XML for ${feed.name}:`, parserError.textContent);
      throw new Error(`Error parsing XML for ${feed.name}`);
    }
    
    const items = doc.querySelectorAll("item, entry"); // 'entry' for Atom feeds

    items.forEach(itemElement => {
      const title = getElementText(itemElement, "title");
      let link = getElementText(itemElement, "link");
      if (!link && itemElement.querySelector("link[href]")) { // Atom feeds use <link href="...">
        link = itemElement.querySelector("link[href]")!.getAttribute('href')!;
      }
      
      let description = getElementText(itemElement, "description");
      if (!description) description = getElementText(itemElement, "summary"); // Atom
      if (!description) description = getElementText(itemElement, "content"); // Atom, might be full content

      // Sanitize description by removing HTML tags for snippet
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = description;
      let plainDescription = tempDiv.textContent || tempDiv.innerText || "";
      if (plainDescription.length > 200) {
        plainDescription = plainDescription.substring(0, 200) + "...";
      }


      const pubDateStr = getElementText(itemElement, "pubDate") || getElementText(itemElement, "published"); // 'published' for Atom
      const thumbnailUrl = extractThumbnailUrl(itemElement, description);
      const author = getElementText(itemElement, "dc\\:creator") || getElementText(itemElement, "author > name");


      const id = link || title + pubDateStr; // Create a fallback ID

      if (title && link) {
        let parsedPubDate: Date | undefined = undefined;
        if (pubDateStr) {
            try {
                parsedPubDate = new Date(pubDateStr);
            } catch (e) {
                console.warn(`Could not parse date: ${pubDateStr} for item ${title}`);
            }
        }

        newsItems.push({
          id,
          title,
          link,
          description: plainDescription,
          pubDate: pubDateStr,
          parsedPubDate,
          thumbnailUrl,
          sourceName: feed.name,
          category: feed.category,
          author: author || feed.name, // Fallback author to source name
        });
      }
    });

  } catch (error) {
    console.error(`Error processing feed ${feed.name}:`, error);
    // Optionally re-throw or return empty array to indicate failure for this feed
    // For this app, we'll log and return empty, so other feeds can still load.
  }
  return newsItems;
};
