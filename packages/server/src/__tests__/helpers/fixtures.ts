/**
 * Test Fixtures - Consistent mock data for tests
 *
 * Usage:
 *   import { fixtures } from '../helpers/fixtures'
 *   const job = fixtures.job
 */

export const fixtures = {
    // ============================================
    // SEARCH PROFILES
    // ============================================
    profile: {
        id: 'test-profile-1',
        name: 'Test Profile',
        keywords: 'software engineer typescript',
        location: 'Remote',
        date_posted: 'week',
        radius: 50,
        active: 1,
    },

    profileWithoutLocation: {
        id: 'test-profile-2',
        name: 'Global Search Profile',
        keywords: 'react developer',
        location: '', // Empty = global search
        date_posted: 'month',
        radius: 0,
        active: 1,
    },

    profileInactive: {
        id: 'test-profile-3',
        name: 'Inactive Profile',
        keywords: 'python developer',
        location: 'New York',
        date_posted: 'week',
        radius: 25,
        active: 0,
    },

    // ============================================
    // JOBS
    // ============================================
    job: {
        id: 'test-job-1',
        profile_id: 'test-profile-1',
        serpapi_job_id: 'serpapi_123456',
        title: 'Senior Software Engineer',
        company: 'Test Company',
        location: 'Remote',
        description: 'Full-stack development with TypeScript and React',
        apply_link: 'https://example.com/job/123',
        posted_date: '2 days ago',
        source: 'LinkedIn',
        status: 'new',
    },

    jobApplied: {
        id: 'test-job-2',
        profile_id: 'test-profile-1',
        serpapi_job_id: 'serpapi_789012',
        title: 'Frontend Developer',
        company: 'Another Company',
        location: 'New York, NY',
        description: 'Building modern web applications with React',
        apply_link: 'https://example.com/job/456',
        posted_date: '1 week ago',
        source: 'Indeed',
        status: 'applied',
    },

    jobSaved: {
        id: 'test-job-3',
        profile_id: 'test-profile-1',
        serpapi_job_id: 'serpapi_345678',
        title: 'Backend Engineer',
        company: 'Tech Corp',
        location: 'San Francisco, CA',
        description: 'Node.js and PostgreSQL development',
        apply_link: 'https://example.com/job/789',
        posted_date: '3 days ago',
        source: 'Glassdoor',
        status: 'saved',
    },

    // ============================================
    // AI ANALYSES
    // ============================================
    analysis: {
        id: 'test-analysis-1',
        job_id: 'test-job-1',
        match_score: 85,
        recommendation: 'APPLY',
        strengths: JSON.stringify(['TypeScript experience', 'Remote work', 'Full-stack skills']),
        gaps: JSON.stringify(['No Go experience mentioned']),
        reasoning: 'Strong match based on TypeScript and React experience.',
    },

    analysisLowScore: {
        id: 'test-analysis-2',
        job_id: 'test-job-2',
        match_score: 45,
        recommendation: 'MAYBE',
        strengths: JSON.stringify(['Frontend experience']),
        gaps: JSON.stringify(['Location mismatch', 'Missing required skills']),
        reasoning: 'Partial match, consider if willing to relocate.',
    },

    // ============================================
    // SETTINGS
    // ============================================
    settings: {
        cv_content: `
      Experienced Software Engineer with 5+ years of experience.
      Skills: TypeScript, React, Node.js, PostgreSQL, AWS
      Experience: Full-stack web development, microservices architecture
    `.trim(),
    },

    settingsEmpty: {
        cv_content: '',
    },

    // ============================================
    // SERPAPI RESPONSES (Mocked)
    // ============================================
    serpApiResponse: {
        jobs_results: [
            {
                job_id: 'serpapi_new_123',
                title: 'TypeScript Developer',
                company_name: 'New Company',
                location: 'Remote',
                description: 'Building scalable applications',
                share_link: 'https://example.com/job/new123',
                via: 'LinkedIn',
                detected_extensions: {
                    posted_at: '1 day ago',
                    salary: '$120k-$160k',
                },
            },
            {
                job_id: 'serpapi_new_456',
                title: 'React Engineer',
                company_name: 'Startup Inc',
                location: 'San Francisco, CA',
                description: 'Frontend development with React and TypeScript',
                share_link: 'https://example.com/job/new456',
                via: 'Indeed',
                detected_extensions: {
                    posted_at: '3 days ago',
                },
            },
        ],
        search_metadata: {
            status: 'Success',
            total_time_taken: 1.23,
        },
    },

    serpApiEmptyResponse: {
        jobs_results: [],
        search_metadata: {
            status: 'Success',
            total_time_taken: 0.5,
        },
    },

    // ============================================
    // GEMINI AI RESPONSES (Mocked)
    // ============================================
    geminiAnalysisResponse: {
        match_score: 85,
        recommendation: 'APPLY',
        strengths: ['TypeScript experience', 'Remote work preference matches'],
        gaps: ['No specific cloud experience mentioned'],
        reasoning: 'Strong technical match with good cultural fit indicators.',
    },

    geminiAnalysisResponseLow: {
        match_score: 30,
        recommendation: 'SKIP',
        strengths: ['General programming knowledge'],
        gaps: ['Missing required Python experience', 'No ML/AI background'],
        reasoning: 'Significant skill gaps for this position.',
    },

    // ============================================
    // GEMINI CLI RESPONSES (Mocked)
    // ============================================
    geminiCliResponse: {
        // Full CLI wrapper response
        wrapper: {
            session_id: 'test-session-123',
            response: JSON.stringify({
                match_score: 85,
                recommendation: 'APPLY',
                strengths: ['TypeScript experience', 'Remote work preference matches'],
                gaps: ['No specific cloud experience mentioned'],
                reasoning: 'Strong technical match with good cultural fit indicators.',
            }),
            stats: {
                models: {
                    'gemini-2.5-flash-lite': {
                        api: {totalRequests: 1, totalErrors: 0},
                    },
                },
            },
        },
        // CLI output with warnings (realistic output)
        withWarnings: `(node:12345) [DEP0040] DeprecationWarning: The \`punycode\` module is deprecated.
Loaded cached credentials.
{
  "session_id": "test-session-123",
  "response": "{\\"match_score\\": 75, \\"recommendation\\": \\"APPLY\\", \\"strengths\\": [\\"Good fit\\"], \\"gaps\\": [], \\"reasoning\\": \\"Solid match\\"}",
  "stats": {}
}`,
        // Empty response field
        emptyResponse: {
            session_id: 'test-session-456',
            response: '',
            stats: {},
        },
    },

    // ============================================
    // INVALID DATA (for error testing)
    // ============================================
    invalid: {
        emptyProfile: {
            id: '',
            name: '',
            keywords: '',
            location: '',
        },

        jobMissingRequired: {
            id: 'invalid-job',
            // Missing title, serpapi_job_id
        },

        malformedJson: '{invalid json',
    },
}

// Type exports for better IDE support
export type ProfileFixture = typeof fixtures.profile
export type JobFixture = typeof fixtures.job
export type AnalysisFixture = typeof fixtures.analysis
