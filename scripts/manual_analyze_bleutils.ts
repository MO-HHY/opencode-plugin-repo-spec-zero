
import { RepoSpecZeroOrchestrator } from '../src/agents/core/orchestrator.agent.js';
import { SpecZeroDetectionSkill } from '../src/skills/spec-zero-detection.skill.js';
import { GitSkill } from '../src/skills/git.skill.js';
import { TaskSpecAgent } from '../src/agents/core/task-spec.agent.js';
import { NativeLLMSkill } from '../src/skills/native-llm.skill.js';
import { BuildRepoTreeSkill } from '../src/skills/build-repo-tree.skill.js';
import type { SkillExecutor } from '../src/agents/base.js';

// Sub-Agents (Import all)
import { OverviewAgent } from '../src/agents/spec-zero/core/overview.agent.js';
import { ModuleAgent } from '../src/agents/spec-zero/core/module.agent.js';
import { EntityAgent } from '../src/agents/spec-zero/core/entity.agent.js';
import { DbAgent } from '../src/agents/spec-zero/data/db.agent.js';
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

import * as fs from 'fs';
import * as path from 'path';

// Local Mock Client
const mockClient = {
    llm: {
        chat: async () => {
            // Return real-looking dummy content so we can see files being written
            return { content: "# Analysis Results\n\nAnalyzed successfully by SpecZero Swarm." };
        }
    },
    tui: {
        showToast: async (params: any) => {
            console.log(`[TOAST] ${params.body.variant.toUpperCase()}: ${params.body.message}`);
        }
    }
};

async function main() {
    console.log("🚀 Starting Manual Analysis on bleutils-js...");

    const targetPath = '/Users/mohamedouassif/Documents/GitHub/Github_MO-HHY_WorkDirectory/repos/bleutils-js';

    // 1. Initialize Skills
    const detectionSkill = new SpecZeroDetectionSkill();
    const treeSkill = new BuildRepoTreeSkill();
    // We override GitSkill to NOT clone, just point to local dir if possible, 
    // BUT the Orchestrator logic forces clone if `repoUrl` is passed.
    // If we pass `repoUrl` as the local path, GitSkill might try to clone it to temp.
    // Let's assume we want to run detection on the existing dir.

    // However, the orchestrator `process` method expects `repoUrl` and CLONES IT.
    // To support local analysis without cloning, we might need to modify the Orchestrator 
    // OR just let it "clone" the local path (git clone /abs/path works).
    // Let's try passing the local absolute path as repoUrl.

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
    const orchestrator = new RepoSpecZeroOrchestrator(
        detectionSkill,
        gitSkill,
        taskSpecAgent
    );

    // 3. Register All Sub-Agents
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
        agent.registerSkill('repo_spec_zero_write_output', { execute: async () => ({ success: true }) });
        orchestrator.registerSubAgent(agent);
    });

    orchestrator.registerSkill('repo_spec_zero_build_tree', treeExecutor);

    // 4. Run Analysis
    const context = {
        client: mockClient,
        params: {
            repoUrl: targetPath // Treating local path as Git URL
        }
    };

    try {
        const result = await orchestrator.process(context as any);
        console.log("✅ Analysis Result:", JSON.stringify(result, null, 2));
    } catch (e) {
        console.error("❌ Analysis Failed:", e);
    }
}

main().catch(console.error);
