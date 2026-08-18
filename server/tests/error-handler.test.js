import assert from 'node:assert/strict';
import { test } from 'node:test';
import { errorHandler } from '../src/middleware/error.js';

test('unexpected server errors do not expose technical details as the public message', () => {
  const error = new Error('Invalid prisma.news.findMany() invocation: database password is secret');
  const response = {
    statusCode: null,
    payload: null,
    status(value) { this.statusCode = value; return this; },
    json(value) { this.payload = value; return this; },
  };
  const originalConsoleError = console.error;
  console.error = () => {};
  try {
    errorHandler(error, { id: 'release-test-request' }, response, () => {});
  } finally {
    console.error = originalConsoleError;
  }
  assert.equal(response.statusCode, 500);
  assert.equal(response.payload.error.message, 'Внутренняя ошибка сервера');
  assert.equal(response.payload.error.requestId, 'release-test-request');
  assert.doesNotMatch(response.payload.error.message, /prisma|password/i);
});
