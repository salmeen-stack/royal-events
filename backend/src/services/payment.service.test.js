import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSnippePaymentPayload, normalizeSnippeAmount } from './payment.service.js';

test('normalizeSnippeAmount converts a decimal TZS amount to an integer', () => {
  assert.equal(normalizeSnippeAmount('2500.50'), 2501);
  assert.equal(normalizeSnippeAmount(500), 500);
});

test('buildSnippePaymentPayload returns a Snippe payment request body', () => {
  const payload = buildSnippePaymentPayload({
    amount: 2500,
    transactionRef: 'TXN-123',
    guestName: 'Jane Doe',
    guestPhone: '+255712345678',
    guestEmail: 'jane@example.com',
    eventName: 'Wedding',
    webhookUrl: 'https://example.com/webhooks/snippe',
  });

  assert.equal(payload.payment_type, 'mobile');
  assert.deepEqual(payload.details, { amount: 2500, currency: 'TZS' });
  assert.equal(payload.phone_number, '255712345678');
  assert.equal(payload.customer.firstname, 'Jane');
  assert.equal(payload.customer.lastname, 'Doe');
  assert.equal(payload.customer.email, 'jane@example.com');
  assert.equal(payload.metadata.order_id, 'TXN-123');
  assert.equal(payload.webhook_url, 'https://example.com/webhooks/snippe');
});
