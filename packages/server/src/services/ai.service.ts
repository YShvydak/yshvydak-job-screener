import { GoogleGenAI } from '@google/genai';
import { Job, AIAnalysis, AIAnalysisParsed } from '@yshvydak-job-screener/shared';
import { AnalysisRepository, AIAnalysisInput } from '../repositories/analysis.repository';
import { JobRepository } from '../repositories/job.repository';
import { Logger } from '../utils/Logger';
import { env } from '../config/environment.config';

/**
 * Gemini AI response structure for job analysis
 */
interface GeminiAnalysisResponse {
    match_score: number;
    recommendation: 'APPLY' | 'MAYBE' | 'SKIP';
    strengths: string[];
    gaps: string[];
    reasoning: string;
}

/**
 * Service for AI-powered job analysis using Google Gemini
 */
export class AIService {
    private ai: GoogleGenAI | null = null;

    constructor(
        private analysisRepository: AnalysisRepository,
        private jobRepository: JobRepository
    ) {
        // Initialize Gemini client if API key is available
        if (env.GEMINI_API_KEY) {
            this.ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
        }
    }

    /**
     * Analyze a single job against the user's CV
     */
    async analyzeJob(jobId: string, cvContent: string): Promise<AIAnalysis> {
        if (!this.ai) {
            throw new Error('GEMINI_API_KEY is not configured');
        }

        // Get the job
        const job = this.jobRepository.findById(jobId);
        if (!job) {
            throw new Error(`Job not found: ${jobId}`);
        }

        // Check if already analyzed
        const existing = this.analysisRepository.findByJobId(jobId);
        if (existing) {
            Logger.info('Job already analyzed, returning cached result', { jobId });
            return existing;
        }

        Logger.info('Starting AI analysis', { jobId, title: job.title });

        // Generate analysis using Gemini
        const analysis = await this.generateAnalysis(job, cvContent);

        // Save to database
        const input: AIAnalysisInput = {
            job_id: jobId,
            match_score: analysis.match_score,
            recommendation: analysis.recommendation,
            strengths: analysis.strengths,
            gaps: analysis.gaps,
            reasoning: analysis.reasoning
        };

        const saved = this.analysisRepository.create(input);
        Logger.success('AI analysis completed', {
            jobId,
            matchScore: analysis.match_score,
            recommendation: analysis.recommendation
        });

        return saved;
    }

    /**
     * Analyze multiple jobs
     */
    async analyzeJobs(jobIds: string[], cvContent: string): Promise<AIAnalysis[]> {
        const results: AIAnalysis[] = [];

        for (const jobId of jobIds) {
            try {
                const analysis = await this.analyzeJob(jobId, cvContent);
                results.push(analysis);
            } catch (error) {
                Logger.error(`Failed to analyze job ${jobId}`, error);
            }
        }

        return results;
    }

    /**
     * Get analysis for a job (parsed with arrays)
     */
    getAnalysis(jobId: string): AIAnalysisParsed | null {
        const analysis = this.analysisRepository.findByJobId(jobId);
        if (!analysis) return null;

        return this.parseAnalysis(analysis);
    }

    /**
     * Get analysis statistics
     */
    getStats() {
        return this.analysisRepository.getStats();
    }

    /**
     * Generate analysis using Gemini AI
     */
    private async generateAnalysis(job: Job, cvContent: string): Promise<GeminiAnalysisResponse> {
        const prompt = this.buildPrompt(job, cvContent);

        try {
            const response = await this.ai!.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt
            });

            const text = response.text;
            if (!text) {
                throw new Error('Empty response from Gemini');
            }

            return this.parseGeminiResponse(text);
        } catch (error) {
            Logger.error('Gemini API error', error);
            throw new Error('Failed to generate AI analysis');
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

Respond with ONLY the JSON object, no additional text or markdown formatting.`;
    }

    /**
     * Parse Gemini response to structured data
     */
    private parseGeminiResponse(text: string): GeminiAnalysisResponse {
        // Try to extract JSON from the response
        let jsonStr = text.trim();

        // Remove markdown code blocks if present
        if (jsonStr.startsWith('```json')) {
            jsonStr = jsonStr.replace(/^```json\n?/, '').replace(/\n?```$/, '');
        } else if (jsonStr.startsWith('```')) {
            jsonStr = jsonStr.replace(/^```\n?/, '').replace(/\n?```$/, '');
        }

        try {
            const parsed = JSON.parse(jsonStr);

            // Validate and sanitize
            return {
                match_score: Math.min(100, Math.max(0, parseInt(parsed.match_score, 10) || 0)),
                recommendation: this.validateRecommendation(parsed.recommendation),
                strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
                gaps: Array.isArray(parsed.gaps) ? parsed.gaps : [],
                reasoning: String(parsed.reasoning || '')
            };
        } catch {
            Logger.error('Failed to parse Gemini response', { text });
            // Return a default response on parse failure
            return {
                match_score: 0,
                recommendation: 'SKIP',
                strengths: [],
                gaps: ['Unable to analyze job description'],
                reasoning: 'AI analysis failed to parse. Please try again.'
            };
        }
    }

    /**
     * Validate recommendation value
     */
    private validateRecommendation(value: string): 'APPLY' | 'MAYBE' | 'SKIP' {
        const upper = String(value).toUpperCase();
        if (upper === 'APPLY' || upper === 'MAYBE' || upper === 'SKIP') {
            return upper as 'APPLY' | 'MAYBE' | 'SKIP';
        }
        return 'SKIP';
    }

    /**
     * Parse stored analysis (convert JSON strings to arrays)
     */
    private parseAnalysis(analysis: AIAnalysis): AIAnalysisParsed {
        return {
            ...analysis,
            strengths: JSON.parse(analysis.strengths || '[]'),
            gaps: JSON.parse(analysis.gaps || '[]')
        };
    }
}
