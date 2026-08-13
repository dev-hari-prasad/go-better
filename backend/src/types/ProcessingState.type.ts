// Machine fredinly states for processing pipeline
export type processingState =
    | "WEBHOOK_RECEIVED"
    | "PAYLOAD_SANITIZED"
    | "PR_CONTENT_EXTRACTED"
    | "REVIEW_NOTIFICATION_AWAITING"
    | "REVIEW_NOTIFICATION_SENT"
    | "PROCESSING_COMPLETED";

// State log strict JSON interface 
interface processingInformation {
    lastState: processingState | null,
    nextState: processingState | null,
    // Insert per stage information with timestamp
    finishedOn: Record<string, unknown>,
    // Insert per stage information with timestamp
    processedOn: Record<string, unknown>,
    error: ProcessingError | null,
}

// Processing error interface
interface ProcessingError {
    message: string;
    code?: string;
    stack?: string;
}