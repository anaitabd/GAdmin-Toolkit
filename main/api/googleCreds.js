const { KeyManagementServiceClient } = require('@google-cloud/kms');

let cachedCreds = null;

async function loadGoogleCreds() {
    if (cachedCreds) return cachedCreds;

    const b64 = process.env.GOOGLE_CRED_JSON_B64;
    if (!b64) {
        throw new Error('GOOGLE_CRED_JSON_B64 is not set');
    }

    const raw = Buffer.from(b64, 'base64');
    let jsonBuffer = raw;

    if (process.env.KMS_KEY_ID) {
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

module.exports = { loadGoogleCreds };
