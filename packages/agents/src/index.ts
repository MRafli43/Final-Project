import {
  Agent,
  type AgentStream,
  type AgentPrompt,
  type AgentMemoryOptions,
  type MemoryScope,
  type Message,
} from '@anvia/core'
import type { StreamingCompletionModel } from '@anvia/core/completion'
import { OpenAIClient } from '@anvia/openai'
import { z } from 'zod'
import { createRecommendJobsTool, type JobDataAdapter } from './tools/recommend-jobs.js'
export {
  createRecommendJobsTool,
  createFictionalJobDataAdapter,
  type JobDataAdapter,
  type RecommendationJob,
} from './tools/recommend-jobs.js'

export type CompletionModel = StreamingCompletionModel<unknown>
const modelConfigSchema = z.strictObject({
  apiKey: z.string().trim().min(1),
  baseUrl: z.url({ protocol: /^https?$/ }).refine((value) => {
    const url = new URL(value)
    return !url.username && !url.password && !url.search && !url.hash
  }),
  modelId: z.string().trim().min(1),
})
export type ModelConfig = z.infer<typeof modelConfigSchema>

/** No environment access or client creation until called; errors omit secrets. */
export function loadModelConfig(
  env: Readonly<Record<string, string | undefined>> = process.env,
): ModelConfig {
  if ('window' in globalThis) throw new Error('Agent model configuration is server-only')
  const result = modelConfigSchema.safeParse({
    apiKey: env.MODEL_API_KEY,
    baseUrl: env.MODEL_BASE_URL ?? 'https://gateway.devscale.id/v1',
    modelId: env.MODEL_ID ?? 'deepseek-v4.1-flash',
  })
  if (!result.success)
    throw new Error('Invalid server-only model configuration; MODEL_API_KEY is required')
  return result.data
}

export function createCompletionModel(config?: ModelConfig): CompletionModel {
  const validated = config
    ? loadModelConfig({
        MODEL_API_KEY: config.apiKey,
        MODEL_BASE_URL: config.baseUrl,
        MODEL_ID: config.modelId,
      })
    : loadModelConfig()
  return new OpenAIClient({ apiKey: validated.apiKey, baseUrl: validated.baseUrl }).completionModel(
    { modelId: validated.modelId, api: 'chat' },
  )
}

type RunAgentInput =
  | { prompt: AgentPrompt; messages?: never; memory?: AgentMemoryOptions; session?: MemoryScope }
  | { messages: readonly Message[]; prompt?: never; memory?: never; session?: never }

export type RunAgentOptions = RunAgentInput & {
  /** Authenticated server context, never model-supplied identity. */
  context: { userId: string; requestId: string }
  abortSignal?: AbortSignal
  model?: CompletionModel
  modelConfig?: ModelConfig
  jobDataAdapter: JobDataAdapter
}

/** Unverified stream. Callers authorize session IDs and isolate injected memory stores. */
export function runAgent(options: RunAgentOptions): AgentStream {
  if ('window' in globalThis) throw new Error('Agent execution is server-only')
  const { userId } = z
    .strictObject({ userId: z.string().trim().min(1), requestId: z.string().trim().min(1) })
    .parse(options.context)
  if (options.prompt !== undefined && options.messages !== undefined)
    throw new Error('Provide prompt or messages, not both')
  if (options.prompt === undefined && options.messages === undefined)
    throw new Error('Provide prompt or messages')
  if (options.messages !== undefined && (options.memory || options.session))
    throw new Error('Memory/session require prompt input')
  if (options.memory && !options.session) throw new Error('Memory requires an authorized session')
  if (options.session?.userId && options.session.userId !== userId)
    throw new Error('Session scope violation')
  const signal = AbortSignal.any([
    AbortSignal.timeout(60_000),
    ...(options.abortSignal ? [options.abortSignal] : []),
  ])
  signal.throwIfAborted()
  let model: CompletionModel | undefined
  const getModel = () => (model ??= options.model ?? createCompletionModel(options.modelConfig))
  const agent = new Agent({
    id: 'kerja-woy',
    model: getModel(),
    tools: [
      createRecommendJobsTool({
        userId,
        jobs: options.jobDataAdapter,
        model: getModel,
        abortSignal: signal,
      }),
    ],
    memory: options.memory,
    maxTurns: 4,
    maxTokens: 4000,
    retries: false,
  })
  const settings = { abortSignal: signal, toolConcurrency: 1, maxTurns: 4, retries: false as const }
  return options.messages !== undefined
    ? agent.stream({ messages: options.messages, ...settings })
    : agent.stream({
        prompt: options.prompt!,
        session: options.session ? { ...options.session, userId } : undefined,
        ...settings,
      })
}
