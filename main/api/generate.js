const { query } = require('./db');
const { getNames } = require('./db/queries');

// Function to generate random string of given length
function generateRandomString(length) {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let randomString = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * charset.length);
        randomString += charset[randomIndex];
    }
    return randomString;
}

// Function to generate a random email address with a specific domain
function generateRandomEmail(givenName, familyName, domain) {
    const username = `${givenName.toLowerCase()}.${familyName.toLowerCase()}`;
    return `${username}@${domain}`;
}

// Function to generate a random CSV-like data from given names and surnames
function generateRandomCSVFromNames(givenNames, surnames, domain, numRecords) {
    let csv = 'email,password,givenName,familyName\n';
    const fixedPassword = 'Password123@';
    const generatedEmails = new Set(); // Set to store generated emails
    let generatedCount = 0;

    while (generatedCount < numRecords) {
        const givenNameIndex = Math.floor(Math.random() * givenNames.length);
        const familyNameIndex = Math.floor(Math.random() * surnames.length);
        const givenName = givenNames[givenNameIndex];
        const familyName = surnames[familyNameIndex];
        const email = generateRandomEmail(givenName, familyName, domain);

        // Check if the email is not a duplicate
        if (!generatedEmails.has(email)) {
            const password = fixedPassword; // Fixed password
            csv += `${email},${password},${givenName},${familyName}\n`;
            generatedEmails.add(email);
            generatedCount++;
        }
    }

    return csv;
}

async function generateAndInsertUsers(numRecords, domain) {
    const names = await getNames();
    if (!names.length) {
        console.error('No names found in DB. Run import or insert into names table.');
        process.exit(1);
    }
    const givenNames = names.map((row) => row.given_name);
    const surnames = names.map((row) => row.family_name);
    const csvContent = generateRandomCSVFromNames(givenNames, surnames, domain, numRecords);
    const rows = csvContent.trim().split('\n').slice(1);
    for (const row of rows) {
        const [email, password, givenName, familyName] = row.split(',');
        await query(
            `INSERT INTO users (email, password, given_name, family_name)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (email) DO NOTHING`,
            [email, password, givenName, familyName]
        );
    }
    console.log(`Inserted ${rows.length} users into DB.`);
}

// Example usage: Generate CSV with input parameters
const args = process.argv.slice(2);
if (args.length !== 2) {
    console.error('Please provide the domain and the number of records as arguments.');
    console.error('Usage: node generate.js <domain> <numRecords>');
    process.exit(1);
}

const domain = args[0];
const numRecords = parseInt(args[1], 10);
if (isNaN(numRecords) || numRecords <= 0) {
    console.error('The number of records must be a positive integer.');
    process.exit(1);
}

generateAndInsertUsers(numRecords, domain).catch((err) => {
    console.error('Failed to insert users:', err);
    process.exit(1);
});
