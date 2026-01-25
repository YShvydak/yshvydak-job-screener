import {Database} from 'better-sqlite3'
import {v4 as uuidv4} from 'uuid'
import {AIAnalysis} from '@yshvydak-job-screener/shared'

/**
 * Input for creating an AI analysis
 */
export interface AIAnalysisInput {
    job_id: string
    match_score: number
    recommendation: 'APPLY' | 'MAYBE' | 'SKIP'
    strengths: string[]
    gaps: string[]
    reasoning: string
}

/**
 * Repository for ai_analyses table operations
 */
export class AnalysisRepository {
    constructor(private db: Database) {}

    /**
     * Find analysis by job ID
     */
    findByJobId(jobId: string): AIAnalysis | null {
        const stmt = this.db.prepare('SELECT * FROM ai_analyses WHERE job_id = ?')
        return (stmt.get(jobId) as AIAnalysis) || null
    }

    /**
     * Create a new AI analysis
     * Note: One analysis per job (UNIQUE constraint)
     */
    create(input: AIAnalysisInput): AIAnalysis {
        const id = uuidv4()
        const now = new Date().toISOString()

        const stmt = this.db.prepare(`
            INSERT INTO ai_analyses (
                id, job_id, match_score, recommendation, strengths, gaps, reasoning, analyzed_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `)

        stmt.run(
            id,
            input.job_id,
            input.match_score,
            input.recommendation,
            JSON.stringify(input.strengths),
            JSON.stringify(input.gaps),
            input.reasoning,
            now
        )

        return this.findByJobId(input.job_id)!
    }

    /**
     * Check if job has been analyzed
     */
    hasAnalysis(jobId: string): boolean {
        return this.findByJobId(jobId) !== null
    }

    /**
     * Delete analysis by job ID
     */
    deleteByJobId(jobId: string): boolean {
        const stmt = this.db.prepare('DELETE FROM ai_analyses WHERE job_id = ?')
        const result = stmt.run(jobId)
        return result.changes > 0
    }

    /**
     * Get analysis statistics
     */
    getStats(): {total: number; avgScore: number; byRecommendation: Record<string, number>} {
        const countStmt = this.db.prepare('SELECT COUNT(*) as total FROM ai_analyses')
        const avgStmt = this.db.prepare('SELECT AVG(match_score) as avg FROM ai_analyses')
        const byRecStmt = this.db.prepare(`
            SELECT recommendation, COUNT(*) as count
            FROM ai_analyses
            GROUP BY recommendation
        `)

        const total = (countStmt.get() as {total: number}).total
        const avgResult = avgStmt.get() as {avg: number | null}
        const byRec = byRecStmt.all() as {recommendation: string; count: number}[]

        const byRecommendation: Record<string, number> = {
            APPLY: 0,
            MAYBE: 0,
            SKIP: 0,
        }
        byRec.forEach((row) => {
            byRecommendation[row.recommendation] = row.count
        })

        return {
            total,
            avgScore: avgResult.avg || 0,
            byRecommendation,
        }
    }
}
