const userService = require('../services/userService');
const { logger } = require('../config/logger');

/**
 * @route   POST /api/users/generate
 * @desc    Generate random user data
 * @access  Private/Admin
 */
const generateUsers = async (req, res, next) => {
  try {
    const { domain, count } = req.body;

    if (!domain || !count) {
      return res.status(400).json({
        success: false,
        message: 'Domain and count are required',
      });
    }

    if (count < 1 || count > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Count must be between 1 and 1000',
      });
    }

    const users = await userService.generateUsers(domain, parseInt(count));

    res.json({
      success: true,
      message: `Generated ${users.length} users successfully`,
      data: {
        count: users.length,
        users: users.slice(0, 10), // Return first 10 as preview
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/users/create
 * @desc    Create users from CSV file
 * @access  Private/Admin
 */
const createUsers = async (req, res, next) => {
  try {
    const { csvPath } = req.body;

    if (!csvPath) {
      return res.status(400).json({
        success: false,
        message: 'CSV path is required',
      });
    }

    const result = await userService.createUsersFromCSV(csvPath);

    res.json({
      success: true,
      message: 'User creation completed',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/users/create-single
 * @desc    Create a single user
 * @access  Private/Admin
 */
const createSingleUser = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
      });
    }

    const user = await userService.createUser(email, password, firstName, lastName);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/users/:userKey
 * @desc    Delete a single user
 * @access  Private/Admin
 */
const deleteUser = async (req, res, next) => {
  try {
    const { userKey } = req.params;

    if (!userKey) {
      return res.status(400).json({
        success: false,
        message: 'User key is required',
      });
    }

    const result = await userService.deleteUser(userKey);

    res.json({
      success: true,
      message: 'User deleted successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/users/delete-all
 * @desc    Delete all users except admin
 * @access  Private/Admin
 */
const deleteAllUsers = async (req, res, next) => {
  try {
    const result = await userService.deleteAllUsers();

    res.json({
      success: true,
      message: 'Bulk user deletion completed',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/users/list
 * @desc    List all users
 * @access  Private/Admin
 */
const listUsers = async (req, res, next) => {
  try {
    const { excludeAdmin = true } = req.query;

    const users = await userService.getAllUsers(excludeAdmin === 'true');

    res.json({
      success: true,
      data: {
        count: users.length,
        users,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/users/import-csv
 * @desc    Import CSV file and create users
 * @access  Private/Admin
 */
const importCSV = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    const result = await userService.createUsersFromCSV(req.file.path);

    res.json({
      success: true,
      message: 'CSV import completed',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  generateUsers,
  createUsers,
  createSingleUser,
  deleteUser,
  deleteAllUsers,
  listUsers,
  importCSV,
};
