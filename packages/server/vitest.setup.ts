import { beforeAll, afterEach, afterAll } from 'vitest'

// Set test environment variables
beforeAll(() => {
  process.env.NODE_ENV = 'test'
  process.env.SERPAPI_API_KEY = 'test_serpapi_key'
  process.env.GEMINI_API_KEY = 'test_gemini_key'
  process.env.PORT = '3099'
})

afterEach(() => {
  // Clear any side effects between tests
})

afterAll(() => {
  // Global cleanup if needed
})
