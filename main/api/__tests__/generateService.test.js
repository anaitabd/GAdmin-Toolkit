const { EventEmitter } = require('events');

jest.mock('csv-writer', () => {
  return {
    createObjectCsvWriter: jest.fn(),
  };
});

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

describe('generateService.generateUsersFromNames', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test('génère des users et écrit user_list.csv', async () => {
    const fs = require('fs');
    const { createObjectCsvWriter } = require('csv-writer');

    const writeRecords = jest.fn().mockResolvedValue(undefined);
    createObjectCsvWriter.mockReturnValue({ writeRecords });

    jest.spyOn(fs, 'createReadStream').mockImplementation(() =>
      createReadStreamMock([
        { givenName: 'GivenName', familyName: 'Surname' },
        { givenName: 'Alice', familyName: 'Smith' },
        { givenName: 'Bob', familyName: 'Jones' },
      ])
    );

    const randomSeq = [0.1, 0.9, 0.2, 0.8];
    let i = 0;
    jest.spyOn(Math, 'random').mockImplementation(() => randomSeq[i++ % randomSeq.length]);

    const { generateUsersFromNames } = require('../services/generateService');

    const users = await generateUsersFromNames('example.com', 2);

    expect(Array.isArray(users)).toBe(true);
    expect(users).toHaveLength(2);

    for (const u of users) {
      expect(u).toHaveProperty('email');
      expect(u.email.endsWith('@example.com')).toBe(true);
      expect(u).toHaveProperty('password', 'Password123@');
      expect(u).toHaveProperty('givenName');
      expect(u).toHaveProperty('familyName');
    }

    expect(createObjectCsvWriter).toHaveBeenCalledTimes(1);
    expect(writeRecords).toHaveBeenCalledTimes(1);
    expect(writeRecords).toHaveBeenCalledWith(users);
  });

  test('rejette si domain invalide', async () => {
    const { generateUsersFromNames } = require('../services/generateService');
    await expect(generateUsersFromNames('', 1)).rejects.toThrow('`domain` est requis.');
  });

  test('rejette si numRecords invalide', async () => {
    const { generateUsersFromNames } = require('../services/generateService');
    await expect(generateUsersFromNames('example.com', 0)).rejects.toThrow(
      '`numRecords` doit être un entier positif.'
    );
  });

  test('rejette si names.csv ne contient aucun nom valide', async () => {
    const fs = require('fs');
    jest.spyOn(fs, 'createReadStream').mockImplementation(() => createReadStreamMock([]));

    const { generateUsersFromNames } = require('../services/generateService');
    await expect(generateUsersFromNames('example.com', 1)).rejects.toThrow(
      'Aucun nom valide trouvé'
    );
  });
});
