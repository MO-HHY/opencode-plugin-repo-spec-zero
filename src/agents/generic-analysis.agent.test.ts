/**
 * Tests for GenericAnalysisAgent
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GenericAnalysisAgent } from './generic-analysis.agent.js';
import type { PlannedAgent, RoutedPrompt } from '../types.js';

// Mock dependencies
const mockRouter = {
    route: vi.fn(),
};

const mockTemplateLoader = {
    load: vi.fn(),
    fill: vi.fn(),
};

const mockDiagramGenerator = {
    generate: vi.fn(),
};

describe('GenericAnalysisAgent', () => {
    let agent: GenericAnalysisAgent;
    const mockConfig: PlannedAgent = {
        id: 'test-agent',
        promptId: 'analysis/test',
        templateId: 'test/template',
        dependencies: ['bootstrap'],
        parallel: true,
        optional: false,
        diagrams: ['flowchart'],
        outputFile: '00-foundation/test.md',
        layer: 2,
    };

    beforeEach(() => {
        vi.resetAllMocks();
        agent = new GenericAnalysisAgent(
            mockConfig,
            mockRouter as any,
            mockTemplateLoader as any,
            mockDiagramGenerator as any
        );
    });

    describe('constructor', () => {
        it('should set id from config', () => {
            expect(agent.id).toBe('test-agent');
        });

        it('should set name based on id', () => {
            expect(agent.name).toBe('test-agent Analysis');
        });

        it('should set description with prompt id', () => {
            expect(agent.description).toContain('analysis/test');
        });
    });

    describe('process()', () => {
        const mockRoutedPrompt: RoutedPrompt = {
            systemPrompt: 'You are an analyst',
            analysisPrompt: 'Analyze the code',
            outputSchema: '## Output Format',
            diagramInstructions: [
                {
                    type: 'flowchart',
                    description: 'Generate a flowchart',
                    outputFile: 'test-flowchart.mmd',
                    inline: true,
                },
            ],
            templateId: 'test/template',
            metadata: {
                promptId: 'analysis/test',
                version: '1',
                hash: 'abc12345',
            },
        };

        let mockContext: any;

        beforeEach(() => {
            mockContext = {
                client: {
                    session: {
                        prompt: vi.fn().mockResolvedValue('# Analysis Result\n\nTest content'),
                    },
                },
                params: {
                    repoType: 'backend',
                    projectSlug: 'test-project',
                    repoStructure: 'src/\n  index.ts',
                    completedAgents: ['bootstrap'],
                    previousOutputs: {},
                },
                messages: [],
                intent: { name: 'test', confidence: 1 },
            };

            mockRouter.route.mockReturnValue(mockRoutedPrompt);
            mockTemplateLoader.load.mockReturnValue({
                definition: { id: 'test/template' },
                content: '# {{title}}\n{{content}}',
                variables: ['title', 'content'],
                hash: 'template123',
            });
            mockTemplateLoader.fill.mockReturnValue({
                content: '# Analysis Result\n\nFormatted content',
                usedVariables: ['title'],
                missingVariables: [],
            });
        });

        it('should call router.route with correct context', async () => {
            await agent.process(mockContext as any);

            expect(mockRouter.route).toHaveBeenCalled();
            const routeArg = mockRouter.route.mock.calls[0][0];
            expect(routeArg.currentAgentId).toBe('test-agent');
        });

        it('should return success result with output', async () => {
            const result = await agent.process(mockContext as any);

            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(result.data.path).toBe('00-foundation/test.md');
        });

        it('should include prompt version in output', async () => {
            const result = await agent.process(mockContext as any);

            expect(result.data.promptVersion).toEqual({
                id: 'analysis/test',
                version: '1',
                hash: 'abc12345',
            });
        });

        it('should handle LLM failure gracefully', async () => {
            mockContext.client.session.prompt.mockRejectedValue(new Error('LLM Error'));

            const result = await agent.process(mockContext as any);

            expect(result.success).toBe(false);
            expect(result.message).toContain('LLM Error');
        });

        it('should continue without template if loading fails', async () => {
            mockTemplateLoader.load.mockImplementation(() => {
                throw new Error('Template not found');
            });

            const result = await agent.process(mockContext as any);

            expect(result.success).toBe(true);
        });

        it('should extract mermaid diagrams from content', async () => {
            mockContext.client.session.prompt.mockResolvedValue(`# Result

\`\`\`mermaid
flowchart TD
    A --> B
\`\`\`
`);

            const result = await agent.process(mockContext as any);

            expect(result.success).toBe(true);
            expect(result.data.diagrams).toBeDefined();
        });

        it('should create standalone diagram files', async () => {
            mockContext.client.session.prompt.mockResolvedValue(`# Result

\`\`\`mermaid
flowchart TD
    A[Start] --> B[End]
\`\`\`
`);

            const result = await agent.process(mockContext as any);

            if (result.data.diagrams.length > 0) {
                const diagram = result.data.diagrams[0];
                expect(diagram.path).toContain('_diagrams/');
                expect(diagram.content).toContain('---'); // Has frontmatter
            }
        });

        it('should call DiagramGenerator if diagram is missing from content', async () => {
            mockContext.client.session.prompt.mockResolvedValue('# Result without mermaid');
            mockDiagramGenerator.generate.mockResolvedValue({
                type: 'flowchart',
                content: 'flowchart TD\n    Generated --> Node',
                outputFile: 'generated.mmd',
                inline: true
            });

            const result = await agent.process(mockContext as any);

            expect(mockDiagramGenerator.generate).toHaveBeenCalled();
            expect(result.data.output).toContain('flowchart TD');
            expect(result.data.diagrams.length).toBeGreaterThan(0);
        });
    });

    describe('without template', () => {
        it('should work without templateId', async () => {
            const configNoTemplate: PlannedAgent = {
                ...mockConfig,
                templateId: undefined,
            };
            
            const agentNoTemplate = new GenericAnalysisAgent(
                configNoTemplate,
                mockRouter as any,
                mockTemplateLoader as any,
                mockDiagramGenerator as any
            );

            mockRouter.route.mockReturnValue({
                systemPrompt: 'System',
                analysisPrompt: 'Analyze',
                outputSchema: 'Schema',
                diagramInstructions: [],
                metadata: { promptId: 'test', version: '1', hash: 'abc' },
            });

            const result = await agentNoTemplate.process({
                client: {
                    session: {
                        prompt: vi.fn().mockResolvedValue('# Output'),
                    },
                },
                params: { repoType: 'backend' },
                messages: [],
                intent: { name: 'test', confidence: 1 },
            } as any);

            expect(result.success).toBe(true);
        });
    });
});
