const { getActiveCredential } = require('./db/queries');

let cachedCreds = null;

async function loadGoogleCreds() {
    if (cachedCreds) return cachedCreds;

    // 1. Try DB credential first
    try {
        const dbCred = await getActiveCredential();
        if (dbCred && dbCred.cred_json) {
            cachedCreds = typeof dbCred.cred_json === 'string'
                ? JSON.parse(dbCred.cred_json)
                : dbCred.cred_json;
            return cachedCreds;
        }
    } catch (_) {
        // DB not available yet (e.g. during initial setup), fall through
    }

    // 2. Fallback to env var
    const b64 = process.env.GOOGLE_CRED_JSON_B64;
    if (!b64) {
        throw new Error(
            'No Google credentials found. Add credentials via the Credentials page or set GOOGLE_CRED_JSON_B64.'
        );
    }

    const raw = Buffer.from(b64, 'base64');
    let jsonBuffer = raw;

    if (process.env.KMS_KEY_ID) {
        const { KeyManagementServiceClient } = require('@google-cloud/kms');
        const client = new KeyManagementServiceClient();
        const [result] = await client.decrypt({
            name: process.env.KMS_KEY_ID,
            ciphertext: raw,
        });
        if (!result.plaintext) {
            throw new Error('KMS decrypt returned empty plaintext');
        }
        jsonBuffer = Buffer.from(result.plaintext);
    }

    cachedCreds = JSON.parse(jsonBuffer.toString('utf8'));
    return cachedCreds;
}

function clearCredsCache() {
    cachedCreds = null;
}

module.exports = { loadGoogleCreds, clearCredsCache };
