/**
 * Web Package Test Setup Verification
 *
 * This file verifies the test environment is configured correctly.
 * Add more tests as needed for stores, components, and utilities.
 */

import {describe, it, expect} from 'vitest'

describe('Web Test Environment', () => {
    it('should have vitest configured correctly', () => {
        expect(true).toBe(true)
    })

    it('should have jsdom environment available', () => {
        expect(typeof document).toBe('object')
        expect(typeof window).toBe('object')
    })

    it('should have jest-dom matchers available', () => {
        const div = document.createElement('div')
        div.textContent = 'Hello'
        document.body.appendChild(div)

        expect(div).toBeInTheDocument()
        expect(div).toHaveTextContent('Hello')

        document.body.removeChild(div)
    })
})
