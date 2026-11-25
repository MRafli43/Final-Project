import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createWorkflow, createAgentExecution, runContextSchema } from '../dist/index.js'
import { createToolBudget } from '../dist/workflow.js'
import { SAFE_OUTREACH } from '../dist/instructions.js'
import { createInMemoryFixtures } from '../dist/fixtures.js'

const context = runContextSchema.parse({ userId: 'u1', requestId: 'r1' })

test('malformed output and fabricated outreach fail after one repair', async () => {
  for (const output of [
    'not structured JSON',
    {
      bullets: [],
      outreachDraft: 'Email invented@example.com; I am a senior engineer',
      gaps: ['Need facts'],
    },
  ]) {
    let calls = 0
    const result = await createWorkflow(
      deps(),
      mock(async () => {
        calls++
        return output
      }),
    )(input('prepare_draft'), context)
    assert.deepEqual(result, { ok: false, code: 'invalid_output' })
    assert.equal(calls, 2)
  }
})
const input = (mode = 'analyze') => ({ mode, posting: { id: 'p1', originalText: 'Build APIs' } })
const deps = () =>
  createInMemoryFixtures({
    facts: [
      { id: 'f1', userId: 'u1', confirmed: true, text: 'Build APIs', sourceReference: 'profile:1' },
    ],
  })
const analysis = (data) => ({
  recommendation: 'apply',
  matches: [
    { requirementId: JSON.parse(data).untrustedData.posting.requirements[0].id, factIds: ['f1'] },
  ],
  gaps: [],
  explanation: 'Evidence found',
})
const mock = (execute) => ({
  verifier: {
    review: async () => ({ supported: true, seniorityInflation: false, reasons: [] }),
    rewrite: async () => ({}),
  },
  extract: async () => ({ requirements: [{ text: 'Build APIs', importance: 'required' }] }),
  execute,
})

test('mandatory order and stable requirement IDs across runs', async () => {
  const order = []
  const repositories = deps()
  const find = repositories.applications.findByPosting
  repositories.applications.findByPosting = async (scope) => {
    order.push('duplicate')
    return find(scope)
  }
  const search = repositories.facts.search
  repositories.facts.search = async (scope) => {
    order.push('facts')
    return search(scope)
  }
  const ids = []
  const execution = mock(async ({ data }) => {
    order.push('agent')
    const output = analysis(data)
    ids.push(output.matches[0].requirementId)
    return output
  })
  execution.extract = async () => {
    order.push('parse')
    return { requirements: [{ text: 'Build APIs', importance: 'required' }] }
  }
  const run = createWorkflow(repositories, execution)
  assert.equal((await run(input(), context)).ok, true)
  assert.deepEqual(order, ['parse', 'duplicate', 'facts', 'agent'])
  assert.equal((await run(input(), context)).ok, true)
  assert.equal(ids[0], ids[1])
})

test('invalid input stops before extraction; fabricated extraction is rejected', async () => {
  let calls = 0
  const execution = mock(async () => {
    calls++
    return {}
  })
  execution.extract = async () => {
    calls++
    return { requirements: [{ text: 'Invented', importance: 'required' }] }
  }
  const run = createWorkflow(deps(), execution)
  assert.deepEqual(await run({}, context), { ok: false, code: 'invalid_input' })
  assert.equal(calls, 0)
  assert.deepEqual(await run(input(), context), { ok: false, code: 'invalid_posting' })
})

test('duplicate preparation stops before fact retrieval or drafting', async () => {
  const repositories = deps()
  repositories.applications.findByPosting = async () => [
    { id: 'a1', userId: 'u1', postingId: 'p1' },
  ]
  repositories.facts.search = async () => {
    assert.fail('must not retrieve')
  }
  const run = createWorkflow(
    repositories,
    mock(async () => {
      assert.fail('must not draft')
    }),
  )
  assert.deepEqual(await run(input('prepare_draft'), context), { ok: false, code: 'duplicate' })
})

test('grounded draft accepted, fabricated bullet dropped by verifier', async () => {
  const valid = {
    bullets: [{ text: 'Build APIs', supportingFactIds: ['f1'] }],
    outreachDraft: SAFE_OUTREACH,
    gaps: [],
  }
  assert.equal(
    (
      await createWorkflow(
        deps(),
        mock(async () => valid),
      )(input('prepare_draft'), context)
    ).ok,
    true,
  )
  let calls = 0
  const result = await createWorkflow(
    deps(),
    mock(async ({ repair }) => {
      assert.equal(repair, calls === 1)
      calls++
      return {
        ...valid,
        bullets: [{ text: 'Senior engineer with 10 years', supportingFactIds: ['f1'] }],
      }
    }),
  )(input('prepare_draft'), context)
  assert.equal(result.ok, true)
  assert.equal(result.output.bullets.length, 0)
  assert.equal(result.verification.report[0].status, 'dropped')
  assert.equal(calls, 1)
})

test('unknown evidence repaired once; requirement coverage required', async () => {
  let calls = 0
  const result = await createWorkflow(
    deps(),
    mock(async ({ data }) => {
      const output = analysis(data)
      if (calls++ === 0) output.matches[0].factIds = ['other-user-fact']
      return output
    }),
  )(input(), context)
  assert.equal(result.ok, true)
  assert.equal(calls, 2)
  const uncovered = await createWorkflow(
    deps(),
    mock(async () => ({ recommendation: 'apply', matches: [], gaps: [], explanation: 'none' })),
  )(input(), context)
  assert.deepEqual(uncovered, { ok: false, code: 'invalid_output' })
})

test('empty evidence supports clarification instead of fabricated bullet', async () => {
  const run = createWorkflow(
    createInMemoryFixtures(),
    mock(async () => ({
      bullets: [],
      outreachDraft: SAFE_OUTREACH,
      gaps: ['Please confirm relevant API experience.'],
    })),
  )
  assert.equal((await run(input('prepare_draft'), context)).ok, true)
})

test('six-execution budget blocks seventh call, independent of turns', async () => {
  let calls = 0
  const budget = createToolBudget(new AbortController().signal)
  const tool = budget.wrap({
    name: 'read',
    call: async () => {
      calls++
      return {}
    },
    definition: () => ({}),
  })
  await Promise.all(Array.from({ length: 6 }, () => tool.call({})))
  assert.throws(() => tool.call({}), /tool_limit/)
  assert.equal(calls, 6)
})

test('workflow budget includes mandatory reads and survives swallowed tool errors', async () => {
  let calls = 0
  const repositories = deps()
  repositories.profiles.getProfile = async () => {
    calls++
    return null
  }
  const result = await createWorkflow(
    repositories,
    mock(async ({ tools, data }) => {
      for (let i = 0; i < 6; i++) {
        try {
          await tools[0].call({})
        } catch {
          /* emulate SDK tool error conversion */
        }
      }
      return analysis(data)
    }),
  )(input(), context)
  assert.deepEqual(result, { ok: false, code: 'tool_limit' })
  assert.equal(calls, 4)
})

test('cancellation before run and while extraction is waiting', async () => {
  const controller = new AbortController()
  controller.abort()
  assert.deepEqual(
    await createWorkflow(
      deps(),
      mock(async () => ({})),
    )(input(), context, { abortSignal: controller.signal }),
    { ok: false, code: 'cancelled' },
  )
  const running = new AbortController()
  const execution = mock(async () => ({}))
  execution.extract = async (_text, signal) => {
    assert.equal(signal.aborted, false)
    running.abort()
    return new Promise(() => {})
  }
  assert.deepEqual(
    await createWorkflow(deps(), execution)(input(), context, { abortSignal: running.signal }),
    { ok: false, code: 'cancelled' },
  )
})

test('real SDK Agent and structured extraction work with a mocked completion model', async () => {
  const requests = []
  const model = {
    provider: 'mock',
    modelId: 'test',
    capabilities: {
      streaming: false,
      tools: true,
      toolChoice: true,
      imageInput: false,
      documentInput: false,
      outputSchema: true,
      reasoning: false,
    },
    async completion(request, options) {
      requests.push(request)
      assert.ok(options.abortSignal)
      const output =
        requests.length === 1
          ? { requirements: [{ text: 'Build APIs', importance: 'required' }] }
          : {
              recommendation: 'consider',
              matches: [],
              gaps: [
                {
                  requirementId: JSON.parse(request.chatHistory.at(-1).content).untrustedData
                    .posting.requirements[0].id,
                  explanation: 'Need confirmation',
                },
              ],
              explanation: 'Review evidence',
            }
      return {
        choice: [{ type: 'text', text: JSON.stringify(output) }],
        usage: { inputTokens: 1, outputTokens: 1 },
        finishReason: 'stop',
        rawResponse: {},
      }
    },
  }
  const result = await createWorkflow(
    deps(),
    createAgentExecution(() => model),
  )(input(), context)
  assert.equal(result.ok, true)
  assert.equal(requests.length, 2)
  assert.ok(requests[0].outputSchema)
  assert.ok(requests[1].outputSchema)
})
