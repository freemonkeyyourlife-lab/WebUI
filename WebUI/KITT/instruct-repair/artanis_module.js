const fs = require('fs');
const path = require('path');
const auditHelper = require('./audit_helper');
const requestsStore = require('./requests_store');
const { capabilityRouter } = require('./capability_router');

const DATA_DIR = path.join(__dirname, 'data');
const PERSONAS_FILE = path.join(DATA_DIR, 'artanis_personas.json');
const PLANS_FILE = path.join(DATA_DIR, 'artanis_plans.json');

function ensureFiles() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(PERSONAS_FILE)) {
    const seed = [
      {
        id: 'persona-frank-buddy',
        name: 'Frankenstein Buddy',
        role: 'Autonomous Digital Buddy & Persona Model',
        traits: ['analytical', 'resilient', 'protective', 'direct', 'humorous'],
        style: 'friendly-authoritative',
        voicePreset: 'KITT Primary',
        source: 'Repo heritage (Master-Overview.md / GitHiub.txt)',
        createdAt: new Date().toISOString()
      }
    ];
    fs.writeFileSync(PERSONAS_FILE, JSON.stringify(seed, null, 2));
  }
  if (!fs.existsSync(PLANS_FILE)) {
    fs.writeFileSync(PLANS_FILE, JSON.stringify([], null, 2));
  }
}

class ArtanisModule {
  constructor() {
    ensureFiles();
  }

  getStatus() {
    ensureFiles();
    const personas = this.listPersonas();
    const plans = this.listPlans();
    return {
      agentId: 'artanis',
      role: 'planner & buddy-modeler',
      title: 'Artanis Autonomous Planner & Digital Buddy Engine',
      status: 'active',
      personasCount: personas.length,
      plansCount: plans.length,
      capabilities: [
        'plan_decomposition',
        'persona_extractor',
        'buddy_synthesizer',
        'model_trainer'
      ],
      mode: 'local-first'
    };
  }

  listPersonas() {
    ensureFiles();
    try {
      return JSON.parse(fs.readFileSync(PERSONAS_FILE, 'utf8'));
    } catch {
      return [];
    }
  }

  savePersona(persona) {
    ensureFiles();
    const list = this.listPersonas();
    const entry = {
      id: persona.id || `persona-${Date.now()}`,
      name: persona.name || 'Unnamed Buddy',
      role: persona.role || 'Companion / Assistant',
      traits: Array.isArray(persona.traits) ? persona.traits : ['adaptive', 'reliable'],
      style: persona.style || 'mentor-buddy',
      voicePreset: persona.voicePreset || 'KITT Primary',
      memoryAnchor: persona.memoryAnchor || 'local-mi',
      createdAt: new Date().toISOString()
    };
    list.push(entry);
    fs.writeFileSync(PERSONAS_FILE, JSON.stringify(list, null, 2));
    auditHelper.logAction('artanis_persona_saved', 'artanis', { personaId: entry.id, name: entry.name });
    return entry;
  }

  listPlans() {
    ensureFiles();
    try {
      return JSON.parse(fs.readFileSync(PLANS_FILE, 'utf8'));
    } catch {
      return [];
    }
  }

  /**
   * Decomposes a high-level goal into ordered tasks distributed across specialized agents.
   */
  decomposeGoal(goal, context = {}) {
    ensureFiles();
    const text = String(goal || '').trim();
    const planId = `plan-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    // Build decomposition steps tailored to the goal text
    const steps = [];
    const lower = text.toLowerCase();

    // Step 1: Ingestion & Analysis (Listener)
    steps.push({
      step: 1,
      agentId: 'listener',
      capability: 'parse_instructions',
      title: 'Analyze and parse instruction syntax',
      params: { text },
      requiresApproval: false
    });

    // Step 2: Environmental or System Sensing (Observer)
    if (lower.includes('scan') || lower.includes('network') || lower.includes('watch') || lower.includes('file')) {
      steps.push({
        step: 2,
        agentId: 'observer',
        capability: lower.includes('network') ? 'network_scan' : 'monitor_filesystem',
        title: 'Inspect local environment boundary and files',
        params: { path: context.path || '.' },
        requiresApproval: false
      });
    } else {
      steps.push({
        step: 2,
        agentId: 'observer',
        capability: 'inspect_environment',
        title: 'Verify system resources and isolation boundaries',
        params: {},
        requiresApproval: false
      });
    }

    // Step 3: Core Coordination or Execution (KITT)
    const isSensitive = lower.includes('reboot') || lower.includes('execute') || lower.includes('delete') || lower.includes('clean');
    steps.push({
      step: 3,
      agentId: 'kitt',
      capability: isSensitive ? 'execute_system_command' : 'orchestrate_agents',
      title: isSensitive ? 'Execute sensitive system operation' : 'Synchronize agent execution state',
      params: isSensitive ? { command: text } : { goal: text },
      requiresApproval: isSensitive
    });

    // Step 4: Digital Buddy Persona Formulation (Artanis)
    if (lower.includes('buddy') || lower.includes('persona') || lower.includes('clone') || lower.includes('model')) {
      steps.push({
        step: 4,
        agentId: 'artanis',
        capability: 'persona_extractor',
        title: 'Extract digital buddy persona traits',
        params: { text, name: context.buddyName || 'KITT Companion' },
        requiresApproval: false
      });
    }

    // Step 5: Audio feedback / local speech output (Talker)
    steps.push({
      step: steps.length + 1,
      agentId: 'talker',
      capability: 'speak_local',
      title: 'Emit local speech completion notification',
      params: { text: `Plan execution prepared: ${text.slice(0, 35)}` },
      requiresApproval: false
    });

    const plan = {
      planId,
      goal: text,
      status: 'composed',
      createdAt: new Date().toISOString(),
      stepCount: steps.length,
      requiresApproval: steps.some((s) => s.requiresApproval),
      steps
    };

    const plans = this.listPlans();
    plans.unshift(plan);
    fs.writeFileSync(PLANS_FILE, JSON.stringify(plans, null, 2));

    auditHelper.logAction('artanis_plan_decomposed', 'artanis', {
      planId,
      goal: text,
      stepCount: steps.length,
      requiresApproval: plan.requiresApproval
    });

    return plan;
  }

  /**
   * Submits all steps of a plan into the K.I.T.T. approval gate / task runner.
   */
  async submitPlanToGate(planId, actor = 'chief') {
    ensureFiles();
    const plans = this.listPlans();
    const plan = plans.find((p) => p.planId === planId);
    if (!plan) throw new Error('Plan not found: ' + planId);

    const generatedTasks = [];

    for (const step of plan.steps) {
      const task = requestsStore.createTask({
        title: `[Artanis Plan: ${plan.goal.slice(0, 40)}] Step ${step.step}: ${step.title}`,
        sourceType: 'artanis_plan',
        agentId: step.agentId,
        command: step.capability,
        capability: step.capability,
        params: step.params,
        text: `Plan Step ${step.step}: ${step.title}`,
        requiresApproval: step.requiresApproval
      });

      generatedTasks.push({
        step: step.step,
        taskId: task.id,
        agentId: step.agentId,
        capability: step.capability,
        requiresApproval: step.requiresApproval,
        status: task.status
      });
    }

    plan.status = 'submitted';
    plan.submittedTasks = generatedTasks;
    fs.writeFileSync(PLANS_FILE, JSON.stringify(plans, null, 2));

    auditHelper.logAction('artanis_plan_submitted_to_gate', actor, {
      planId,
      tasksGenerated: generatedTasks.length
    });

    return {
      planId,
      status: 'submitted',
      tasksGenerated: generatedTasks.length,
      tasks: generatedTasks
    };
  }
}

module.exports = new ArtanisModule();
