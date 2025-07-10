import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';

export const llmRequests = sqliteTable('llm_requests', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  timestamp: integer('timestamp', { mode: 'timestamp_ms' }).$defaultFn(() => new Date()),
  provider: text('provider', { enum: ['openai', 'gemini', 'azure', 'grok'] }).notNull(),
  model: text('model').notNull(),
  toolName: text('tool_name'), // MCP tool that triggered this request
  inputTokens: integer('input_tokens'),
  outputTokens: integer('output_tokens'),
  totalTokens: integer('total_tokens'),
  estimatedCost: real('estimated_cost'), // Cost in USD
  durationMs: integer('duration_ms'),
  status: text('status', { enum: ['success', 'error'] }).notNull(),
  errorMessage: text('error_message'),
  requestData: text('request_data', { mode: 'json' }), // Store prompt, params
  responseData: text('response_data', { mode: 'json' }), // Store response content
  finishReason: text('finish_reason'), // stop, length, content-filter, etc.
}, (table) => ({
  timestampIdx: index('llm_requests_timestamp_idx').on(table.timestamp),
  providerIdx: index('llm_requests_provider_idx').on(table.provider),
  statusIdx: index('llm_requests_status_idx').on(table.status),
}));

export type LlmRequest = typeof llmRequests.$inferInsert;
export type LlmRequestSelect = typeof llmRequests.$inferSelect;