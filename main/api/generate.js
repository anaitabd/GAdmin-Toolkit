const { generateUsersFromNames } = require('./services/generateService');

const args = process.argv.slice(2);
if (args.length !== 2) {
    console.error('Please provide the domain and the number of records as arguments.');
    console.error('Usage: node generate.js <domain> <numRecords>');
    process.exit(1);
}

const domain = args[0];
const numRecords = Number(args[1]);

generateUsersFromNames(domain, numRecords)
    .then((users) => {
        console.log(`Generated ${users.length} users into files/user_list.csv`);
    })
    .catch((error) => {
        console.error(error && error.message ? error.message : error);
        process.exit(1);
    });
