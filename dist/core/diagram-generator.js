/**
 * DiagramGenerator - Generates Mermaid diagrams from analysis content
 *
 * Capability:
 * 1. Extract diagrams from LLM output
 * 2. Generate diagrams from structured data
 * 3. Validate Mermaid syntax
 * 4. Create standalone files with frontmatter
 */
export class DiagramGenerator {
    /**
     * Generates a diagram based on analysis content
     */
    async generate(type, analysisContent, context) {
        switch (type) {
            case 'erd':
                return this.generateERD(analysisContent, context);
            case 'sequence':
                return this.generateSequence(analysisContent, context);
            case 'flowchart':
                return this.generateFlowchart(analysisContent, context);
            case 'classDiagram':
                return this.generateClassDiagram(analysisContent, context);
            case 'stateDiagram':
                return this.generateStateDiagram(analysisContent, context);
            case 'c4':
                return this.generateC4(analysisContent, context);
            default:
                return null;
        }
    }
    /**
     * Entity Relationship Diagram Generator
     */
    async generateERD(content, context) {
        const entities = this.extractEntities(content);
        if (entities.length === 0)
            return null;
        let mermaid = 'erDiagram\n';
        // Add entities and fields
        for (const entity of entities) {
            if (entity.fields.length > 0) {
                mermaid += `    ${this.sanitizeId(entity.name)} {\n`;
                for (const field of entity.fields) {
                    const pkFk = field.isPK ? 'PK' : (field.isFK ? 'FK' : '');
                    mermaid += `        ${field.type} ${this.sanitizeId(field.name)} ${pkFk}\n`;
                }
                mermaid += '    }\n';
            }
        }
        // Add relations
        for (const entity of entities) {
            if (entity.relations) {
                for (const rel of entity.relations) {
                    mermaid += `    ${this.sanitizeId(entity.name)} ${rel.cardinality} ${this.sanitizeId(rel.target)} : "${rel.label}"\n`;
                }
            }
        }
        return {
            type: 'erd',
            content: mermaid,
            outputFile: 'erd.mmd',
            inline: true
        };
    }
    /**
     * Sequence Diagram Generator
     */
    async generateSequence(content, context) {
        const flows = this.extractFlows(content);
        if (flows.length === 0)
            return null;
        let mermaid = 'sequenceDiagram\n';
        for (const flow of flows) {
            const arrow = flow.isResponse ? '-->>' : '->>';
            mermaid += `    ${this.sanitizeId(flow.from)}${arrow}${this.sanitizeId(flow.to)}: ${flow.message}\n`;
        }
        return {
            type: 'sequence',
            content: mermaid,
            outputFile: 'sequence.mmd',
            inline: true
        };
    }
    /**
     * Flowchart Diagram Generator
     */
    async generateFlowchart(content, context) {
        const steps = this.extractSteps(content);
        if (steps.length === 0)
            return null;
        let mermaid = 'flowchart TD\n';
        for (const step of steps) {
            const startChar = step.type === 'decision' ? '{' : (step.type === 'terminal' ? '([' : '[');
            const endChar = step.type === 'decision' ? '}' : (step.type === 'terminal' ? '])' : ']');
            mermaid += `    ${this.sanitizeId(step.id)}${startChar}"${step.label}"${endChar}\n`;
            if (step.next) {
                for (const n of step.next) {
                    const link = n.condition ? ` -- "${n.condition}" --> ` : ' --> ';
                    mermaid += `    ${this.sanitizeId(step.id)}${link}${this.sanitizeId(n.target)}\n`;
                }
            }
        }
        return {
            type: 'flowchart',
            content: mermaid,
            outputFile: 'flowchart.mmd',
            inline: true
        };
    }
    /**
     * Class Diagram Generator
     */
    async generateClassDiagram(content, context) {
        const classes = this.extractClasses(content);
        if (classes.length === 0)
            return null;
        let mermaid = 'classDiagram\n';
        for (const cls of classes) {
            mermaid += `    class ${this.sanitizeId(cls.name)} {\n`;
            if (cls.properties) {
                for (const prop of cls.properties) {
                    const visibility = prop.isPublic ? '+' : '-';
                    mermaid += `        ${visibility}${prop.type} ${prop.name}\n`;
                }
            }
            if (cls.methods) {
                for (const method of cls.methods) {
                    const visibility = method.isPublic ? '+' : '-';
                    mermaid += `        ${visibility}${method.name}(${method.params || ''}) ${method.returnType}\n`;
                }
            }
            mermaid += '    }\n';
            if (cls.extends) {
                mermaid += `    ${this.sanitizeId(cls.extends)} <|-- ${this.sanitizeId(cls.name)}\n`;
            }
            if (cls.implements) {
                for (const imp of cls.implements) {
                    mermaid += `    ${this.sanitizeId(imp)} <|.. ${this.sanitizeId(cls.name)}\n`;
                }
            }
        }
        return {
            type: 'classDiagram',
            content: mermaid,
            outputFile: 'class-diagram.mmd',
            inline: true
        };
    }
    /**
     * State Diagram Generator
     */
    async generateStateDiagram(content, context) {
        const states = this.extractStates(content);
        if (states.length === 0)
            return null;
        let mermaid = 'stateDiagram-v2\n';
        for (const state of states) {
            if (state.isInitial)
                mermaid += `    [*] --> ${this.sanitizeId(state.name)}\n`;
            if (state.transitions) {
                for (const trans of state.transitions) {
                    const event = trans.event ? `: ${trans.event}` : '';
                    mermaid += `    ${this.sanitizeId(state.name)} --> ${this.sanitizeId(trans.target)}${event}\n`;
                }
            }
            if (state.isFinal)
                mermaid += `    ${this.sanitizeId(state.name)} --> [*]\n`;
        }
        return {
            type: 'stateDiagram',
            content: mermaid,
            outputFile: 'state-diagram.mmd',
            inline: true
        };
    }
    /**
     * C4 Context Diagram Generator
     */
    async generateC4(content, context) {
        const components = this.extractComponents(content);
        if (components.length === 0)
            return null;
        let mermaid = 'C4Context\n';
        for (const comp of components) {
            const desc = comp.description ? `, "${comp.description}"` : '';
            if (comp.type === 'person') {
                mermaid += `    Person(${this.sanitizeId(comp.id)}, "${comp.name}"${desc})\n`;
            }
            else if (comp.type === 'external') {
                mermaid += `    System_Ext(${this.sanitizeId(comp.id)}, "${comp.name}"${desc})\n`;
            }
            else {
                mermaid += `    System(${this.sanitizeId(comp.id)}, "${comp.name}"${desc})\n`;
            }
            if (comp.relations) {
                for (const rel of comp.relations) {
                    mermaid += `    Rel(${this.sanitizeId(comp.id)}, ${this.sanitizeId(rel.target)}, "${rel.label}")\n`;
                }
            }
        }
        return {
            type: 'c4',
            content: mermaid,
            outputFile: 'c4-context.mmd',
            inline: true
        };
    }
    // ============================================================================
    // EXTRACTORS (Regex heavy)
    // ============================================================================
    extractEntities(content) {
        const entities = new Map();
        // 1. Extract from Entity Catalog table
        const catalogRegex = /\|\s*([^|\n]+)\s*\|\s*([^|\n]+)\s*\|\s*([^|\n]+)\s*\|\s*([^|\n]+)\s*\|/g;
        let match;
        while ((match = catalogRegex.exec(content)) !== null) {
            const name = match[1].trim();
            if (name === 'Entity' || name.startsWith('---') || name === '')
                continue;
            if (!entities.has(name)) {
                entities.set(name, { name, fields: [], relations: [] });
            }
        }
        // 2. Extract relationships table
        const relSection = content.split(/###\s+.*Relationships/i)[1];
        if (relSection) {
            const relRegex = /\|\s*([^|\n]+)\s*\|\s*([^|\n]+)\s*\|\s*([^|\n]+)\s*\|\s*([^|\n]+)\s*\|/g;
            let relMatch;
            while ((relMatch = relRegex.exec(relSection)) !== null) {
                const entityA = relMatch[1].trim();
                const relation = relMatch[2].trim();
                const entityB = relMatch[3].trim();
                const label = relMatch[4].trim();
                if (entityA === 'Entity A' || entityA.startsWith('---') || entityA === '')
                    continue;
                if (!entities.has(entityA))
                    entities.set(entityA, { name: entityA, fields: [], relations: [] });
                if (!entities.has(entityB))
                    entities.set(entityB, { name: entityB, fields: [], relations: [] });
                entities.get(entityA).relations.push({
                    target: entityB,
                    cardinality: this.mapERDCardinality(relation),
                    label
                });
            }
        }
        // 3. Extract fields from Entity Schema Details
        const schemaSections = content.split(/####\s+Entity:\s*/i);
        for (const section of schemaSections.slice(1)) {
            const lines = section.split('\n');
            const entityName = lines[0].trim();
            const entity = entities.get(entityName);
            if (entity) {
                const fieldRegex = /^\s*([a-zA-Z0-9_?]+)\s*:\s*([a-zA-Z0-9_<>|\[\]]+)/gm;
                let fieldMatch;
                while ((fieldMatch = fieldRegex.exec(section)) !== null) {
                    const name = fieldMatch[1].replace('?', '').trim();
                    const type = fieldMatch[2].trim();
                    const isPK = section.toLowerCase().includes(`${name.toLowerCase()} is primary`) ||
                        section.includes(`@id`) ||
                        section.includes(`PK`);
                    const isFK = section.toLowerCase().includes(`${name.toLowerCase()} is foreign`) ||
                        section.includes(`FK`);
                    entity.fields.push({ name, type, isPK, isFK });
                }
            }
        }
        return Array.from(entities.values());
    }
    extractFlows(content) {
        const flows = [];
        const flowRegex = /\|\s*([^|\n]+?)\s*\|\s*([^|\n]+?)\s*\|\s*([^|\n]+?)\s*(?:\|\s*([^|\n]*?)\s*)?\|/;
        const sections = content.split(/###\s+/);
        for (const section of sections) {
            if (/sequence|flow|interaction/i.test(section)) {
                const lines = section.split('\n');
                for (const line of lines) {
                    // 1. Try table format
                    const match = line.match(flowRegex);
                    if (match) {
                        const from = match[1].trim();
                        const to = match[2].trim();
                        const message = match[3].trim();
                        if (from === 'From' || from === 'Source' || from.startsWith('---') || from === '')
                            continue;
                        flows.push({
                            from,
                            to,
                            message,
                            isResponse: message.toLowerCase().includes('response') || message.toLowerCase().includes('return')
                        });
                        continue;
                    }
                    // 2. Try "A -> B: message" format
                    const textFlowRegex = /^([a-zA-Z0-9_]+)\s*(?:->|-->|->>|-->>)\s*([a-zA-Z0-9_]+)\s*:\s*(.+)$/;
                    const textMatch = line.match(textFlowRegex);
                    if (textMatch) {
                        flows.push({
                            from: textMatch[1].trim(),
                            to: textMatch[2].trim(),
                            message: textMatch[3].trim(),
                            isResponse: line.includes('--')
                        });
                    }
                }
            }
        }
        return flows;
    }
    extractSteps(content) {
        const steps = [];
        const stepRegex = /\|\s*([^|\n]+)\s*\|\s*([^|\n]+)\s*\|\s*([^|\n]+)\s*\|\s*([^|\n]+)\s*\|/g;
        let match;
        while ((match = stepRegex.exec(content)) !== null) {
            const id = match[1].trim();
            const label = match[2].trim();
            const type = match[3].trim().toLowerCase();
            const next = match[4].trim();
            if (id === 'ID' || id.startsWith('---') || id === '')
                continue;
            const diagramStep = {
                id,
                label: label || id,
                type: type.includes('decision') ? 'decision' : (type.includes('end') || type.includes('start') || type.includes('terminal') ? 'terminal' : 'process'),
                next: []
            };
            if (next && next !== 'None' && next !== '-') {
                const targets = next.split(',');
                for (const t of targets) {
                    const tMatch = t.match(/([^(\s]+)(?:\s*\(([^)]+)\))?/);
                    if (tMatch) {
                        diagramStep.next.push({
                            target: tMatch[1].trim(),
                            condition: tMatch[2]?.trim()
                        });
                    }
                }
            }
            steps.push(diagramStep);
        }
        if (steps.length === 0) {
            const listRegex = /^\s*(?:\d+\.|-)\s*(?:\[([^\]]+)\]\s*)?([^:(\n]+)(?::\s*([^(\n]+))?(?:\s*\((?:next|target|then):\s*([^)]+)\))?/gm;
            let listMatch;
            while ((listMatch = listRegex.exec(content)) !== null) {
                const id = listMatch[1] || listMatch[2].trim();
                const label = listMatch[2].trim();
                const next = listMatch[4]?.trim();
                if (label === '' || label.toLowerCase().includes('step'))
                    continue;
                const diagramStep = {
                    id: this.sanitizeId(id),
                    label: label,
                    type: label.toLowerCase().includes('if') || label.toLowerCase().includes('check') ? 'decision' : 'process',
                    next: []
                };
                if (next) {
                    const targets = next.split(',');
                    for (const t of targets) {
                        diagramStep.next.push({ target: this.sanitizeId(t.trim()) });
                    }
                }
                steps.push(diagramStep);
            }
        }
        return steps;
    }
    extractClasses(content) {
        const classes = [];
        const classSections = content.split(/####\s+Class:|####\s+Interface:/i);
        for (const section of classSections.slice(1)) {
            const lines = section.split('\n');
            const name = lines[0].trim();
            const cls = { name, properties: [], methods: [] };
            const extendsMatch = section.match(/extends\s+([a-zA-Z0-9_]+)/i);
            if (extendsMatch)
                cls.extends = extendsMatch[1];
            const lines_ = section.split('\n');
            for (const line of lines_) {
                const propMatch = line.match(/([+-])\s*([a-zA-Z0-9_]+)\s*:\s*([a-zA-Z0-9_<>|\[\]]+)/);
                if (propMatch && !line.includes('(')) {
                    cls.properties.push({
                        isPublic: propMatch[1] === '+',
                        name: propMatch[2],
                        type: propMatch[3]
                    });
                }
                const methodMatch = line.match(/([+-])\s*([a-zA-Z0-9_]+)\s*\(([^)]*)\)\s*(?::\s*([a-zA-Z0-9_<>|\[\]]+))?/);
                if (methodMatch) {
                    cls.methods.push({
                        isPublic: methodMatch[1] === '+',
                        name: methodMatch[2],
                        params: methodMatch[3],
                        returnType: methodMatch[4] || 'void'
                    });
                }
            }
            classes.push(cls);
        }
        return classes;
    }
    extractStates(content) {
        const states = new Map();
        const transitionRegex = /\|\s*([^|\n]+)\s*\|\s*([^|\n]+)\s*\|\s*([^|\n]+)\s*\|/g;
        let match;
        while ((match = transitionRegex.exec(content)) !== null) {
            const from = match[1].trim();
            const event = match[2].trim();
            const to = match[3].trim();
            if (from === 'From State' || from.startsWith('---') || from === '')
                continue;
            if (!states.has(from))
                states.set(from, { name: from, transitions: [] });
            if (!states.has(to))
                states.set(to, { name: to, transitions: [] });
            states.get(from).transitions.push({
                target: to,
                event: event !== '-' ? event : undefined
            });
            if (from.toLowerCase().includes('start') || from.toLowerCase().includes('initial') || from === '[*]') {
                states.get(from).isInitial = true;
            }
            if (to.toLowerCase().includes('end') || to.toLowerCase().includes('final') || to === '[*]') {
                states.get(to).isFinal = true;
            }
        }
        return Array.from(states.values());
    }
    extractComponents(content) {
        const components = new Map();
        const sections = content.split(/###\s+/);
        let architectureSection = "";
        let relationsSection = "";
        for (const section of sections) {
            if (/architecture|system|component/i.test(section) && !/relation/i.test(section)) {
                architectureSection = section;
            }
            if (/relation/i.test(section)) {
                relationsSection = section;
            }
        }
        const compRegex = /\|\s*([^|\n]+)\s*\|\s*([^|\n]+)\s*\|\s*([^|\n]+)\s*\|\s*([^|\n]+)\s*\|/g;
        let match;
        while ((match = compRegex.exec(architectureSection)) !== null) {
            const id = match[1].trim();
            const name = match[2].trim();
            const type = match[3].trim().toLowerCase();
            const desc = match[4].trim();
            if (id === 'ID' || id.startsWith('---') || id === '')
                continue;
            components.set(id, {
                id,
                name,
                type: type.includes('person') ? 'person' : (type.includes('external') ? 'external' : 'system'),
                description: desc !== '-' ? desc : undefined,
                relations: []
            });
        }
        const relRegex = /\|\s*([^|\n]+)\s*\|\s*([^|\n]+)\s*\|\s*([^|\n]+)\s*\|/g;
        let relMatch;
        while ((relMatch = relRegex.exec(relationsSection)) !== null) {
            const from = relMatch[1].trim();
            const to = relMatch[2].trim();
            const label = relMatch[3].trim();
            if (from === 'From' || from.startsWith('---') || from === '' || !components.has(from))
                continue;
            components.get(from).relations.push({
                target: to,
                label
            });
        }
        return Array.from(components.values());
    }
    mapERDCardinality(relation) {
        relation = relation.toLowerCase();
        if (relation.includes('1:1') || relation.includes('one to one'))
            return '||--||';
        if (relation.includes('1:n') || relation.includes('one to many'))
            return '||--o{';
        if (relation.includes('n:1') || relation.includes('many to one'))
            return '}o--||';
        if (relation.includes('n:m') || relation.includes('many to many'))
            return '}o--o{';
        return '||--o{';
    }
    sanitizeId(str) {
        if (str === '[*]')
            return str;
        return str.replace(/[^a-zA-Z0-9]/g, '_');
    }
    validateMermaid(content) {
        if (!content || content.trim().length === 0)
            return false;
        const validStartKeywords = [
            'erDiagram',
            'sequenceDiagram',
            'flowchart',
            'graph',
            'classDiagram',
            'stateDiagram',
            'C4Context',
            'gantt',
            'pie'
        ];
        return validStartKeywords.some(keyword => content.trim().startsWith(keyword));
    }
}
//# sourceMappingURL=diagram-generator.js.map