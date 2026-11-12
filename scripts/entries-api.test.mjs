import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fetchEntryCounts, fetchEntriesForNode } from '../src/lib/entries-api.js'

test('counts use the same-origin endpoint and preserve the server count', async t => {
  const signal = new AbortController().signal
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, '/api/entries/counts')
    assert.equal(options.signal, signal)
    return new Response(JSON.stringify({ data: [{ node_id: 'aeons', count: 3 }], error: null }))
  })
  assert.deepEqual(await fetchEntryCounts(signal), [{ node_id: 'aeons', count: 3 }])
})

test('node identifiers cannot change the endpoint path', async t => {
  t.mock.method(globalThis, 'fetch', async url => {
    assert.equal(url, '/api/entries/node/terms%2F%3Fother%3D1')
    return new Response(JSON.stringify({ data: [], error: null }))
  })
  assert.deepEqual(await fetchEntriesForNode('terms/?other=1'), [])
})

test('HTTP errors, API errors, and HTML or invalid payloads are rejected', async t => {
  for (const response of [
    new Response('', { status: 503 }),
    new Response(JSON.stringify({ data: [], error: { message: 'Unavailable' } })),
    new Response(JSON.stringify({ data: {} })),
    new Response('<html>SPA fallback</html>'),
  ]) {
    t.mock.method(globalThis, 'fetch', async () => response)
    await assert.rejects(fetchEntryCounts())
    t.mock.restoreAll()
  }
})

test('cancellation reaches fetch without falling back to a retired service', async t => {
  const controller = new AbortController()
  controller.abort()
  t.mock.method(globalThis, 'fetch', async (url, { signal }) => {
    assert.equal(url, '/api/entries/node/aeons')
    signal.throwIfAborted()
  })
  await assert.rejects(fetchEntriesForNode('aeons', controller.signal), { name: 'AbortError' })
})
