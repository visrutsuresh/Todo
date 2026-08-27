import { test } from 'node:test';
import assert from 'node:assert/strict';
import { coerceValue, coercePatch, compareValues, isPropType } from './props.ts';

// Node 24 strips TypeScript types natively, so the real source is imported
// directly. No build step, no transpile, no duplicated logic in the test.

const P = (type, options = null) => ({ name: 'X', type, options });

test('text accepts strings, rejects numbers', () => {
  assert.equal(coerceValue(P('text'), 'hello').ok, true);
  assert.equal(coerceValue(P('text'), 42).ok, false);
});

test('number accepts numeric strings from form inputs', () => {
  assert.deepEqual(coerceValue(P('number'), '42'), { ok: true, value: 42 });
  assert.deepEqual(coerceValue(P('number'), 7), { ok: true, value: 7 });
});

test('number rejects non-numeric text', () => {
  assert.equal(coerceValue(P('number'), 'abc').ok, false);
  assert.equal(coerceValue(P('number'), 'NaN').ok, false);
});

test('a cleared number field is unset, not zero', () => {
  // Number('') is 0. Without the explicit empty check, clearing a field would
  // silently write a zero, which reads as a real value.
  assert.deepEqual(coerceValue(P('number'), ''), { ok: true, value: null });
});

test('select only accepts declared options', () => {
  const prop = P('select', ['Low', 'High']);
  assert.deepEqual(coerceValue(prop, 'High'), { ok: true, value: 'High' });
  assert.equal(coerceValue(prop, 'Urgent').ok, false);
});

test('date accepts YYYY-MM-DD only', () => {
  assert.deepEqual(coerceValue(P('date'), '2026-08-26'), { ok: true, value: '2026-08-26' });
  assert.equal(coerceValue(P('date'), '26/08/2026').ok, false);
  assert.equal(coerceValue(P('date'), '2026-08-26T00:00:00Z').ok, false);
});

test('date rejects impossible calendar days', () => {
  // new Date('2026-02-31') rolls over to March rather than throwing, so the
  // round-trip check is what actually catches this.
  assert.equal(coerceValue(P('date'), '2026-02-31').ok, false);
  assert.equal(coerceValue(P('date'), '2026-13-01').ok, false);
});

test('checkbox accepts booleans and their string forms', () => {
  assert.deepEqual(coerceValue(P('checkbox'), true), { ok: true, value: true });
  assert.deepEqual(coerceValue(P('checkbox'), 'false'), { ok: true, value: false });
  assert.equal(coerceValue(P('checkbox'), 'yes').ok, false);
});

test('null is unset for every type', () => {
  for (const t of ['text', 'number', 'select', 'date', 'checkbox']) {
    assert.deepEqual(coerceValue(P(t, ['a']), null), { ok: true, value: null });
  }
});

test('a patch naming an unknown property is rejected, not silently dropped', () => {
  const props = [{ id: 'p1', name: 'Priority', type: 'select', options: ['Low'] }];
  const r = coercePatch(props, { p1: 'Low', ghost: 'x' });
  assert.equal(r.ok, false);
  assert.match(r.error, /Unknown property/);
});

test('a valid patch passes through coerced', () => {
  const props = [
    { id: 'p1', name: 'Est', type: 'number', options: null },
    { id: 'p2', name: 'Due', type: 'date', options: null },
  ];
  assert.deepEqual(coercePatch(props, { p1: '3', p2: '2026-01-01' }), {
    ok: true,
    value: { p1: 3, p2: '2026-01-01' },
  });
});

test('unset values sort last regardless of type', () => {
  assert.equal(compareValues('number', null, 5) > 0, true);
  assert.equal(compareValues('number', 5, null) < 0, true);
  assert.equal(compareValues('text', null, null), 0);
});

test('numbers sort numerically, not as strings', () => {
  // String sorting would put 10 before 9.
  assert.equal(compareValues('number', 9, 10) < 0, true);
});

test('dates sort chronologically as ISO strings', () => {
  assert.equal(compareValues('date', '2026-01-02', '2026-01-10') < 0, true);
});

test('isPropType gates the five supported types', () => {
  assert.equal(isPropType('select'), true);
  assert.equal(isPropType('multiselect'), false);
});
