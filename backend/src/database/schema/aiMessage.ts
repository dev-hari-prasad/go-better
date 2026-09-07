import { pgTable, integer, varchar, uuid, timestamp, jsonb, numeric, text, boolean, pgEnum, bigint } from 'drizzle-orm/pg-core'
import aiConversation from './aiConversations.ts'

//Enums
export const thumbsFeedback = pgEnum('thumbsFeedback', 
    [
        'postive',
        'negitive'
    ]
)

// Stores messages, usage, and cost data for an AI conversation.
const aiMessages = pgTable("ai_messages", {
    
    id: uuid('id').defaultRandom().primaryKey(),
    conversationId: uuid('conversation_id').references(() => aiConversation.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade'
    }),

    // Message
    inputMessage: text('input_message').notNull(),
    outputMessage: text('output_message'),
    usedToolCalls: text('used_tool_calls').array(),
    messageCount: bigint('message_count', { mode: 'number'} )
        .generatedAlwaysAsIdentity(),
    
    //Prefrences
    llmModel: varchar('llm_model').notNull(),
    
    //Feedback
    regenerated: boolean('regenerated').default(false).notNull(),
    thumbsFeedback: thumbsFeedback(),

    // Cost and usage data
    //Input Tokens:
    inputTokens: integer('input_tokens'),
    noCacheInputTokens: integer('no_cache_input_tokens'),
    cacheInputReadTokens: integer('cache_input_read_tokens'),
    cacheInputWriteTokens: integer('cache_input_write_tokens'),

    // Output tokens
    outputToken: integer('output_tokens'),
    outputTextTokens: integer('output_text_token'),
    outputReasoningTokens: integer('output_reasoning_tokens'),  

    // Note: The AI SDK does not compute financial cost out-of-the-box. Calculating token costs
    // requires maintaining an up-to-date model pricing registry and computing price deltas per request.
    // Deferred to v2 roadmap to maintain development velocity.
    // inputTokenCost: numeric('input_token_cost'),
    // outputTokenCost: numeric('output_token_cost'),
    // totalCost: numeric('total_cost'),
    // currency: varchar('currency', {length: 16}),

    // Extra data if reuqired
    metaData: jsonb('metadata'),

    // For maintaning chat timeline in UI
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('udpated_at').notNull().defaultNow()
})

export default aiMessages
