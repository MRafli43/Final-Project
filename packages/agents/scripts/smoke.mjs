import {
  createWorkflow,
  createAgentExecution,
  loadModelConfig,
  createCompletionModel,
  runContextSchema,
} from '../dist/index.js'
import { createInMemoryFixtures } from '../dist/fixtures.js'

if (process.env.KERJA_WOY_APPROVE_PAID_SMOKE !== 'yes') {
  console.error(
    'Not run. Paid calls require explicit approval: set KERJA_WOY_APPROVE_PAID_SMOKE=yes.',
  )
  process.exitCode = 1
} else {
  try {
    const config = loadModelConfig(process.env)
    const dependencies = createInMemoryFixtures({
      facts: [
        {
          id: 'fictional-fact-1',
          userId: 'fictional-user',
          confirmed: true,
          text: 'Built a TypeScript API for a fictional school project.',
          sourceReference: 'fictional-profile:1',
        },
      ],
    })
    const result = await createWorkflow(
      dependencies,
      createAgentExecution(() => createCompletionModel(config)),
    )(
      {
        mode: 'prepare_draft',
        posting: { id: 'fictional-posting', originalText: 'TypeScript API' },
      },
      runContextSchema.parse({ userId: 'fictional-user', requestId: 'local-smoke' }),
    )
    // Deliberately omit prompts, facts, output text, keys, and raw SDK errors.
    console.log(
      JSON.stringify(
        result.ok
          ? {
              ok: true,
              mode: result.mode,
              reviewStatus: result.verification?.reviewStatus,
              bullets: result.output.bullets?.length,
            }
          : result,
      ),
    )
    if (!result.ok) process.exitCode = 1
  } catch {
    console.error(
      'Smoke failed. Check server-only model configuration; no sensitive payload logged.',
    )
    process.exitCode = 1
  }
}
