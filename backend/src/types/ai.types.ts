// Type for ai realted things like ai.service.ts or /ai folder

// Type for response mode used in ai.service.ts file
export type responseMode = 'generate' | 'stream'

// Interface for openai comptaible endpoints
export type openaiInterface = 'chat' | 'responses' 

export type aiUseCase = 'review' | 'other'