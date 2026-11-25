import { z } from 'zod'

const nonEmpty = z.string().trim().min(1)
const modelConfigSchema = z.strictObject({
  apiKey: nonEmpty,
  baseUrl: z.url({ protocol: /^https?$/ }).refine((value) => {
    const url = new URL(value)
    return !url.username && !url.password && !url.search && !url.hash
  }),
  modelId: nonEmpty,
})

export type ModelConfig = z.infer<typeof modelConfigSchema>

export function assertServerOnly(): void {
  if ('window' in globalThis) throw new Error('Agent model configuration is server-only')
}

/** Validate on demand. Never include environment values in configuration errors. */
export function loadModelConfig(
  env: Readonly<Record<string, string | undefined>> = process.env,
): ModelConfig {
  assertServerOnly()
  const result = modelConfigSchema.safeParse({
    apiKey: env.MODEL_API_KEY,
    baseUrl: env.MODEL_BASE_URL,
    modelId: env.MODEL_ID,
  })
  if (!result.success) {
    throw new Error('Set valid server-only MODEL_API_KEY, MODEL_BASE_URL, and MODEL_ID variables')
  }
  return result.data
}

export function validateModelConfig(config: ModelConfig): ModelConfig {
  return loadModelConfig({
    MODEL_API_KEY: config.apiKey,
    MODEL_BASE_URL: config.baseUrl,
    MODEL_ID: config.modelId,
  })
}
