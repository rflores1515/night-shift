// AI Configuration - Choose your provider here

import { ParserProvider } from './parser'

// Change this to 'openai' or 'anthropic'
export const DEFAULT_AI_PROVIDER: ParserProvider = 'openai'

// You can also set via environment variable
export const AI_PROVIDER: ParserProvider =
  (process.env.AI_PROVIDER as ParserProvider) || DEFAULT_AI_PROVIDER
