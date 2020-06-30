
const assert = require('assert');

exports.string = function(v) { assert.strictEqual(typeof v, 'string'); }
exports.strings = function(args) {
  for (const a in args) {
    assert.strictEqual(typeof args[a], 'string', a);
  }
}

exports.integer = function(v) {
  assert.strictEqual(typeof v, 'number');
  assert.strictEqual(v, Math.round(v));
}
exports.integers = function(args) {
  for (const a in args) {
    assert.strictEqual(typeof args[a], 'number', a);
    assert.strictEqual(args[a], Math.round(args[a]), a);
  }
}

exports.number = function(v) {
  assert.strictEqual(typeof v, 'number');
}
exports.numbers = function(args) {
  for (const a in args) {
    assert.strictEqual(typeof args[a], 'number', a);
  }
}

exports.any = function(v) {
  assert.ok(v !== undefined);
  assert.ok(v !== null);
}

exports.object = function(v) {
  assert.strictEqual(typeof v, 'object');
}
exports.objects = function(args) {
  for (const a in args) {
    assert.strictEqual(typeof args[a], 'object', a);
  }
}

exports.func = function(v) {
  assert.strictEqual(typeof v, 'function');
}
exports.funcs = function(args) {
  for (const a in args) {
    assert.strictEqual(typeof args[a], 'function', a);
  }
}
