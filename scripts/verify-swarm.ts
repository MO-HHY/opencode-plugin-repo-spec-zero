
import { RepoSpecZeroOrchestrator } from '../src/agents/core/orchestrator.agent.js';
import { SpecZeroDetectionSkill } from '../src/skills/spec-zero-detection.skill.js';
import { GitSkill } from '../src/skills/git.skill.js';
import { TaskSpecAgent } from '../src/agents/core/task-spec.agent.js';
import { NativeLLMSkill } from '../src/skills/native-llm.skill.js';
import { OutputWriterSkill } from '../src/skills/output-writer.skill.js';
import { BuildRepoTreeSkill } from '../src/skills/build-repo-tree.skill.js';
import type { SkillExecutor } from '../src/agents/base.js';

// Sub-Agents
import { OverviewAgent } from '../src/agents/spec-zero/core/overview.agent.js';
import { ModuleAgent } from '../src/agents/spec-zero/core/module.agent.js';
import { EntityAgent } from '../src/agents/spec-zero/core/entity.agent.js';
import { DbAgent } from '../src/agents/spec-zero/data/db.agent.js';
// ... importing a few representatives to test execution flow
// Importing all is better but let's start with a subset if the list is long, 
// OR import all to test full topological sort.
import { DataMapAgent } from '../src/agents/spec-zero/data/data-map.agent.js';
import { EventAgent } from '../src/agents/spec-zero/data/event.agent.js';
import { ApiAgent } from '../src/agents/spec-zero/integration/api.agent.js';
import { DependencyAgent } from '../src/agents/spec-zero/integration/dependency.agent.js';
import { ServiceDepAgent } from '../src/agents/spec-zero/integration/service-dep.agent.js';
import { AuthAgent } from '../src/agents/spec-zero/security/auth.agent.js';
import { AuthzAgent } from '../src/agents/spec-zero/security/authz.agent.js';
import { SecurityAgent } from '../src/agents/spec-zero/security/security.agent.js';
import { PromptSecAgent } from '../src/agents/spec-zero/security/prompt-sec.agent.js';
import { DeploymentAgent } from '../src/agents/spec-zero/ops/deployment.agent.js';
import { MonitorAgent } from '../src/agents/spec-zero/ops/monitor.agent.js';
import { MlAgent } from '../src/agents/spec-zero/ops/ml.agent.js';
import { FlagAgent } from '../src/agents/spec-zero/ops/flag.agent.js';

// Mock Client
const mockClient = {
    llm: {
        chat: async (params: any) => {
            console.log(`[MockLLM] Processing prompt...`);
            // Return a dummy response to keep agents happy
            return { content: "# Mock Analysis Result\nThis is a test response from the mock native LLM." };
        }
    },
    tui: {
        showToast: async (params: any) => {
            console.log(`[MockToast] ${params.body.variant.toUpperCase()}: ${params.body.message}`);
        }
    }
};

async function main() {
    console.log("Initializing Swarm Verification...");

    // 1. Skills
    const detectionSkill = new SpecZeroDetectionSkill();
    const treeSkill = new BuildRepoTreeSkill();
    const gitSkill = new GitSkill(console);
    const nativeLLMSkill = new NativeLLMSkill(mockClient as any);

    // Executors
    const treeExecutor: SkillExecutor = {
        execute: async (params: any) => {
            const tree = await treeSkill.generateTree(params.repoPath);
            return { success: true, data: tree };
        }
    };

    // 2. Agents
    const taskSpecAgent = new TaskSpecAgent();
    // Inject client into taskSpecAgent via context during process, but here we just instantiate

    const orchestrator = new RepoSpecZeroOrchestrator(
        detectionSkill,
        gitSkill,
        taskSpecAgent
    );

    // 3. Register Sub-Agents
    const specAgents = [
        new OverviewAgent(),
        new ModuleAgent(),
        new EntityAgent(),
        new DbAgent(),
        new DataMapAgent(),
        new EventAgent(),
        new ApiAgent(),
        new DependencyAgent(),
        new ServiceDepAgent(),
        new AuthAgent(),
        new AuthzAgent(),
        new SecurityAgent(),
        new PromptSecAgent(),
        new DeploymentAgent(),
        new MonitorAgent(),
        new MlAgent(),
        new FlagAgent()
    ];

    specAgents.forEach(agent => {
        agent.registerSkill('native_llm', nativeLLMSkill);
        // We mocked file writing in RepoSpecZeroAgent to use fs, so we don't strictly need writer skill here for the test
        // but let's register a dummy one to avoid lookup errors if any
        agent.registerSkill('repo_spec_zero_write_output', { execute: async () => ({ success: true }) });
        orchestrator.registerSubAgent(agent);
    });

    orchestrator.registerSkill('repo_spec_zero_build_tree', treeExecutor);

    // 4. Run Analysis
    const targetRepo = process.cwd(); // Analyze myself
    console.log(`Analyzing: ${targetRepo}`);

    const context = {
        client: mockClient,
        params: {
            repoUrl: 'https://github.com/MO-HHY/opencode-plugin-repo-spec-zero.git', // Dummy URL to trigger clone/update (or we rely on local existence if GitSkill handles it)
            // Ideally we point to a local path or skip cloning if we hack the orchestrator, 
            // but let's let it try to "clone" (gitSkill might fail if URL is dummy, but we passed a real one above in main or we can use the local path).
            // Actually Orchestrator does `git clone`. We might want to pass a "skipClone" param or just let it clone into temp.
            // Let's use the real GitHub URL we just pushed to!
        }
    };

    try {
        const result = await orchestrator.process(context as any);
        console.log("Orchestrator Finished:", result);
    } catch (e) {
        console.error("Orchestrator Failed:", e);
    }
}

main().catch(console.error);
