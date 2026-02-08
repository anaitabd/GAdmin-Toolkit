/**
 * Link rewriter utility — extracts URLs from HTML and replaces them with tracking URLs
 */

const URL_REGEX = /href=["'](https?:\/\/[^"']+)["']/gi;

/**
 * Extract unique HTTP(S) URLs from HTML content
 * @param {string} html
 * @returns {string[]}
 */
function extractUrls(html) {
    const urls = new Set();
    let match;
    while ((match = URL_REGEX.exec(html)) !== null) {
        urls.add(match[1]);
    }
    URL_REGEX.lastIndex = 0; // reset for next call
    return Array.from(urls);
}

/**
 * Rewrite all href URLs in HTML with tracking redirect URLs
 * @param {string} html - original HTML content
 * @param {Map<string, string>} urlToTrackId - map of original_url -> track_id
 * @param {string} baseUrl - base URL for tracking (e.g. http://localhost)
 * @returns {string} HTML with rewritten links
 */
function rewriteLinks(html, urlToTrackId, baseUrl) {
    return html.replace(URL_REGEX, (fullMatch, url) => {
        const trackId = urlToTrackId.get(url);
        if (trackId) {
            const trackingUrl = `${baseUrl}/t/c/${trackId}`;
            return fullMatch.replace(url, trackingUrl);
        }
        return fullMatch;
    });
}

module.exports = { extractUrls, rewriteLinks };
