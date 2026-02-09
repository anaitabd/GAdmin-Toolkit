/**
 * Link rewriter utility — extracts URLs from HTML and replaces them with tracking URLs
 * Handles HTML entity encoding (e.g. &amp; in href attributes)
 */

const URL_REGEX = /href=["'](https?:\/\/[^"']+)["']/gi;

// ── HTML entity helpers ─────────────────────────────────────────────

/**
 * Decode common HTML entities in URLs (e.g. &amp; → &, &#38; → &)
 * @param {string} str
 * @returns {string}
 */
function htmlDecode(str) {
    return str
        .replace(/&amp;/g, '&')
        .replace(/&#38;/g, '&')
        .replace(/&#x26;/g, '&');
}

/**
 * HTML-encode ampersands in a URL for matching href attributes
 * @param {string} url
 * @returns {string}
 */
function htmlEncode(url) {
    return url.replace(/&/g, '&amp;');
}

/**
 * Check if HTML contains a URL, accounting for &amp; encoding
 * @param {string} html
 * @param {string} url - clean URL (with & not &amp;)
 * @returns {boolean}
 */
function htmlContainsUrl(html, url) {
    if (!url) return false;
    return html.includes(url) || html.includes(htmlEncode(url));
}

/**
 * Replace all occurrences of a URL in HTML, handling both & and &amp; forms.
 * Replaces HTML-encoded version first to avoid partial matches.
 * @param {string} html
 * @param {string} targetUrl - clean URL to find
 * @param {string} replacement - replacement URL
 * @returns {string}
 */
function replaceUrlInHtml(html, targetUrl, replacement) {
    if (!targetUrl) return html;
    let result = html;
    // Replace HTML-encoded version first (more specific)
    const encoded = htmlEncode(targetUrl);
    if (encoded !== targetUrl) {
        result = result.split(encoded).join(replacement);
    }
    // Replace raw version
    result = result.split(targetUrl).join(replacement);
    return result;
}

// ── URL extraction & rewriting ──────────────────────────────────────

/**
 * Extract unique HTTP(S) URLs from HTML href attributes.
 * HTML-decodes entities so stored URLs are clean (& not &amp;).
 * @param {string} html
 * @returns {string[]}
 */
function extractUrls(html) {
    const urls = new Set();
    let match;
    while ((match = URL_REGEX.exec(html)) !== null) {
        urls.add(htmlDecode(match[1]));
    }
    URL_REGEX.lastIndex = 0; // reset for next call
    return Array.from(urls);
}

/**
 * Replace [click] and [unsub]/[unsb] placeholder tags in HTML with offer URLs.
 * Matches all common variants: [click], [unsub], [unsb], [unsu] (case-insensitive).
 *   <a href="[click]">Buy Now</a>
 *   <a href="[unsub]">Unsubscribe</a>
 *
 * @param {string} html - HTML content with [click] / [unsub] / [unsb] tags
 * @param {string} clickUrl - The offer's click_url
 * @param {string|null} unsubUrl - The offer's unsub_url (optional)
 * @returns {string} HTML with tags replaced
 */
function replaceOfferTags(html, clickUrl, unsubUrl) {
    let result = html;
    if (clickUrl) {
        result = result.replace(/\[click\]/gi, clickUrl);
    }
    if (unsubUrl) {
        // Match [unsub], [unsb], [unsu] — all common variants
        result = result.replace(/\[unsub\]|\[unsb\]|\[unsu\]/gi, unsubUrl);
    }
    return result;
}

/**
 * Check if HTML contains [click] or [unsub]/[unsb] tags
 * @param {string} html
 * @returns {{ hasClick: boolean, hasUnsub: boolean }}
 */
function detectOfferTags(html) {
    return {
        hasClick: /\[click\]/i.test(html),
        hasUnsub: /\[unsub\]|\[unsb\]|\[unsu\]/i.test(html),
    };
}

/**
 * Rewrite all href URLs in HTML with tracking redirect URLs.
 * Decodes HTML entities before looking up in the map, so URLs with &amp; are matched.
 * @param {string} html - original HTML content
 * @param {Map<string, string>} urlToTrackId - map of clean original_url -> track_id
 * @param {string} baseUrl - base URL for tracking (e.g. http://localhost)
 * @returns {string} HTML with rewritten links
 */
function rewriteLinks(html, urlToTrackId, baseUrl) {
    return html.replace(URL_REGEX, (fullMatch, url) => {
        // Decode HTML entities before lookup (href may contain &amp;)
        const decoded = htmlDecode(url);
        const trackId = urlToTrackId.get(decoded) || urlToTrackId.get(url);
        if (trackId) {
            const trackingUrl = `${baseUrl}/t/c/${trackId}`;
            return fullMatch.replace(url, trackingUrl);
        }
        return fullMatch;
    });
}

/**
 * Inject a 1x1 open tracking pixel into HTML content
 * @param {string} html - original HTML content
 * @param {string} trackId - open tracking UUID
 * @param {string} baseUrl - base URL for tracking
 * @returns {string} HTML with tracking pixel injected before </body> or appended
 */
function injectOpenPixel(html, trackId, baseUrl) {
    const pixelUrl = `${baseUrl}/t/o/${trackId}`;
    const pixel = `<img src="${pixelUrl}" width="1" height="1" style="display:none;width:1px;height:1px;border:0;" alt="" />`;
    // Insert before </body> if present, otherwise append
    if (/<\/body>/i.test(html)) {
        return html.replace(/<\/body>/i, `${pixel}</body>`);
    }
    return html + pixel;
}

module.exports = {
    extractUrls,
    rewriteLinks,
    injectOpenPixel,
    replaceOfferTags,
    detectOfferTags,
    htmlDecode,
    htmlEncode,
    htmlContainsUrl,
    replaceUrlInHtml,
};
