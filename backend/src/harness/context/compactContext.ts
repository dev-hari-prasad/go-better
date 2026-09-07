import { aiGeneratetext } from "../../service/ai.service.ts";

// Funtion that comapcts the context when it's reaching the context window
async function compactContext(userId: string, context:string) {
    const result = await aiGeneratetext(userId, context, "Summarize the context concisely while preserving all essential code and PR details.");

    return result;
}

export default compactContext;