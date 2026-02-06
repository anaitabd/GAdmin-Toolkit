const { EventEmitter } = require('events');

function createReadStreamMock(rows = [], { throwError } = {}) {
  return {
    pipe() {
      const transform = new EventEmitter();
      process.nextTick(() => {
        if (throwError) {
          transform.emit('error', throwError);
          return;
        }
        for (const row of rows) transform.emit('data', row);
        transform.emit('end');
      });
      return transform;
    },
  };
}

describe('userService', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  function setupMocks({ listPages, insertImpl, deleteImpl, configOverride } = {}) {
    jest.doMock('../config', () => {
      return {
        config: {
          defaultDomain: 'example.com',
          adminEmail: 'admin@example.com',
          ...configOverride,
        },
      };
    });

    const authorize = jest.fn().mockResolvedValue({});
    const getAuthClient = jest.fn(() => ({ authorize }));

    const users = {
      list: jest.fn(),
      insert: jest.fn(),
      delete: jest.fn(),
    };

    if (Array.isArray(listPages) && listPages.length) {
      users.list.mockImplementation(async () => listPages.shift());
    } else {
      users.list.mockResolvedValue({ data: { users: [], nextPageToken: undefined } });
    }

    if (insertImpl) users.insert.mockImplementation(insertImpl);
    else users.insert.mockResolvedValue({ data: { id: 'created-id' } });

    if (deleteImpl) users.delete.mockImplementation(deleteImpl);
    else users.delete.mockResolvedValue({});

    const getAdminDirectory = jest.fn(() => ({ users }));

    jest.doMock('../services/googleAuth', () => {
      return { getAuthClient, getAdminDirectory };
    });

    return { users, getAuthClient, getAdminDirectory, authorize };
  }

  test('listUsers pagine et concatène', async () => {
    const page1 = { data: { users: [{ primaryEmail: 'u1@example.com' }], nextPageToken: 't2' } };
    const page2 = { data: { users: [{ primaryEmail: 'u2@example.com' }], nextPageToken: undefined } };

    const { users, authorize } = setupMocks({ listPages: [page1, page2] });

    const userService = require('../services/userService');
    const result = await userService.listUsers('example.com');

    expect(authorize).toHaveBeenCalled();
    expect(users.list).toHaveBeenCalledTimes(2);

    // domain doit être transmis
    expect(users.list.mock.calls[0][0]).toMatchObject({ domain: 'example.com', maxResults: 100 });

    expect(result).toHaveLength(2);
    expect(result.map((u) => u.primaryEmail)).toEqual(['u1@example.com', 'u2@example.com']);
  });

  test('createUser valide et appelle users.insert', async () => {
    const { users } = setupMocks();
    const userService = require('../services/userService');

    users.insert.mockResolvedValueOnce({ data: { id: 'x', primaryEmail: 'a@example.com' } });

    const created = await userService.createUser({
      email: 'a@example.com',
      password: 'Password123@',
      givenName: 'A',
      familyName: 'B',
    });

    expect(users.insert).toHaveBeenCalledTimes(1);
    const call = users.insert.mock.calls[0][0];
    expect(call).toHaveProperty('requestBody');
    expect(call.requestBody).toMatchObject({
      primaryEmail: 'a@example.com',
      password: 'Password123@',
      changePasswordAtNextLogin: false,
      name: { givenName: 'A', familyName: 'B' },
    });

    expect(created).toMatchObject({ id: 'x', primaryEmail: 'a@example.com' });
  });

  test('createUsersFromCSV retourne created + errors', async () => {
    const fs = require('fs');

    const insertImpl = jest
      .fn()
      .mockResolvedValueOnce({ data: { id: 'ok1' } })
      .mockRejectedValueOnce(new Error('insert failed'));

    setupMocks({ insertImpl: (...args) => insertImpl(...args) });

    jest.spyOn(fs, 'createReadStream').mockImplementation(() =>
      createReadStreamMock([
        { email: 'u1@example.com', password: 'p', givenName: 'U1', familyName: 'X' },
        { email: 'u2@example.com', password: 'p', givenName: 'U2', familyName: 'Y' },
      ])
    );

    const userService = require('../services/userService');
    const result = await userService.createUsersFromCSV('/abs/path/user_list.csv');

    expect(result.created).toHaveLength(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toMatchObject({ email: 'u2@example.com' });
  });

  test('deleteAllUsers supprime tous sauf l\'admin', async () => {
    const page = {
      data: {
        users: [
          { primaryEmail: 'admin@example.com' },
          { primaryEmail: 'u1@example.com' },
          { primaryEmail: 'u2@example.com' },
        ],
        nextPageToken: undefined,
      },
    };

    const { users } = setupMocks({ listPages: [page] });

    const userService = require('../services/userService');
    const result = await userService.deleteAllUsers('example.com');

    expect(users.delete).toHaveBeenCalledTimes(2);
    const deletedKeys = users.delete.mock.calls.map((c) => c[0].userKey).sort();
    expect(deletedKeys).toEqual(['u1@example.com', 'u2@example.com']);

    expect(result).toMatchObject({ total: 2 });
    expect(result.deleted).toHaveLength(2);
    expect(result.errors).toHaveLength(0);
  });

  test('deleteUser rejette si email vide', async () => {
    setupMocks();
    const userService = require('../services/userService');
    await expect(userService.deleteUser('')).rejects.toThrow('`email` est requis.');
  });
});
