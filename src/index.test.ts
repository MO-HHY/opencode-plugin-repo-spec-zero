import { describe, it, expect } from 'vitest';
import plugin from './index.js';

describe('RepoSpecZero Plugin', () => {
    it('should be a function', () => {
        expect(typeof plugin).toBe('function');
    });
});
