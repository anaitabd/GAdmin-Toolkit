const express = require('express');
const AccountSelectionService = require('../services/accountSelectionService');

const router = express.Router();

// Get the best account based on criteria
router.post('/select', (req, res, next) => {
  try {
    const { country, region, domain } = req.body;
    const account = AccountSelectionService.getBestAccount({ country, region, domain });

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'No suitable G Suite account found for the given criteria',
      });
    }

    res.json({ success: true, data: account });
  } catch (error) {
    next(error);
  }
});

// Get all matching accounts
router.post('/match', (req, res, next) => {
  try {
    const { country, region, domain } = req.body;
    const accounts = AccountSelectionService.getMatchingAccounts({ country, region, domain });

    res.json({ success: true, data: accounts });
  } catch (error) {
    next(error);
  }
});

// Get account with full credentials
router.get('/:id/with-credentials', (req, res, next) => {
  try {
    const accountId = parseInt(req.params.id);
    const account = AccountSelectionService.getAccountWithCredentials(accountId);

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Account not found',
      });
    }

    res.json({ success: true, data: account });
  } catch (error) {
    next(error);
  }
});

// Get a load-balanced account
router.post('/load-balanced', (req, res, next) => {
  try {
    const { country, domain } = req.body;
    const account = AccountSelectionService.getLoadBalancedAccount({ country, domain });

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'No suitable G Suite account found',
      });
    }

    res.json({ success: true, data: account });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
