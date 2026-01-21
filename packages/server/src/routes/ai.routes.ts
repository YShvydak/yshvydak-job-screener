import { Router } from 'express';
import { AIController } from '../controllers/ai.controller';

/**
 * Create AI routes
 */
export function createAIRoutes(controller: AIController): Router {
    const router = Router();

    // POST /api/ai/analyze/:jobId - Analyze a single job
    router.post('/analyze/:jobId', controller.analyzeJob);

    // POST /api/ai/analyze-batch - Analyze multiple jobs
    router.post('/analyze-batch', controller.analyzeBatch);

    // GET /api/ai/analysis/:jobId - Get existing analysis
    router.get('/analysis/:jobId', controller.getAnalysis);

    // GET /api/ai/stats - Get analysis statistics
    router.get('/stats', controller.getStats);

    return router;
}
