const cheerio = require('cheerio');

function injectTrackingPixel(html, trackingToken, baseUrl) {
  const $ = cheerio.load(html);
  
  const trackingPixelUrl = `${baseUrl}/track/open/${trackingToken}`;
  const pixelImg = `<img src="${trackingPixelUrl}" width="1" height="1" style="display:none;" alt="" />`;
  
  if ($('body').length > 0) {
    $('body').append(pixelImg);
  } else {
    $ = cheerio.load(html + pixelImg);
  }
  
  return $.html();
}

function rewriteLinks(html, trackingToken, baseUrl) {
  const $ = cheerio.load(html);
  
  $('a[href]').each((i, elem) => {
    const $elem = $(elem);
    const originalUrl = $elem.attr('href');
    
    if (originalUrl && !originalUrl.startsWith('mailto:') && !originalUrl.startsWith('tel:')) {
      const trackedUrl = `${baseUrl}/track/click/${trackingToken}?url=${encodeURIComponent(originalUrl)}`;
      $elem.attr('href', trackedUrl);
    }
  });
  
  return $.html();
}

function addUnsubscribeLink(html, trackingToken, baseUrl) {
  const $ = cheerio.load(html);
  
  const unsubscribeUrl = `${baseUrl}/track/unsubscribe/${trackingToken}`;
  const unsubscribeLink = `
    <div style="text-align: center; margin-top: 20px; padding: 20px; font-size: 12px; color: #666;">
      <a href="${unsubscribeUrl}" style="color: #666; text-decoration: underline;">Unsubscribe</a>
    </div>
  `;
  
  if ($('body').length > 0) {
    $('body').append(unsubscribeLink);
  } else {
    $ = cheerio.load(html + unsubscribeLink);
  }
  
  return $.html();
}

function processEmailForTracking(html, trackingToken, baseUrl, options = {}) {
  const {
    includeOpenTracking = true,
    includeClickTracking = true,
    includeUnsubscribe = true
  } = options;
  
  let processedHtml = html;
  
  if (includeClickTracking) {
    processedHtml = rewriteLinks(processedHtml, trackingToken, baseUrl);
  }
  
  if (includeUnsubscribe) {
    processedHtml = addUnsubscribeLink(processedHtml, trackingToken, baseUrl);
  }
  
  if (includeOpenTracking) {
    processedHtml = injectTrackingPixel(processedHtml, trackingToken, baseUrl);
  }
  
  return processedHtml;
}

module.exports = {
  injectTrackingPixel,
  rewriteLinks,
  addUnsubscribeLink,
  processEmailForTracking
};
