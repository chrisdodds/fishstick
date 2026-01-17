/**
 * Tests for type guard functions.
 */

import { describe, it, expect } from '@jest/globals'
import { isSectionBlock, isContextBlock, type SlackBlock } from '../types'

describe('isSectionBlock', () => {
    it('should return true for valid section blocks with text', () => {
        const block: SlackBlock = {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: 'Hello world',
            },
        }

        expect(isSectionBlock(block)).toBe(true)
    })

    it('should return false for section blocks without text', () => {
        const block: SlackBlock = {
            type: 'section',
        }

        expect(isSectionBlock(block)).toBe(false)
    })

    it('should return false for non-section blocks', () => {
        const block: SlackBlock = {
            type: 'divider',
        }

        expect(isSectionBlock(block)).toBe(false)
    })

    it('should return false for section blocks with invalid text structure', () => {
        const block: SlackBlock = {
            type: 'section',
            text: 'not an object',
        }

        expect(isSectionBlock(block)).toBe(false)
    })

    it('should return false for section blocks with text object missing text property', () => {
        const block: SlackBlock = {
            type: 'section',
            text: {
                type: 'mrkdwn',
            },
        }

        expect(isSectionBlock(block)).toBe(false)
    })
})

describe('isContextBlock', () => {
    it('should return true for valid context blocks with elements', () => {
        const block: SlackBlock = {
            type: 'context',
            elements: [
                {
                    type: 'mrkdwn',
                    text: 'Some context',
                },
            ],
        }

        expect(isContextBlock(block)).toBe(true)
    })

    it('should return true for context blocks with empty elements array', () => {
        const block: SlackBlock = {
            type: 'context',
            elements: [],
        }

        expect(isContextBlock(block)).toBe(true)
    })

    it('should return false for context blocks without elements', () => {
        const block: SlackBlock = {
            type: 'context',
        }

        expect(isContextBlock(block)).toBe(false)
    })

    it('should return false for non-context blocks', () => {
        const block: SlackBlock = {
            type: 'section',
            elements: [],
        }

        expect(isContextBlock(block)).toBe(false)
    })

    it('should return false when elements is not an array', () => {
        const block: SlackBlock = {
            type: 'context',
            elements: 'not an array',
        }

        expect(isContextBlock(block)).toBe(false)
    })
})
