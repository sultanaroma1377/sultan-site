import { expect, test } from 'bun:test';
import { createDispatchScanner } from './dispatch-scanner';

test('scanner dispatches automatically without clicking a button', async () => {
  const seen: string[] = [];
  const scanner = createDispatchScanner(async number => { seen.push(number); }, () => {}, 10);
  scanner.feed('Order: WS123456\nCustomer: Buyer\nItems: Oud');
  await new Promise(resolve => setTimeout(resolve, 40));
  expect(seen).toEqual(['WS123456']);
  scanner.dispose();
});
test('new scans queue while the previous dispatch is saving', async () => {
  const seen: string[] = [];
  const scanner = createDispatchScanner(async number => { await new Promise(resolve => setTimeout(resolve, 10)); seen.push(number); }, () => {});
  scanner.feed('WS123456'); const first = scanner.flush();
  scanner.feed('WS654321'); await scanner.flush(); await first;
  expect(seen).toEqual(['WS123456', 'WS654321']);
  scanner.dispose();
});
test('several printed QR payloads dispatch in order and errors do not stop the queue', async () => {
  const seen: string[] = []; let errors = 0;
  const scanner = createDispatchScanner(async number => { if (number === 'WS123456') throw new Error('not accepted'); seen.push(number); }, () => { errors++; });
  scanner.feed('Order: WS123456\nCustomer: One\nOrder: WS654321\nCustomer: Two');
  await scanner.flush();
  expect(errors).toBe(1); expect(seen).toEqual(['WS654321']);
  scanner.dispose();
});