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

    return router;
}
