/**
 * Affiliate API Integration Library
 * Provides functions to integrate with affiliate network APIs
 */
const axios = require('axios');
const { query } = require('../db');

/**
 * Fetch offers from an affiliate network API
 * @param {number} networkId - Affiliate network ID
 * @returns {Promise<Object>} - Result object with imported offers count
 */
async function fetchOffersFromNetwork(networkId) {
    const networkResult = await query(
        'SELECT id, name, api_url, api_key, api_type FROM affiliate_networks WHERE id = $1',
        [networkId]
    );

    if (networkResult.rows.length === 0) {
        throw new Error('Affiliate network not found');
    }

    const network = networkResult.rows[0];

    if (!network.api_url || !network.api_key) {
        throw new Error('Network API URL and API key are required');
    }

    let offers = [];

    try {
        // Fetch offers based on API type
        switch (network.api_type) {
            case 'hasoffers':
                offers = await fetchFromHasOffers(network);
                break;
            case 'everflow':
                offers = await fetchFromEverflow(network);
                break;
            case 'cake':
                offers = await fetchFromCake(network);
                break;
            case 'generic':
            case 'custom':
            default:
                offers = await fetchFromGeneric(network);
                break;
        }

        // Upsert offers into database
        let imported = 0;
        for (const offer of offers) {
            await upsertOffer(networkId, offer);
            imported++;
        }

        return {
            success: true,
            imported,
            total: offers.length
        };
    } catch (error) {
        console.error('Error fetching offers from network:', error);
        throw new Error(`Failed to fetch offers: ${error.message}`);
    }
}

/**
 * Fetch offers from HasOffers/TUNE API
 */
async function fetchFromHasOffers(network) {
    const response = await axios.get(`${network.api_url}/Affiliate_Offer/findAll`, {
        params: {
            api_key: network.api_key,
            format: 'json'
        },
        timeout: 30000
    });

    if (response.data?.response?.status !== 1) {
        throw new Error('HasOffers API returned error');
    }

    const offersData = response.data.response.data || {};
    const offers = [];

    for (const [id, offerData] of Object.entries(offersData)) {
        offers.push({
            production_id: id,
            name: offerData.name || `Offer ${id}`,
            description: offerData.description || '',
            payout: parseFloat(offerData.payout) || 0,
            click_url: offerData.preview_url || offerData.offer_url || '',
            status: offerData.status === 'active' ? 'active' : 'inactive'
        });
    }

    return offers;
}

/**
 * Fetch offers from Everflow API
 */
async function fetchFromEverflow(network) {
    const response = await axios.get(`${network.api_url}/v1/affiliates/offers`, {
        headers: {
            'X-Eflow-API-Key': network.api_key
        },
        timeout: 30000
    });

    const offersData = response.data?.offers || [];
    const offers = [];

    for (const offerData of offersData) {
        offers.push({
            production_id: offerData.network_offer_id?.toString(),
            name: offerData.name || `Offer ${offerData.network_offer_id}`,
            description: offerData.description || '',
            payout: parseFloat(offerData.payout?.amount) || 0,
            click_url: offerData.tracking_url || '',
            status: offerData.is_active ? 'active' : 'inactive'
        });
    }

    return offers;
}

/**
 * Fetch offers from Cake API
 */
async function fetchFromCake(network) {
    const response = await axios.get(`${network.api_url}/offers/export`, {
        params: {
            api_key: network.api_key,
            format: 'json'
        },
        timeout: 30000
    });

    const offersData = response.data?.offers || [];
    const offers = [];

    for (const offerData of offersData) {
        offers.push({
            production_id: offerData.offer_id?.toString(),
            name: offerData.offer_name || `Offer ${offerData.offer_id}`,
            description: offerData.description || '',
            payout: parseFloat(offerData.payout) || 0,
            click_url: offerData.click_url || '',
            status: offerData.offer_status === 'active' ? 'active' : 'inactive'
        });
    }

    return offers;
}

/**
 * Fetch offers from generic API (JSON response with offers array)
 */
async function fetchFromGeneric(network) {
    const response = await axios.get(`${network.api_url}/offers`, {
        params: {
            key: network.api_key
        },
        timeout: 30000
    });

    const offersData = response.data?.offers || response.data || [];
    const offers = [];

    for (const offerData of offersData) {
        offers.push({
            production_id: offerData.id?.toString() || offerData.offer_id?.toString(),
            name: offerData.name || offerData.offer_name || `Offer`,
            description: offerData.description || '',
            payout: parseFloat(offerData.payout) || 0,
            click_url: offerData.click_url || offerData.url || '',
            status: offerData.status || 'active'
        });
    }

    return offers;
}

/**
 * Upsert an offer into the database
 */
async function upsertOffer(networkId, offerData) {
    // Check if offer with this production_id and network exists
    const existingResult = await query(
        `SELECT id FROM offers 
         WHERE affiliate_network_id = $1 AND production_id = $2`,
        [networkId, offerData.production_id]
    );

    if (existingResult.rows.length > 0) {
        // Update existing offer
        await query(
            `UPDATE offers 
             SET name = $1, description = $2, payout = $3, status = $4, updated_at = NOW()
             WHERE id = $5`,
            [
                offerData.name,
                offerData.description,
                offerData.payout,
                offerData.status,
                existingResult.rows[0].id
            ]
        );
    } else {
        // Insert new offer with defaults
        await query(
            `INSERT INTO offers 
             (name, subject, from_name, html_content, click_url, unsub_url, 
              affiliate_network_id, production_id, description, payout, status, active)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
            [
                offerData.name,
                offerData.name, // default subject
                'Support Team', // default from_name
                '<p>Click here: [click_url]</p>', // default html
                offerData.click_url || '',
                null,
                networkId,
                offerData.production_id,
                offerData.description,
                offerData.payout,
                offerData.status,
                offerData.status === 'active'
            ]
        );
    }
}

/**
 * Fetch suppression list from network API
 * @param {number} networkId - Affiliate network ID
 * @param {number} offerId - Offer ID
 * @returns {Promise<Object>} - Result object
 */
async function fetchSuppressionsFromNetwork(networkId, offerId) {
    const networkResult = await query(
        'SELECT id, name, api_url, api_key, api_type FROM affiliate_networks WHERE id = $1',
        [networkId]
    );

    if (networkResult.rows.length === 0) {
        throw new Error('Affiliate network not found');
    }

    const offerResult = await query(
        'SELECT id, production_id FROM offers WHERE id = $1',
        [offerId]
    );

    if (offerResult.rows.length === 0) {
        throw new Error('Offer not found');
    }

    const network = networkResult.rows[0];
    const offer = offerResult.rows[0];

    if (!network.api_url || !network.api_key) {
        throw new Error('Network API URL and API key are required');
    }

    try {
        // Create suppression process record
        const processResult = await query(
            `INSERT INTO suppression_processes 
             (affiliate_network_id, offer_id, status, progress, emails_found)
             VALUES ($1, $2, 'in_progress', 0, 0)
             RETURNING id`,
            [networkId, offerId]
        );

        const processId = processResult.rows[0].id;

        // Fetch suppressions (this is a simplified version - extend based on API type)
        const response = await axios.get(`${network.api_url}/suppressions/${offer.production_id}`, {
            params: { api_key: network.api_key },
            timeout: 60000
        });

        const emails = response.data?.emails || response.data || [];
        let imported = 0;

        // Insert suppressions in batches
        for (let i = 0; i < emails.length; i += 1000) {
            const batch = emails.slice(i, i + 1000);
            for (const email of batch) {
                try {
                    await query(
                        `INSERT INTO suppression_emails (offer_id, email)
                         VALUES ($1, $2)
                         ON CONFLICT (offer_id, email) DO NOTHING`,
                        [offerId, typeof email === 'string' ? email : email.email]
                    );
                    imported++;
                } catch (err) {
                    // Skip duplicates
                }
            }

            // Update progress
            const progress = Math.round(((i + batch.length) / emails.length) * 100);
            await query(
                `UPDATE suppression_processes 
                 SET progress = $1, emails_found = $2
                 WHERE id = $3`,
                [progress, imported, processId]
            );
        }

        // Mark as completed
        await query(
            `UPDATE suppression_processes 
             SET status = 'completed', progress = 100, completed_at = NOW()
             WHERE id = $1`,
            [processId]
        );

        return {
            success: true,
            imported,
            total: emails.length,
            processId
        };
    } catch (error) {
        console.error('Error fetching suppressions:', error);
        throw new Error(`Failed to fetch suppressions: ${error.message}`);
    }
}

/**
 * Fetch creatives from network API
 * @param {number} networkId - Affiliate network ID
 * @param {number} offerId - Offer ID
 * @returns {Promise<Object>} - Result object
 */
async function fetchCreativesFromNetwork(networkId, offerId) {
    const networkResult = await query(
        'SELECT id, name, api_url, api_key, api_type FROM affiliate_networks WHERE id = $1',
        [networkId]
    );

    if (networkResult.rows.length === 0) {
        throw new Error('Affiliate network not found');
    }

    const offerResult = await query(
        'SELECT id, production_id FROM offers WHERE id = $1',
        [offerId]
    );

    if (offerResult.rows.length === 0) {
        throw new Error('Offer not found');
    }

    const network = networkResult.rows[0];
    const offer = offerResult.rows[0];

    if (!network.api_url || !network.api_key) {
        throw new Error('Network API URL and API key are required');
    }

    try {
        // This is a simplified version - extend based on API type
        const response = await axios.get(`${network.api_url}/creatives/${offer.production_id}`, {
            params: { api_key: network.api_key },
            timeout: 30000
        });

        const creativesData = response.data?.creatives || response.data || [];
        let imported = 0;

        for (const creative of creativesData) {
            await query(
                `INSERT INTO creatives 
                 (offer_id, affiliate_network_id, subject, from_name, html_content, status)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [
                    offerId,
                    networkId,
                    creative.subject || 'No Subject',
                    creative.from_name || 'Support',
                    creative.html_content || creative.body || '',
                    'active'
                ]
            );
            imported++;
        }

        return {
            success: true,
            imported,
            total: creativesData.length
        };
    } catch (error) {
        console.error('Error fetching creatives:', error);
        throw new Error(`Failed to fetch creatives: ${error.message}`);
    }
}

module.exports = {
    fetchOffersFromNetwork,
    fetchSuppressionsFromNetwork,
    fetchCreativesFromNetwork
};
