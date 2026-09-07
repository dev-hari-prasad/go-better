import * as schema from '../database/schema/index.ts' 
import { db } from "../database/dbClient.ts";
import { eq } from 'drizzle-orm';
import { processingState } from '../types/ProcessingState.type.ts';
import { reivewStatus } from '../types/ProcessingState.type.ts'

async function updateWorkerState 
    (currentState: processingState, reviewID: string, reviewStatus: reivewStatus) {

        await 
            db
            .update(schema.review).set({
                state : currentState,
                status: reviewStatus,
            }).where(eq(schema.review.id, reviewID))
}

export default updateWorkerState;
