import { Router } from 'express';
import { SettingsController } from '../controllers/settings.controller';

/**
 * Create settings routes
 */
export function createSettingsRoutes(controller: SettingsController): Router {
    const router = Router();

    // GET /api/settings - Get all settings
    router.get('/', controller.getAll);

    // GET /api/settings/cv - Get CV content
    router.get('/cv', controller.getCV);

    // POST /api/settings/cv - Set CV content
    router.post('/cv', controller.setCV);

    // DELETE /api/settings/cv - Delete CV content
    router.delete('/cv', controller.deleteCV);

    // GET /api/settings/ai-method - Get AI analysis method
    router.get('/ai-method', controller.getAIMethod);

    // PUT /api/settings/ai-method - Set AI analysis method
    router.put('/ai-method', controller.setAIMethod);

    // GET /api/settings/api-status - Get API keys status
    router.get('/api-status', controller.getAPIStatus);

    return router;
}
