import type { UiGameViewModel } from '../types/uiViewModel'

/**
 * Presentation fixtures only. These values are placeholders for UI work,
 * not approved balance, NASA facts, crew rules, or official game state.
 */
export const mockGameViewModel: UiGameViewModel = {
  day: 1,
  totalDays: 8,
  cycle: 'morning',
  cycleLabel: 'Morning',
  cycles: [
    { name: 'morning', label: 'Morning', status: 'current' },
    { name: 'afternoon', label: 'Afternoon', status: 'upcoming' },
    { name: 'night', label: 'Night', status: 'upcoming' },
  ],
  cycleCooldown: {
    status: 'ready',
    label: 'Next cycle available',
    progressPercent: 100,
    detail: 'Preview fixture only. The engine supplies the live cooldown state.',
  },
  cards: [
    {
      id: 'MOCK-R-001',
      title: 'Survey nearby terrain',
      description: 'Collect a first-pass overview of the outpost surroundings.',
      category: 'research',
      tradeoff: 'Illustrative trade-off text; replace with approved card content.',
      crewLimit: 1,
    },
    {
      id: 'MOCK-R-002',
      title: 'Inspect water-ice signals',
      description: 'Review a placeholder research task for the morning cycle.',
      category: 'research',
      tradeoff: 'Illustrative trade-off text; no numerical game effect is implied.',
      crewLimit: 1,
    },
    {
      id: 'MOCK-R-003',
      title: 'Analyze surface samples',
      description: 'Prepare a sample-analysis task for the mission hand.',
      category: 'research',
      tradeoff: 'Illustrative trade-off text; replace from Paran’s approved catalog.',
      crewLimit: 1,
    },
  ],
  crew: [
    { id: 'crew-mechanical', name: 'Crew 01', role: 'Mechanical Engineer', availability: 'available' },
    { id: 'crew-electrical', name: 'Crew 02', role: 'Electrical Engineer', availability: 'available' },
    { id: 'crew-medic', name: 'Crew 03', role: 'Medic', availability: 'available' },
    {
      id: 'crew-botanist',
      name: 'Crew 04',
      role: 'Botanist',
      availability: 'unavailable',
      unavailableReason: 'Unavailable status supplied by mock crew state.',
    },
  ],
  resources: [
    { id: 'life-support', label: 'Life Support', value: 80, max: 100, delta: 0 },
    { id: 'shielding', label: 'Shielding', value: 80, max: 100, delta: 0 },
    { id: 'power', label: 'Power', value: 80, max: 100, delta: 0 },
    { id: 'food', label: 'Food', value: 80, max: 100, delta: 0 },
  ],
  resourceDeltas: [
    { id: 'life-support', label: 'Life Support', delta: 0 },
    { id: 'shielding', label: 'Shielding', delta: 0 },
    { id: 'power', label: 'Power', delta: 0 },
    { id: 'food', label: 'Food', delta: 0 },
  ],
  sceneStatus: 'placeholder',
  noeMessage: 'Your mission choices will appear here. Once the cycle is complete, we can review the day together.',
  nasaFact: {
    id: 'nasa-fact-pending',
    title: 'Verified NASA fact pending',
    summary: 'This placeholder will be replaced with a reviewed fact from the NASA handoff pack.',
    sourceTitle: 'Source details pending Paran’s validated fact pack',
    sourceUrl: undefined,
    dateAccessed: undefined,
    mode: 'archived',
  },
  journalEntries: [
    {
      id: 'journal-morning-mock',
      cycle: 'morning',
      cycleLabel: 'Morning',
      decisionTitle: 'Example morning decision',
      crewLabels: ['Crew 01'],
      resourceDeltas: [{ id: 'power', label: 'Power', delta: 0 }],
    },
    {
      id: 'journal-afternoon-mock',
      cycle: 'afternoon',
      cycleLabel: 'Afternoon',
      decisionTitle: 'Example afternoon decision',
      crewLabels: ['Crew 02'],
      resourceDeltas: [{ id: 'life-support', label: 'Life Support', delta: 0 }],
    },
    {
      id: 'journal-night-mock',
      cycle: 'night',
      cycleLabel: 'Night',
      decisionTitle: 'Example night decision',
      crewLabels: ['Crew 03'],
      resourceDeltas: [{ id: 'food', label: 'Food', delta: 0 }],
    },
  ],
  daySummary: {
    day: 1,
    decisions: [
      'Example morning research choice',
      'Example afternoon build/repair choice',
      'Example night operations choice',
    ],
    resourceDeltas: [
      { id: 'life-support', label: 'Life Support', delta: 0 },
      { id: 'shielding', label: 'Shielding', delta: 0 },
      { id: 'power', label: 'Power', delta: 0 },
      { id: 'food', label: 'Food', delta: 0 },
    ],
    note: 'Preview data only. The official engine will provide the actual daily summary.',
  },
  timedEvent: {
    id: 'mock-outpost-event',
    title: 'Outpost systems alert',
    description: 'This scripted event is a UI preview. Its final narrative and outcomes will come from the approved event fixture.',
    durationSeconds: 30,
    options: [
      { id: 'diagnostic', title: 'Run local diagnostic', description: 'Choose the first example response.' },
      { id: 'standby', title: 'Review standby systems', description: 'Choose the second example response.' },
      { id: 'wait', title: 'Wait for ground guidance', description: 'Choose the third example response.' },
    ],
    timeoutChoiceId: 'wait',
  },
}
