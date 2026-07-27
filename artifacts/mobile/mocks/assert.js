'use strict';

function assert(value, message) {
  if (!value) {
    const err = new Error(typeof message === 'string' ? message : 'Assertion failed');
    err.name = 'AssertionError';
    throw err;
  }
}

assert.ok = assert;

assert.fail = function (msg) {
  throw new Error(msg || 'Assertion failed');
};

assert.equal = function (a, b, msg) {
  if (a != b) throw new Error(msg || `${String(a)} != ${String(b)}`);
};

assert.strictEqual = function (a, b, msg) {
  if (a !== b) throw new Error(msg || `${String(a)} !== ${String(b)}`);
};

assert.notEqual = function (a, b, msg) {
  if (a == b) throw new Error(msg || `${String(a)} == ${String(b)}`);
};

assert.notStrictEqual = function (a, b, msg) {
  if (a === b) throw new Error(msg || `${String(a)} === ${String(b)}`);
};

assert.deepEqual = function (a, b, msg) {
  if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(msg || 'Deep equality failed');
};

assert.deepStrictEqual = assert.deepEqual;
assert.notDeepEqual = function (a, b, msg) {
  if (JSON.stringify(a) === JSON.stringify(b)) throw new Error(msg || 'Expected deep inequality');
};

assert.throws = function (fn, _errOrMsg, _msg) {
  try { fn(); } catch (_e) { return; }
  throw new Error('Expected function to throw');
};

assert.doesNotThrow = function (fn, _errOrMsg, msg) {
  try { fn(); } catch (e) {
    throw new Error(msg || `Got unwanted exception: ${e.message}`);
  }
};

assert.ifError = function (err) {
  if (err != null) throw err;
};

assert.rejects = async function (asyncFn) {
  try { await asyncFn(); } catch (_e) { return; }
  throw new Error('Expected promise to reject');
};

assert.doesNotReject = async function (asyncFn) {
  await asyncFn();
};

module.exports = assert;
