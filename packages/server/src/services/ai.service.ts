import {GoogleGenAI} from '@google/genai'
import {exec} from 'child_process'
import {promisify} from 'util'
import {Job, AIAnalysis, AIAnalysisParsed, AIAnalysisMethod} from '@yshvydak-job-screener/shared'
import {AnalysisRepository, AIAnalysisInput} from '../repositories/analysis.repository'
import {JobRepository} from '../repositories/job.repository'
import {SettingsRepository} from '../repositories/settings.repository'
import {Logger} from '../utils/Logger'
import {env} from '../config/environment.config'

const execAsync = promisify(exec)

/**
 * Gemini AI response structure for job analysis
 */
interface GeminiAnalysisResponse {
    match_score: number
    recommendation: 'APPLY' | 'MAYBE' | 'SKIP'
    strengths: string[]
    gaps: string[]
    reasoning: string
}

/**
 * Service for AI-powered job analysis using Google Gemini
 */
export class AIService {
    private ai: GoogleGenAI | null = null
    private cliAvailable: boolean | null = null

    constructor(
        private analysisRepository: AnalysisRepository,
        private jobRepository: JobRepository,
        private settingsRepository: SettingsRepository
    ) {
        // Initialize Gemini client if API key is available
        if (env.GEMINI_API_KEY) {
            this.ai = new GoogleGenAI({apiKey: env.GEMINI_API_KEY})
        }
    }

    /**
     * Check if Gemini CLI is available
     */
    async isCliAvailable(): Promise<boolean> {
        if (this.cliAvailable !== null) {
            return this.cliAvailable
        }

        try {
            await execAsync('which gemini')
            this.cliAvailable = true
            Logger.info('Gemini CLI is available')
        } catch {
            this.cliAvailable = false
            Logger.info('Gemini CLI is not available')
        }

        return this.cliAvailable
    }

    /**
     * Get the effective analysis method based on parameter or setting
     * @param userId - User ID for fetching user-specific settings
     * @param requestedMethod - Optional method override
     */
    private getEffectiveMethod(
        userId: string,
        requestedMethod?: AIAnalysisMethod
    ): AIAnalysisMethod {
        if (requestedMethod) {
            return requestedMethod
        }
        return this.settingsRepository.getAIAnalysisMethod(userId)
    }

    /**
     * Analyze a single job against the user's CV
     * @param jobId - Job ID to analyze
     * @param userId - User ID (for fetching user-specific settings)
     * @param cvContent - User's CV content
     * @param method - Optional AI method override
     */
    async analyzeJob(
        jobId: string,
        userId: string,
        cvContent: string,
        method?: AIAnalysisMethod
    ): Promise<AIAnalysis> {
        const effectiveMethod = this.getEffectiveMethod(userId, method)

        // Validate that the requested method is available
        if (effectiveMethod === 'api' && !this.ai) {
            throw new Error(
                'GEMINI_API_KEY is not configured. Please use local CLI or configure API key.'
            )
        }

        if (effectiveMethod === 'local') {
            const cliAvailable = await this.isCliAvailable()
            if (!cliAvailable) {
                throw new Error(
                    'Gemini CLI is not installed. Please install it or use the Cloud API method.'
                )
            }
        }

        // Get the job
        const job = this.jobRepository.findById(jobId)
        if (!job) {
            throw new Error(`Job not found: ${jobId}`)
        }

        // Check if already analyzed
        const existing = this.analysisRepository.findByJobId(jobId)
        if (existing) {
            Logger.info('Job already analyzed, returning cached result', {jobId})
            return existing
        }

        Logger.info('Starting AI analysis', {jobId, title: job.title, method: effectiveMethod})

        // Generate analysis using the appropriate method
        const analysis =
            effectiveMethod === 'local'
                ? await this.generateAnalysisViaCLI(job, cvContent)
                : await this.generateAnalysisViaAPI(job, cvContent)

        // Save to database
        const input: AIAnalysisInput = {
            job_id: jobId,
            match_score: analysis.match_score,
            recommendation: analysis.recommendation,
            strengths: analysis.strengths,
            gaps: analysis.gaps,
            reasoning: analysis.reasoning,
        }

        const saved = this.analysisRepository.create(input)
        Logger.success('AI analysis completed', {
            jobId,
            matchScore: analysis.match_score,
            recommendation: analysis.recommendation,
            method: effectiveMethod,
        })

        return saved
    }

    /**
     * Analyze multiple jobs
     * @param jobIds - Array of job IDs
     * @param userId - User ID (for fetching user-specific settings)
     * @param cvContent - User's CV content
     * @param method - Optional AI method override
     */
    async analyzeJobs(
        jobIds: string[],
        userId: string,
        cvContent: string,
        method?: AIAnalysisMethod
    ): Promise<AIAnalysis[]> {
        const results: AIAnalysis[] = []

        for (const jobId of jobIds) {
            try {
                const analysis = await this.analyzeJob(jobId, userId, cvContent, method)
                results.push(analysis)
            } catch (error) {
                Logger.error(`Failed to analyze job ${jobId}`, error)
            }
        }

        return results
    }

    /**
     * Get analysis for a job (parsed with arrays)
     */
    getAnalysis(jobId: string): AIAnalysisParsed | null {
        const analysis = this.analysisRepository.findByJobId(jobId)
        if (!analysis) return null

        return this.parseAnalysis(analysis)
    }

    /**
     * Get analysis statistics
     */
    getStats() {
        return this.analysisRepository.getStats()
    }

    /**
     * Generate analysis using Gemini API (cloud)
     */
    private async generateAnalysisViaAPI(
        job: Job,
        cvContent: string
    ): Promise<GeminiAnalysisResponse> {
        const prompt = this.buildPrompt(job, cvContent)

        try {
            const response = await this.ai!.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            })

            const text = response.text
            if (!text) {
                throw new Error('Empty response from Gemini')
            }

            return this.parseGeminiResponse(text)
        } catch (error) {
            Logger.error('Gemini API error', error)
            throw new Error('Failed to generate AI analysis')
        }
    }

    /**
     * Generate analysis using Gemini CLI (local)
     */
    private async generateAnalysisViaCLI(
        job: Job,
        cvContent: string
    ): Promise<GeminiAnalysisResponse> {
        const prompt = this.buildPrompt(job, cvContent)

        // Escape the prompt for shell - replace single quotes and backslashes
        const escapedPrompt = prompt.replace(/\\/g, '\\\\').replace(/'/g, "'\\''")

        try {
            const {stdout} = await execAsync(
                `gemini -p '${escapedPrompt}' --output-format json`,
                {timeout: 60000} // 60 second timeout
            )

            if (!stdout.trim()) {
                throw new Error('Empty response from Gemini CLI')
            }

            // CLI returns JSON wrapper: { session_id, response, stats }
            // The actual model response is in the 'response' field
            const responseText = this.extractCliResponse(stdout)
            return this.parseGeminiResponse(responseText)
        } catch (error: any) {
            if (error.killed) {
                Logger.error('Gemini CLI timeout', error)
                throw new Error('Gemini CLI timed out. The analysis took too long to complete.')
            }
            Logger.error('Gemini CLI error', error)
            throw new Error('Failed to generate AI analysis via CLI')
        }
    }

    /**
     * Extract the response text from CLI JSON wrapper
     */
    private extractCliResponse(stdout: string): string {
        try {
            // Find the JSON object in stdout (skip any leading warnings/logs)
            const jsonMatch = stdout.match(/\{[\s\S]*"response"[\s\S]*\}/)
            if (!jsonMatch) {
                Logger.error('CLI output does not contain response JSON', {
                    stdout: stdout.substring(0, 500),
                })
                return stdout // Fall back to raw output
            }

            const wrapper = JSON.parse(jsonMatch[0])
            if (wrapper.response) {
                return wrapper.response
            }

            Logger.error('CLI response field is empty', {wrapper})
            return stdout
        } catch (error) {
            Logger.error('Failed to parse CLI wrapper JSON', {
                error,
                stdout: stdout.substring(0, 500),
            })
            return stdout // Fall back to raw output
        }
    }

    /**
     * Build the analysis prompt
     */
    private buildPrompt(job: Job, cvContent: string): string {
        return `You are a career advisor AI. Analyze how well this job matches the candidate's CV/resume.

## Job Details
Title: ${job.title}
Company: ${job.company || 'Not specified'}
Location: ${job.location || 'Not specified'}
Description: ${job.description || 'Not available'}

## Candidate's CV/Resume
${cvContent}

## Task
Analyze the job-candidate fit and provide:
1. A match score from 0-100
2. A recommendation: APPLY (score >= 70), MAYBE (score 40-69), or SKIP (score < 40)
3. List of strengths (what makes this candidate a good fit)
4. List of gaps (skills or experience the candidate is missing)
5. Brief reasoning for your assessment

## Response Format (JSON only, no markdown)
{
  "match_score": <number 0-100>,
  "recommendation": "<APPLY|MAYBE|SKIP>",
  "strengths": ["<strength1>", "<strength2>", ...],
  "gaps": ["<gap1>", "<gap2>", ...],
  "reasoning": "<brief explanation>"
}

Respond with ONLY the JSON object, no additional text or markdown formatting.`
    }

    /**
     * Parse Gemini response to structured data
     */
    private parseGeminiResponse(text: string): GeminiAnalysisResponse {
        // Try to extract JSON from the response
        let jsonStr = text.trim()

        // Remove markdown code blocks if present
        if (jsonStr.startsWith('```json')) {
            jsonStr = jsonStr.replace(/^```json\n?/, '').replace(/\n?```$/, '')
        } else if (jsonStr.startsWith('```')) {
            jsonStr = jsonStr.replace(/^```\n?/, '').replace(/\n?```$/, '')
        }

        try {
            const parsed = JSON.parse(jsonStr)

            // Validate and sanitize
            return {
                match_score: Math.min(100, Math.max(0, parseInt(parsed.match_score, 10) || 0)),
                recommendation: this.validateRecommendation(parsed.recommendation),
                strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
                gaps: Array.isArray(parsed.gaps) ? parsed.gaps : [],
                reasoning: String(parsed.reasoning || ''),
            }
        } catch {
            Logger.error('Failed to parse Gemini response', {text})
            // Return a default response on parse failure
            return {
                match_score: 0,
                recommendation: 'SKIP',
                strengths: [],
                gaps: ['Unable to analyze job description'],
                reasoning: 'AI analysis failed to parse. Please try again.',
            }
        }
    }

    /**
     * Validate recommendation value
     */
    private validateRecommendation(value: string): 'APPLY' | 'MAYBE' | 'SKIP' {
        const upper = String(value).toUpperCase()
        if (upper === 'APPLY' || upper === 'MAYBE' || upper === 'SKIP') {
            return upper as 'APPLY' | 'MAYBE' | 'SKIP'
        }
        return 'SKIP'
    }

    /**
     * Parse stored analysis (convert JSON strings to arrays)
     */
    private parseAnalysis(analysis: AIAnalysis): AIAnalysisParsed {
        return {
            ...analysis,
            strengths: JSON.parse(analysis.strengths || '[]'),
            gaps: JSON.parse(analysis.gaps || '[]'),
        }
    }
}
