const express = require('express');
const router = express.Router();
const dns = require('dns').promises;

// POST /api/tools/spf-lookup - Check SPF records for domains
router.post('/spf-lookup', async (req, res, next) => {
  try {
    const { domains } = req.body;

    if (!Array.isArray(domains) || domains.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'domains array is required'
      });
    }

    const results = [];

    for (const domain of domains.slice(0, 50)) { // Limit to 50 domains
      try {
        const records = await dns.resolveTxt(domain);
        
        const spfRecord = records.flat().find(r => r.startsWith('v=spf1'));
        const dmarcRecords = await dns.resolveTxt(`_dmarc.${domain}`).catch(() => []);
        const dmarcRecord = dmarcRecords.flat().find(r => r.startsWith('v=DMARC1'));
        
        results.push({
          domain,
          spf: spfRecord || 'Not found',
          dmarc: dmarcRecord || 'Not found',
          status: spfRecord ? 'configured' : 'missing'
        });
      } catch (error) {
        results.push({
          domain,
          spf: 'Error',
          dmarc: 'Error',
          status: 'error',
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/tools/reputation - Check domain/IP reputation
router.post('/reputation', async (req, res, next) => {
  try {
    const { target } = req.body;

    if (!target) {
      return res.status(400).json({
        success: false,
        error: 'target (domain or IP) is required'
      });
    }

    // Common blacklist servers
    const blacklists = [
      'zen.spamhaus.org',
      'bl.spamcop.net',
      'b.barracudacentral.org',
      'dnsbl.sorbs.net'
    ];

    const results = [];

    // Check if target is IP
    const isIP = /^(\d{1,3}\.){3}\d{1,3}$/.test(target);
    
    for (const blacklist of blacklists) {
      try {
        let checkHost;
        if (isIP) {
          // Reverse IP for DNSBL lookup
          const parts = target.split('.');
          checkHost = `${parts[3]}.${parts[2]}.${parts[1]}.${parts[0]}.${blacklist}`;
        } else {
          checkHost = `${target}.${blacklist}`;
        }

        await dns.resolve4(checkHost);
        results.push({
          blacklist,
          status: 'listed',
          message: 'Target is listed on this blacklist'
        });
      } catch (error) {
        if (error.code === 'ENOTFOUND') {
          results.push({
            blacklist,
            status: 'clean',
            message: 'Not listed'
          });
        } else {
          results.push({
            blacklist,
            status: 'error',
            message: error.message
          });
        }
      }
    }

    const isListed = results.some(r => r.status === 'listed');

    res.json({
      success: true,
      data: {
        target,
        overall_status: isListed ? 'blacklisted' : 'clean',
        results
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/tools/mailbox-extractor - Extract emails from Gmail mailbox
router.post('/mailbox-extractor', async (req, res, next) => {
  try {
    const { google_account_id, folder = 'INBOX', max_messages = 100 } = req.body;

    if (!google_account_id) {
      return res.status(400).json({
        success: false,
        error: 'google_account_id is required'
      });
    }

    // TODO: Implement actual Gmail API extraction
    // This would use the googleapis package to:
    // 1. Authenticate with the Google account
    // 2. List messages in the specified folder
    // 3. Extract From/To addresses
    // 4. Return unique email addresses

    res.json({
      success: true,
      message: 'Mailbox extraction feature coming soon',
      data: {
        google_account_id,
        folder,
        max_messages,
        extracted_emails: []
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/tools/extractor - Extract values using regex
router.post('/extractor', async (req, res, next) => {
  try {
    const { text, pattern, flags = 'g' } = req.body;

    if (!text || !pattern) {
      return res.status(400).json({
        success: false,
        error: 'text and pattern are required'
      });
    }

    try {
      const regex = new RegExp(pattern, flags);
      const matches = text.match(regex) || [];
      const uniqueMatches = [...new Set(matches)];

      res.json({
        success: true,
        data: {
          pattern,
          total_matches: matches.length,
          unique_matches: uniqueMatches.length,
          matches: uniqueMatches
        }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: `Invalid regex pattern: ${error.message}`
      });
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;
