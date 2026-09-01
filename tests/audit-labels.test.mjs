import assert from 'node:assert/strict';
import { test } from 'node:test';
import { auditActionLabel, auditActionOptions, auditEntityLabel, auditSourceLabel } from '../client/src/utils/audit.js';

test('audit action and object codes have understandable Russian labels', () => {
  assert.equal(auditActionLabel('CREATE_NEWS'), 'Добавление новости');
  assert.equal(auditActionLabel('DELETE_SERVICE_PACKAGE'), 'Удаление пакета обслуживания');
  assert.equal(auditEntityLabel('ServicePackage'), 'Пакет обслуживания');
  assert.equal(auditSourceLabel('127.0.0.1'), 'Этот компьютер');
  for (const action of auditActionOptions) {
    assert.doesNotMatch(auditActionLabel(action), /^[A-Z_]+$/);
  }
});
