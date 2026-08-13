
import { processingState } from "../types/ProcessingState.type.ts";

function getNextState(currentState: processingState): processingState {
    const transitions: any = {
        WEBHOOK_RECEIVED: "PAYLOAD_SANITIZED",
        PAYLOAD_SANITIZED: "PR_CONTENT_EXTRACTED",
        PR_CONTENT_EXTRACTED: "REVIEW_NOTIFICATION_SENT",
        REVIEW_NOTIFICATION_SENT: "PROCESSING_COMPLETED"
    };

    return transitions[currentState];
}