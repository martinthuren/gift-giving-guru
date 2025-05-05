// FULL CODE SNIPPET: content.js (Example Scraper)

console.log("GiftGuru Content Script Loaded");

/**
 * Attempts to find data using a query selector.
 * @param {string} selector - The CSS selector.
 * @param {string} attribute - The attribute to get ('textContent', 'src', 'href', etc.).
 * @returns {string | null} - The found data or null.
 */
function getData(selector, attribute = 'textContent') {
    try {
        const element = document.querySelector(selector);
        if (element) {
            if (attribute === 'textContent') {
                return element.textContent.trim();
            }
             // Special handling for meta tags (content attribute)
             if (element.tagName === 'META' && attribute === 'content') {
                return element.getAttribute('content')?.trim() || null;
             }
            return element[attribute]?.trim() || null;
        }
    } catch (e) {
        console.warn(`GiftGuru: Error finding data for selector "${selector}":`, e);
    }
    return null;
}

/**
 * Attempts multiple selectors for a piece of data.
 * @param {string[]} selectors - Array of CSS selectors to try.
 * @param {string} attribute - The attribute to get.
 * @returns {string | null} - The first piece of data found or null.
 */
function findData(selectors, attribute = 'textContent') {
    for (const selector of selectors) {
        const data = getData(selector, attribute);
        if (data) {
            console.log(`GiftGuru: Found data using selector "${selector}"`);
            return data;
        }
    }
    console.log(`GiftGuru: Could not find data using selectors: ${selectors.join(', ')}`);
    return null;
}


// --- Data Extraction Logic ---
let extractedData = {
    title: null,
    imageUrl: null,
    // price: null, // Price is often complex due to variations/sales
    url: window.location.href
};

// --- Try Specific Site Logic (Example: Amazon) ---
if (window.location.hostname.includes('amazon.')) {
    console.log("GiftGuru: Amazon detected");
    extractedData.title = findData(['#productTitle']);
    // Amazon image selectors can be complex, try common ones
    extractedData.imageUrl = findData(['#landingImage', '#imgBlkFront', '#main-image-container img'], 'src');
    // extractedData.price = findData(['.a-price .a-offscreen', '#price_inside_buybox', '#priceblock_ourprice']); // Price needs more parsing often
}
// --- Add more site-specific logic here (e.g., Etsy, Target) ---
// else if (window.location.hostname.includes('etsy.com')) { ... }


// --- Generic Fallbacks (If specific site logic didn't find everything) ---
if (!extractedData.title) {
    console.log("GiftGuru: Using generic title fallback");
    // Try Open Graph title or standard title tag
    extractedData.title = findData(['meta[property="og:title"]', 'meta[name="twitter:title"]'], 'content') || document.title || '(No Title Found)';
}
if (!extractedData.imageUrl) {
     console.log("GiftGuru: Using generic image fallback");
    // Try Open Graph image or Twitter image meta tags
    extractedData.imageUrl = findData(['meta[property="og:image"]', 'meta[name="twitter:image"]'], 'content');
    // As a last resort, maybe look for a prominent image? (More complex)
}

// Clean up title
if (extractedData.title) {
     extractedData.title = extractedData.title.replace(/\s+/g, ' ').trim(); // Remove extra whitespace
}


console.log("GiftGuru Extracted Data:", extractedData);

// --- Send Data Back to Popup/Background ---
// Check if the script is being run in response to a message (optional, good practice)
// For simplicity here, we just send it directly.
try {
    chrome.runtime.sendMessage({
        type: 'GIFTGURU_PAGE_DATA', // Custom message type
        payload: extractedData
    });
    console.log("GiftGuru: Sent page data message.");
} catch (error) {
    console.error("GiftGuru: Error sending message from content script:", error);
     // This might happen if the popup closed before the message could be sent
}