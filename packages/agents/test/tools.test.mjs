import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createReadOnlyTools, runContextSchema } from '../dist/index.js'
import { createInMemoryFixtures } from '../dist/fixtures.js'

const context = (userId = 'u1') => runContextSchema.parse({ userId, requestId: 'request1' })
const fact = (overrides = {}) => ({
  id: 'f1',
  userId: 'u1',
  confirmed: true,
  text: 'Built an API',
  sourceReference: 'profile:1',
  ...overrides,
})
const fixtures = () =>
  createInMemoryFixtures({
    profiles: [
      { userId: 'u1', summary: 'Developer' },
      { userId: 'u2', summary: 'Private' },
    ],
    facts: [fact(), fact({ id: 'f2', confirmed: false }), fact({ id: 'f3', userId: 'u2' })],
    applications: [
      { id: 'a1', userId: 'u1', postingId: 'p1' },
      { id: 'a2', userId: 'u2', postingId: 'p2' },
    ],
  })

test('confirmed facts only, with IDs, references and text; fixture isolates users', async () => {
  const tools = createReadOnlyTools(context(), fixtures())
  assert.deepEqual(await tools.search_facts.call({ query: 'API', limit: 5 }), {
    facts: [{ id: 'f1', sourceReference: 'profile:1', text: 'Built an API' }],
  })
  assert.deepEqual(await tools.get_profile.call({}), { profile: { summary: 'Developer' } })
})

test('empty matches and missing profile', async () => {
  const tools = createReadOnlyTools(context(), fixtures())
  assert.deepEqual(await tools.search_facts.call({ query: 'unmatched', limit: 5 }), { facts: [] })
  assert.deepEqual(await createReadOnlyTools(context('unknown'), fixtures()).get_profile.call({}), {
    profile: null,
  })
})

test('duplicate and non-duplicate are scoped to the bound user', async () => {
  const tools = createReadOnlyTools(context(), fixtures())
  assert.deepEqual(await tools.check_duplicate.call({ postingId: 'p1' }), {
    duplicate: true,
    applicationIds: ['a1'],
  })
  assert.deepEqual(await tools.check_duplicate.call({ postingId: 'p2' }), {
    duplicate: false,
    applicationIds: [],
  })
})

test('all repository queries carry the captured identity and constraints', async () => {
  const deps = fixtures()
  deps.facts.search = async (scope) => {
    assert.deepEqual(scope, { userId: 'u1', confirmed: true, query: 'API', limit: 2 })
    return [fact(), fact({ confirmed: false }), fact({ id: 'f3' }), fact({ id: 'f4' })]
  }
  deps.profiles.getProfile = async (scope) => {
    assert.deepEqual(scope, { userId: 'u1' })
    return null
  }
  deps.applications.findByPosting = async (scope) => {
    assert.deepEqual(scope, { userId: 'u1', postingId: 'p1' })
    return []
  }
  const trusted = context()
  const tools = createReadOnlyTools(trusted, deps)
  trusted.userId = 'u2'
  assert.equal((await tools.search_facts.call({ query: 'API', limit: 2 })).facts.length, 2)
  await tools.get_profile.call({})
  await tools.check_duplicate.call({ postingId: 'p1' })
})

test('fail closed on cross-user results, including unconfirmed results beyond the limit', async () => {
  const deps = fixtures()
  deps.facts.search = async () => [fact(), fact({ userId: 'u2', confirmed: false })]
  deps.profiles.getProfile = async () => ({ userId: 'u2', summary: 'private' })
  deps.applications.findByPosting = async () => [{ id: 'a2', userId: 'u2', postingId: 'p1' }]
  const tools = createReadOnlyTools(context(), deps)
  await assert.rejects(
    async () => tools.search_facts.call({ query: 'API', limit: 1 }),
    /scope violation/,
  )
  await assert.rejects(async () => tools.get_profile.call({}), /scope violation/)
  await assert.rejects(
    async () => tools.check_duplicate.call({ postingId: 'p1' }),
    /scope violation/,
  )
})

test('wrong posting results fail closed', async () => {
  const deps = fixtures()
  deps.applications.findByPosting = async () => [{ id: 'a1', userId: 'u1', postingId: 'other' }]
  await assert.rejects(
    async () => createReadOnlyTools(context(), deps).check_duplicate.call({ postingId: 'p1' }),
    /scope violation/,
  )
})

test('invalid inputs reject before any repository call, including userId injection', async () => {
  let calls = 0
  const fail = async () => {
    calls++
    throw new Error('should not query')
  }
  const tools = createReadOnlyTools(context(), {
    profiles: { getProfile: fail },
    facts: { search: fail },
    applications: { findByPosting: fail },
  })
  for (const args of [
    { query: '' },
    { query: ' '.repeat(5) },
    { query: 'x'.repeat(501) },
    { query: 'API', limit: 0 },
    { query: 'API', limit: 21 },
    { query: 'API', limit: 1.5 },
    { query: 'API', userId: 'u2' },
  ])
    await assert.rejects(async () => tools.search_facts.call(args))
  for (const args of [{ postingId: '' }, { postingId: 'p1', userId: 'u2' }, {}]) {
    await assert.rejects(async () => tools.check_duplicate.call(args))
  }
  await assert.rejects(async () => tools.get_profile.call({ userId: 'u2' }))
  assert.equal(calls, 0)
})

test('SDK parseInput validates model JSON and applies search default', () => {
  const tool = createReadOnlyTools(context(), fixtures()).search_facts
  assert.deepEqual(tool.parseInput({ query: 'API' }), { query: 'API', limit: 5 })
  assert.throws(() => tool.parseInput({ query: 'API', userId: 'u2' }))
})
