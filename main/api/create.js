const path = require('path');

const { createUsersFromCSV } = require('./services/userService');

const csvPath = path.resolve(__dirname, '..', '..', 'files', 'user_list.csv');

createUsersFromCSV(csvPath)
  .then(({ created, errors }) => {
    console.log(`CSV file successfully processed. Starting user creation...`);
    console.log(`All users processed. Total users created: ${created.length}`);
    if (errors.length) {
      console.error(`Errors: ${errors.length}`);
    }
    process.exit(errors.length ? 1 : 0);
  })
  .catch((error) => {
    console.error(error && error.message ? error.message : error);
    process.exit(1);
  });
