/**
 * Tests for TemplateLoader
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs';
import { TemplateLoader } from './template-loader.js';
// Mock fs module
vi.mock('fs');
describe('TemplateLoader', () => {
    let loader;
    const mockPluginRoot = '/mock/plugin';
    beforeEach(() => {
        vi.resetAllMocks();
        loader = new TemplateLoader(mockPluginRoot);
    });
    afterEach(() => {
        loader.clearCache();
    });
    describe('load()', () => {
        it('should load a template from filesystem', () => {
            const templateContent = `---
name: "Test Template"
description: "A test template"
version: "1.0.0"
requiredVariables: ["title", "content"]
---
# {{title}}

{{content}}
`;
            vi.mocked(fs.existsSync).mockReturnValue(true);
            vi.mocked(fs.readFileSync).mockReturnValue(templateContent);
            const loaded = loader.load('test/example');
            expect(loaded.definition.id).toBe('test/example');
            expect(loaded.definition.name).toBe('Test Template');
            expect(loaded.variables).toContain('title');
            expect(loaded.variables).toContain('content');
            expect(loaded.hash).toHaveLength(8);
        });
        it('should throw error for non-existent template', () => {
            vi.mocked(fs.existsSync).mockReturnValue(false);
            expect(() => loader.load('nonexistent/template')).toThrow('Template not found');
        });
        it('should cache loaded templates', () => {
            const templateContent = `---
name: "Cached"
---
# {{title}}`;
            vi.mocked(fs.existsSync).mockReturnValue(true);
            vi.mocked(fs.readFileSync).mockReturnValue(templateContent);
            loader.load('cached/template');
            loader.load('cached/template');
            expect(fs.readFileSync).toHaveBeenCalledTimes(1);
        });
        it('should extract all variable names from template', () => {
            const templateContent = `---
name: "Multi Variable"
---
# {{title}}
{{description}}
{{#each items}}{{name}}{{/each}}
{{#if condition}}{{value}}{{/if}}
`;
            vi.mocked(fs.existsSync).mockReturnValue(true);
            vi.mocked(fs.readFileSync).mockReturnValue(templateContent);
            const loaded = loader.load('multi/vars');
            expect(loaded.variables).toContain('title');
            expect(loaded.variables).toContain('description');
            expect(loaded.variables).toContain('items');
            expect(loaded.variables).toContain('condition');
        });
    });
    describe('fill()', () => {
        const createMockTemplate = (content) => ({
            definition: {
                id: 'test/template',
                name: 'Test',
                description: '',
                category: 'test',
                requiredVariables: [],
                version: '1.0.0',
            },
            content,
            variables: [],
            hash: 'abcd1234',
        });
        it('should replace simple variables', () => {
            const template = createMockTemplate('Hello {{name}}!');
            const result = loader.fill(template, { name: 'World' });
            expect(result.content).toBe('Hello World!');
            expect(result.usedVariables).toContain('name');
        });
        it('should handle missing variables', () => {
            const template = createMockTemplate('Hello {{name}}!');
            const result = loader.fill(template, {});
            expect(result.content).toBe('Hello {{name}}!');
            expect(result.missingVariables).toContain('name');
        });
        it('should process {{#each}} blocks', () => {
            const template = createMockTemplate(`Items:
{{#each items}}
- {{this}}
{{/each}}`);
            const result = loader.fill(template, { items: ['A', 'B', 'C'] });
            expect(result.content).toContain('- A');
            expect(result.content).toContain('- B');
            expect(result.content).toContain('- C');
        });
        it('should process {{#each}} with object properties', () => {
            const template = createMockTemplate(`{{#each users}}
| {{name}} | {{email}} |
{{/each}}`);
            const result = loader.fill(template, {
                users: [
                    { name: 'Alice', email: 'alice@test.com' },
                    { name: 'Bob', email: 'bob@test.com' },
                ],
            });
            expect(result.content).toContain('| Alice | alice@test.com |');
            expect(result.content).toContain('| Bob | bob@test.com |');
        });
        it('should process {{#if}} blocks (truthy)', () => {
            const template = createMockTemplate(`{{#if showSection}}
Visible Section
{{/if}}`);
            const result = loader.fill(template, { showSection: true });
            expect(result.content).toContain('Visible Section');
        });
        it('should process {{#if}} blocks (falsy)', () => {
            const template = createMockTemplate(`{{#if showSection}}
Visible Section
{{/if}}`);
            const result = loader.fill(template, { showSection: false });
            expect(result.content).not.toContain('Visible Section');
        });
        it('should process {{#if}}...{{else}} blocks', () => {
            const template = createMockTemplate(`{{#if authenticated}}
Welcome back!
{{else}}
Please login.
{{/if}}`);
            const resultTrue = loader.fill(template, { authenticated: true });
            const resultFalse = loader.fill(template, { authenticated: false });
            expect(resultTrue.content).toContain('Welcome back!');
            expect(resultFalse.content).toContain('Please login.');
        });
        it('should process {{#unless}} blocks', () => {
            const template = createMockTemplate(`{{#unless hasErrors}}
Success!
{{/unless}}`);
            const result = loader.fill(template, { hasErrors: false });
            expect(result.content).toContain('Success!');
        });
        it('should handle empty arrays in {{#each}}', () => {
            const template = createMockTemplate(`{{#each items}}
- {{this}}
{{/each}}`);
            const result = loader.fill(template, { items: [] });
            expect(result.content.trim()).toBe('');
        });
    });
    describe('list()', () => {
        it('should list all templates in directories', () => {
            vi.mocked(fs.existsSync).mockReturnValue(true);
            vi.mocked(fs.readdirSync).mockImplementation((dirPath) => {
                if (dirPath.toString().endsWith('templates')) {
                    return [
                        { name: 'api', isDirectory: () => true },
                        { name: 'ui', isDirectory: () => true },
                    ];
                }
                if (dirPath.toString().includes('api')) {
                    return ['endpoint.md'];
                }
                if (dirPath.toString().includes('ui')) {
                    return ['component.md'];
                }
                return [];
            });
            vi.mocked(fs.readFileSync).mockReturnValue(`---
name: "Mock Template"
---
# Content`);
            const templates = loader.list();
            expect(templates.length).toBeGreaterThan(0);
        });
    });
    describe('getVariables()', () => {
        it('should return all variables for a template', () => {
            const templateContent = `---
name: "Variables Test"
---
# {{title}}
{{description}}
{{#if show}}{{content}}{{/if}}
`;
            vi.mocked(fs.existsSync).mockReturnValue(true);
            vi.mocked(fs.readFileSync).mockReturnValue(templateContent);
            const variables = loader.getVariables('test/vars');
            expect(variables).toContain('title');
            expect(variables).toContain('description');
            expect(variables).toContain('show');
        });
    });
});
//# sourceMappingURL=template-loader.test.js.map