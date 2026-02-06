const { deleteAllUsers } = require('./services/userService');
const { config } = require('./config');

deleteAllUsers(config.defaultDomain)
  .then(({ deleted, errors, total }) => {
    if (total === 0) {
      console.log('No users to delete.');
      process.exit(0);
      return;
    }

    console.log(`Deleted users count: ${deleted.length}`);
    if (errors.length) {
      console.error(`Errors: ${errors.length}`);
      process.exit(1);
      return;
    }

    console.log('All users deleted.');
    process.exit(0);
  })
  .catch((error) => {
    console.error(error && error.message ? error.message : error);
    process.exit(1);
  });
