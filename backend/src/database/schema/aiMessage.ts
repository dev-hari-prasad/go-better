import { pgTable, integer, varchar, uuid, timestamp, jsonb, numeric, text, boolean, pgEnum } from 'drizzle-orm/pg-core'
import aiConversation from './aiConversations.ts'

//Enums
export const thumbsFeedback = pgEnum('thumbsFeedback', 
    [
        'postive',
        'negitive'
    ]
)

// Stores messages, usage, and cost data for an AI conversation.
const aiMessages = pgTable("aiMessages", {
    
    id: uuid('id').defaultRandom().primaryKey(),
    conversationId: uuid('conversation_id').references(() => aiConversation.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade'
    }),

    // Message
    inputMessage: text('input_message').notNull(),
    OutputMessage: text('output_message'),
    usedToolCalls: text('used_tool_calls').array(),
    
    //Prefrences
    llmModel: varchar('llm_model').notNull(),
    
    //Feedback
    regenerated: boolean('regenerated').default(false).notNull(),
    thumbsFeedback: thumbsFeedback(),
      

    // Cost and usage data
    inputTokens: integer('input_tokens'),
    outputToken: integer('output_tokens'),
    totalTokens: numeric('total_tokens'),
    inputTokenCost: numeric('input_token_cost'),
    outputTokenCost: numeric('output_token_cost'),
    totalCost: numeric('total_cost'),
    // For cost data
    curreny: varchar('curreny', {length: 16}),

    // Extra data if reuqired
    metaData: jsonb('metadata'),

    // For maintaning chat timeline in UI
    createdAt: timestamp('created_at').notNull().defaultNow(),
})

export default aiMessages
