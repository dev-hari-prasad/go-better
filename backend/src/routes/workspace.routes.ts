import express, { Router } from 'express'
import { API_RESPONSE_MESSAGES } from '../constants/apiResponse.ts'
import workspaceSettings from '../database/schema/workspace.ts'
import { db } from '../database/dbClient.ts'
import { eq } from 'drizzle-orm'

const router: express.Router = express.Router()

// Workspace settings tab mapping for the entier routes use
const workspaceSettingsTabMapping = {
    aiSettings: {
        id: workspaceSettings.id,
        quickModeModel: workspaceSettings.quickModeModel,
        focusedModeModel: workspaceSettings.focusedModeModel,
        deepModeModel: workspaceSettings.deepModeModel,
        systemPrompt: workspaceSettings.systemPrompt,
        quickModePrompt: workspaceSettings.quickModeModel,
        foucsedModePrompt: workspaceSettings.quickModeModel,
        deepModePrompt: workspaceSettings.quickModeModel
    }
}

// Get workspace settings per tab 
router.get('/:tab', async(req, res) => {
    const userId = req.userId!
    const requestedTab = req.params.tab

    try {
        const settings = await db
            .select(workspaceSettingsTabMapping.aiSettings)
            .from(workspaceSettings)
            .where(eq
                (workspaceSettings.userId, userId)
            )
        
        return res.status(200).json(settings)
    } catch(err) {
        return res.status(500).json({
            error: API_RESPONSE_MESSAGES[500]
        })
    }

})

// Create workspace settings
router.post('/:tab', async(req, res) => {
    const userId = req.userId!
    const requestedTab = req.params.tab

    const fields = workspaceSettingsTabMapping.aiSettings;

    const values = Object.fromEntries(
        Object.keys(fields).map(key => [
            key,
            req.body[key]
        ])
    );

    try {
        await db.insert(workspaceSettings)
            .values({
                ...values,
                userId
            })

        return res.status(201).json({
            message: API_RESPONSE_MESSAGES[201]
        })
    } catch(err) {
        return res.status(500).json({
            error: API_RESPONSE_MESSAGES[500]
        })
    }
})

// Update workspace settings
router.patch('/:tab', async(req, res) => {
    const userId = req.userId!
    const requestedTab = req.params.tab

    const fields = workspaceSettingsTabMapping.aiSettings;

    const values = Object.fromEntries(
        Object.keys(fields)
            .filter(key => req.body[key] !== undefined)
            .map(key => [
                key,
                req.body[key]
            ])
    );

    try {
        await db.update(workspaceSettings)
            .set({...values})
            .where(eq(workspaceSettings.userId, userId))

        return res.status(204).json({
            message: API_RESPONSE_MESSAGES[204]
        })
    } catch(err) {
        return res.status(500).json({
            error: API_RESPONSE_MESSAGES[500]
        })
    }
})

export default router