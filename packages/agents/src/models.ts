import type { StreamingCompletionModel } from '@anvia/core/completion'
import { OpenAIClient } from '@anvia/openai'
import { loadModelConfig, validateModelConfig, type ModelConfig } from './config.js'

export type CompletionModel = StreamingCompletionModel<unknown>

/** No client, environment validation, or network request occurs at import time. */
export function createCompletionModel(config?: ModelConfig): CompletionModel {
  const validated = config ? validateModelConfig(config) : loadModelConfig()
  const client = new OpenAIClient({ apiKey: validated.apiKey, baseUrl: validated.baseUrl })
  return client.completionModel({ modelId: validated.modelId, api: 'chat' })
}
