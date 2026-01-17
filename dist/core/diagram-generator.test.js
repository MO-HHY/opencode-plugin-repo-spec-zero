/**
 * Tests for DiagramGenerator
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { DiagramGenerator } from './diagram-generator.js';
describe('DiagramGenerator', () => {
    let generator;
    let mockContext;
    beforeEach(() => {
        generator = new DiagramGenerator();
        mockContext = {
            client: {},
            params: {},
            messages: [],
            intent: {}
        };
    });
    describe('ERD Generation', () => {
        it('should extract entities and generate ERD from markdown tables', async () => {
            const content = `
## Entities
| Entity | Description |
|--------|-------------|
| User   | System user |
| Post   | Blog post   |

### Relationships
| Entity A | Relation | Entity B | Label |
|----------|----------|----------|-------|
| User     | 1:N      | Post     | owns  |

#### Entity: User
id : string (PK)
email : string

#### Entity: Post
id : string (PK)
userId : string (FK)
title : string
`;
            const result = await generator.generate('erd', content, mockContext);
            expect(result).not.toBeNull();
            expect(result.content).toContain('erDiagram');
            expect(result.content).toContain('User {');
            expect(result.content).toContain('Post {');
            expect(result.content).toContain('User ||--o{ Post : "owns"');
            expect(result.content).toContain('string id PK');
        });
        it('should return null if no entities found', async () => {
            const content = 'No entities here';
            const result = await generator.generate('erd', content, mockContext);
            expect(result).toBeNull();
        });
    });
    describe('Sequence Diagram Generation', () => {
        it('should extract flows from tables and generate Sequence Diagram', async () => {
            const content = `
### API Sequence
| From | To | Message |
|------|----|---------|
| Client| Auth| login(user, pass) |
| Auth  | DB  | findUser(email) |
| DB    | Auth| user_data |
| Auth  | Client| JWT_Token (response) |
`;
            const result = await generator.generate('sequence', content, mockContext);
            expect(result).not.toBeNull();
            expect(result.content).toContain('sequenceDiagram');
            expect(result.content).toContain('Client->>Auth: login(user, pass)');
            expect(result.content).toContain('Auth-->>Client: JWT_Token (response)');
        });
        it('should extract flows from text pattern "A -> B: msg"', async () => {
            const content = `
### Flow
User -> Server: request
Server -> DB: query
DB --> Server: data
Server --> User: response
`;
            const result = await generator.generate('sequence', content, mockContext);
            expect(result).not.toBeNull();
            expect(result.content).toContain('User->>Server: request');
            expect(result.content).toContain('DB-->>Server: data');
        });
    });
    describe('Flowchart Generation', () => {
        it('should extract steps from tables and generate Flowchart', async () => {
            const content = `
### Logic Flow
| ID | Label | Type | Next |
|----|-------|------|------|
| start | Start | Terminal | check_auth |
| check_auth | Authenticated? | Decision | dashboard(yes), login(no) |
| login | Login Page | Process | check_auth |
| dashboard | Dashboard | Terminal | - |
`;
            const result = await generator.generate('flowchart', content, mockContext);
            expect(result).not.toBeNull();
            expect(result.content).toContain('flowchart TD');
            expect(result.content).toContain('start(["Start"])');
            expect(result.content).toContain('check_auth{"Authenticated?"}');
            expect(result.content).toContain('check_auth -- "yes" --> dashboard');
        });
        it('should extract steps from list format', async () => {
            const content = `
1. [step1] Initialize: Prepare system (next: step2)
2. [step2] Check config: Is valid? (next: step3)
3. [step3] Run: Execute main loop
`;
            const result = await generator.generate('flowchart', content, mockContext);
            expect(result).not.toBeNull();
            expect(result.content).toContain('step1["Initialize"]');
            expect(result.content).toContain('step1 --> step2');
        });
    });
    describe('Class Diagram Generation', () => {
        it('should extract classes and generate Class Diagram', async () => {
            const content = `
#### Class: UserService
+getUser(id: string): User
+saveUser(user: User): void
-validate(user: User): boolean

#### Class: AdminService extends UserService
+deleteUser(id: string): void
`;
            const result = await generator.generate('classDiagram', content, mockContext);
            expect(result).not.toBeNull();
            expect(result.content).toContain('classDiagram');
            expect(result.content).toContain('class UserService {');
            expect(result.content).toContain('+getUser(id: string) User');
            expect(result.content).toContain('UserService <|-- AdminService');
        });
    });
    describe('State Diagram Generation', () => {
        it('should extract states and generate State Diagram', async () => {
            const content = `
### Lifecycle States
| From State | Event | To State |
|------------|-------|----------|
| [*]        | init  | Created  |
| Created    | start | Running  |
| Running    | pause | Paused   |
| Paused     | resume| Running  |
| Running    | stop  | [*]      |
`;
            const result = await generator.generate('stateDiagram', content, mockContext);
            expect(result).not.toBeNull();
            expect(result.content).toContain('stateDiagram-v2');
            expect(result.content).toContain('[*] --> Created');
            expect(result.content).toContain('Running --> Paused: pause');
        });
        it('should handle multiple transitions and state labels', async () => {
            const content = `
### State machine
| From State | Event | To State |
|------------|-------|----------|
| Idle       | start | Active   |
| Active     | stop  | Idle     |
| Active     | error | Failed   |
| Failed     | reset | Idle     |
`;
            const result = await generator.generate('stateDiagram', content, mockContext);
            expect(result.content).toContain('Active --> Idle: stop');
            expect(result.content).toContain('Active --> Failed: error');
        });
    });
    describe('C4 Diagram Generation', () => {
        it('should extract components and generate C4 Context Diagram', async () => {
            const content = `
### Architecture
| ID | Name | Type | Description |
|----|------|------|-------------|
| user | Customer | Person | A customer of the bank |
| banking_system | Internet Banking | System | Allows customers to view info |
| mainframe | Mainframe | External | Stores all core info |

### Relations
| From | To | Label |
|------|----|-------|
| user | banking_system | Views account |
| banking_system | mainframe | Fetches data |
`;
            const result = await generator.generate('c4', content, mockContext);
            expect(result).not.toBeNull();
            expect(result.content).toContain('C4Context');
            expect(result.content).toContain('Person(user, "Customer", "A customer of the bank")');
            expect(result.content).toContain('System(banking_system, "Internet Banking", "Allows customers to view info")');
            expect(result.content).toContain('System_Ext(mainframe, "Mainframe", "Stores all core info")');
            expect(result.content).toContain('Rel(user, banking_system, "Views account")');
        });
    });
    describe('Utilities', () => {
        it('should validate mermaid syntax correctly', () => {
            expect(generator.validateMermaid('graph TD\nA-->B')).toBe(true);
            expect(generator.validateMermaid('erDiagram\nUSER ||--o{ POST : owns')).toBe(true);
            expect(generator.validateMermaid('invalid content')).toBe(false);
            expect(generator.validateMermaid('')).toBe(false);
        });
        it('should handle empty or null content gracefully', async () => {
            const result = await generator.generate('erd', '', mockContext);
            expect(result).toBeNull();
        });
    });
});
//# sourceMappingURL=diagram-generator.test.js.map