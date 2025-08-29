const { describe, it } = require('node:test');
const assert = require('assert');
const { sm2 } = require('../src/sm2');

describe('SM-2 algorithm', () => {
  it('increments repetitions and computes interval for correct responses', () => {
    const result = sm2({ interval: 0, repetitions: 0, easiness: 2.5 }, 4);
    assert.deepStrictEqual(result, { interval: 1, repetitions: 1, easiness: 2.5 });
  });

  it('handles subsequent correct responses', () => {
    const step1 = sm2({ interval: 0, repetitions: 0, easiness: 2.5 }, 5);
    const step2 = sm2(step1, 5);
    assert.deepStrictEqual(step2, { interval: 6, repetitions: 2, easiness: 2.7 });
  });

  it('resets on poor responses', () => {
    const step1 = sm2({ interval: 6, repetitions: 2, easiness: 2.6 }, 2);
    assert.strictEqual(step1.interval, 1);
    assert.strictEqual(step1.repetitions, 0);
    assert.ok(Math.abs(step1.easiness - 2.28) < 1e-8);
  });

  it('clamps easiness to minimum value', () => {
    const result = sm2({ interval: 1, repetitions: 0, easiness: 1.3 }, 0);
    assert.strictEqual(result.easiness, 1.3);
  });
});
