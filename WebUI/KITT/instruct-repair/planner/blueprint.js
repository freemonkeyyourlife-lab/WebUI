#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function createBlueprintFromRequest(input) {
  const issue = (input.issueSummary || input.requestText || input.link || '').trim();
  const risk = /security|auth|key|secret|api/.test(issue.toLowerCase()) ? 'high' : 'medium';

  return {
    taskSummary: issue || 'Unspecified request',
    impactedModules: ['K.I.T.T. core', 'Skill Registry', 'Target module'],
    riskLevel: risk,
    validationSteps: [
      'Review affected files and logic',
      'Run the smallest relevant smoke test',
      'Verify no unintended module changes',
      'Confirm approval gate has been passed'
    ],
    rollbackPlan: [
      'Revert patch to the last known-good state',
      'Restore any stored config or artifact',
      'Re-run smoke validation'
    ],
    approvalRequired: true,
    generatedAt: new Date().toISOString()
  };
}

const args = process.argv.slice(2);
const raw = args[0] ? fs.readFileSync(args[0], 'utf8') : JSON.stringify({
  issueSummary: 'Build K.I.T.T. safe self-extension pipeline',
  requestText: 'Add an approval gated skill registry and repair plan.'
});

const payload = JSON.parse(raw);
console.log(JSON.stringify(createBlueprintFromRequest(payload), null, 2));
