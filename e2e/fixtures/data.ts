export const API_BASE = process.env['API_BASE'] ?? 'http://localhost:8000/api/v1';
export const MAILPIT_API = process.env['MAILPIT_API'] ?? 'http://localhost:8025';

export interface TestUser {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

export const makeTestUser = (suffix: string | number = Date.now()): TestUser => ({
  email: `test-jap-${suffix}@example.com`,
  password: 'test1234!',
  first_name: 'Test',
  last_name: 'JAP',
});

export const makeOtherUser = (suffix: string | number = Date.now()): TestUser => ({
  email: `other-jap-${suffix}@example.com`,
  password: 'other1234!',
  first_name: 'Other',
  last_name: 'JAP',
});

export interface PlayerData {
  last_name: string;
  first_name: string;
  license_number: string;
  phone?: string;
  ranking?: number;
}

export const PLAYER_ALICE: PlayerData = {
  last_name: 'Dupont',
  first_name: 'Alice',
  license_number: '1234567a',
  phone: '0600000001',
  ranking: 200,
};

export const PLAYER_BEATRICE: PlayerData = {
  last_name: 'Martin',
  first_name: 'Beatrice',
  license_number: '2345678b',
  phone: '0600000002',
  ranking: 150,
};
