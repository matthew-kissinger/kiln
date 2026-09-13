import assert from 'node:assert/strict';
import test from 'node:test';
import { DEFAULT_HOST, describeBind, resolveBindPolicy } from '../src/bind-policy.mjs';

// Pure, like every other test in this directory: no GPU, no listening socket, no
// native Dawn build. That is what keeps `npm ci --ignore-scripts` sufficient for
// CI, so the one module that decides whether this service is reachable from the
// network must not be the one that breaks it.

test('nothing configured binds loopback and needs no token', () => {
  assert.deepEqual(resolveBindPolicy({}), { host: DEFAULT_HOST, exposed: false });
  assert.deepEqual(resolveBindPolicy({ host: '', token: '' }), {
    host: DEFAULT_HOST,
    exposed: false,
  });
  // Whitespace is not a host. A stray newline from a shell heredoc used to be a
  // silently exposed bind under `||`.
  assert.deepEqual(resolveBindPolicy({ host: '   ' }), { host: DEFAULT_HOST, exposed: false });
});

test('every loopback spelling is local and free', () => {
  for (const host of ['127.0.0.1', 'localhost', 'LOCALHOST', '::1', '[::1]']) {
    assert.deepEqual(resolveBindPolicy({ host }), { host, exposed: false }, host);
  }
});

test('an unspecified bind is exposed, not local', () => {
  // The whole point of the module. `0.0.0.0` and `::` mean "every interface",
  // which includes the loopback one -- reading them as local is the mistake.
  for (const host of ['0.0.0.0', '::']) {
    assert.deepEqual(resolveBindPolicy({ host, token: 't' }), { host, exposed: true }, host);
  }
});

test('an exposed bind without a token refuses to boot', () => {
  for (const host of ['0.0.0.0', '::', '10.0.0.7', '192.168.1.20']) {
    assert.throws(() => resolveBindPolicy({ host }), /RENDER_SERVICE_TOKEN is unset/, host);
  }
});

test('the refusal names all three ways out', () => {
  try {
    resolveBindPolicy({ host: '0.0.0.0' });
    assert.fail('expected a throw');
  } catch (e) {
    // It is the only thing the operator sees before the process exits, so it has
    // to carry the whole instruction set rather than pointing at documentation.
    assert.match(e.message, /RENDER_SERVICE_TOKEN/);
    assert.match(e.message, /unset HOST/);
    assert.match(e.message, /RENDER_SERVICE_ALLOW_UNAUTHENTICATED=1/);
    assert.match(e.message, /0\.0\.0\.0/, 'names the offending host');
  }
});

test('a token permits an exposed bind', () => {
  assert.deepEqual(resolveBindPolicy({ host: '0.0.0.0', token: 'secret' }), {
    host: '0.0.0.0',
    exposed: true,
  });
});

test('the waiver permits an exposed bind with no token, and only when exact', () => {
  assert.deepEqual(resolveBindPolicy({ host: '0.0.0.0', allowUnauthenticated: '1' }), {
    host: '0.0.0.0',
    exposed: true,
  });
  // Anything other than "1" is not a waiver. `true`, `yes` and an empty string
  // are the values an operator reaches for by guessing, and a guess must not
  // silently open the service.
  for (const value of ['true', 'yes', '0', '', 'TRUE']) {
    assert.throws(
      () => resolveBindPolicy({ host: '0.0.0.0', allowUnauthenticated: value }),
      /RENDER_SERVICE_TOKEN is unset/,
      JSON.stringify(value),
    );
  }
});

test('the boot line states reach and auth together', () => {
  // Either half alone misleads: a host with no auth state hides whether anyone
  // can use it, and an auth state with no host hides whether anyone can reach it.
  assert.equal(
    describeBind(resolveBindPolicy({}), {}),
    '127.0.0.1 (this machine only, no auth needed (loopback only))',
  );
  assert.equal(
    describeBind(resolveBindPolicy({ host: '0.0.0.0', token: 't' }), { token: 't' }),
    '0.0.0.0 (reachable from the network, token required)',
  );
  assert.equal(
    describeBind(resolveBindPolicy({ host: '0.0.0.0', allowUnauthenticated: '1' }), {
      allowUnauthenticated: '1',
    }),
    '0.0.0.0 (reachable from the network, UNAUTHENTICATED by explicit waiver)',
  );
});
