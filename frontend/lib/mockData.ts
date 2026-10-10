/**
 * Daily Path — Mock Data Source
 * Matches the JSON schema and API specifications.
 * Goals and Future Tasks are completely separate.
 * Each daily to-do links to exactly one goal OR one future task.
 */

import {
  User,
  Goal,
  FutureTask,
  DailyPlanResponse,
  LinkedEntity,
  GoalTodoHistoryItem,
  GoalNote,
} from './types';

// Mock current user
export const initialUser: User = {
  id: 'usr_101',
  email: 'alex@example.com',
  name: 'Alex Rivera',
  timezone: 'America/Toronto',
  hoursPerDay: 4,
  createdAt: '2026-09-15T09:00:00Z',
};

// Initial user goals with completedTodoCount
export const initialGoals: Goal[] = [
  {
    id: 'g1',
    userId: 'usr_101',
    title: 'Maintain 3.8+ GPA this semester',
    details: 'Stay ahead on lab writeups and review math concepts weekly.',
    category: 'learning',
    status: 'active',
    completedTodoCount: 14,
    createdAt: '2026-09-16T10:00:00Z',
  },
  {
    id: 'g2',
    userId: 'usr_101',
    title: 'Run a 10k in under 50 minutes',
    details: '3 runs per week, mix of tempo and easy recovery runs.',
    category: 'fitness',
    status: 'active',
    completedTodoCount: 8,
    createdAt: '2026-09-18T14:30:00Z',
  },
  {
    id: 'g3',
    userId: 'usr_101',
    title: 'Prepare Software Engineering portfolio',
    details: 'Finish modern full-stack web project and polish resume.',
    category: 'career',
    status: 'active',
    completedTodoCount: 11,
    createdAt: '2026-09-20T11:15:00Z',
  },
  {
    id: 'g4',
    userId: 'usr_101',
    title: 'Improve sleep consistency',
    details: 'Wind down by 10:30 PM, no screens 30 mins before bed.',
    category: 'health',
    status: 'paused',
    completedTodoCount: 6,
    createdAt: '2026-09-22T08:00:00Z',
  },
];

// Initial future tasks with hoursDone, size, and estimateSource (no goal links)
export const initialFutureTasks: FutureTask[] = [
  {
    id: 'ft3',
    userId: 'usr_101',
    title: 'Biology lab report',
    type: 'assignment',
    dueDate: '2026-10-13',
    weight: 15,
    estimatedHours: 6,
    hoursDone: 2.5,
    size: 'medium',
    estimateSource: 'user',
    materials: 'Lab manual section 2, spectrophotometer data spreadsheet',
    status: 'pending',
    createdAt: '2026-10-01T12:00:00Z',
  },
  {
    id: 'ft1',
    userId: 'usr_101',
    title: 'Math midterm',
    type: 'exam',
    dueDate: '2026-10-15',
    weight: 25,
    estimatedHours: 10,
    hoursDone: 4,
    size: 'large',
    estimateSource: 'user',
    materials: 'Chapters 3 to 6, focus on derivatives and curve sketching',
    status: 'pending',
    createdAt: '2026-10-02T09:00:00Z',
  },
  {
    id: 'ft9',
    userId: 'usr_101',
    title: '8k weekend endurance progression run',
    type: 'other',
    dueDate: '2026-10-18',
    estimatedHours: 1.5,
    hoursDone: 0.5,
    size: 'medium',
    estimateSource: 'size',
    materials: 'Negative split target',
    status: 'pending',
    createdAt: '2026-10-03T10:00:00Z',
  },
  {
    id: 'ft6',
    userId: 'usr_101',
    title: 'Portfolio design system & wireframes',
    type: 'project',
    dueDate: '2026-10-20',
    weight: 10,
    estimatedHours: 8,
    hoursDone: 8,
    size: 'medium',
    estimateSource: 'ai',
    materials: 'Figma layout + component hierarchy',
    status: 'done',
    completedAt: '2026-10-06T16:30:00Z',
    createdAt: '2026-10-03T14:00:00Z',
  },
  {
    id: 'ft2',
    userId: 'usr_101',
    title: 'Computer Science algorithms project',
    type: 'project',
    dueDate: '2026-10-24',
    weight: 20,
    estimatedHours: 14,
    hoursDone: 6,
    size: 'huge',
    estimateSource: 'user',
    materials: 'Graph traversal benchmark & writeup',
    status: 'pending',
    createdAt: '2026-10-04T15:00:00Z',
  },
  {
    id: 'ft4',
    userId: 'usr_101',
    title: 'Economics policy critique paper',
    type: 'assignment',
    dueDate: '2026-11-02',
    weight: 10,
    estimatedHours: 5,
    hoursDone: 1.5,
    size: 'medium',
    estimateSource: 'size',
    materials: 'Macroeconomic fiscal stimulus reading packet',
    status: 'pending',
    createdAt: '2026-10-05T18:00:00Z',
  },
  {
    id: 'ft10',
    userId: 'usr_101',
    title: 'Guest lecture seminar reading',
    type: 'other',
    dueDate: '2026-11-08',
    hoursDone: 2.5,
    // estimatedHours intentionally omitted to demonstrate "2.5h done" with no bar
    size: 'small',
    materials: 'Key speaker reading paper on distributed consensus',
    status: 'pending',
    createdAt: '2026-10-06T10:00:00Z',
  },
  {
    id: 'ft5',
    userId: 'usr_101',
    title: 'Biology pre-lab quiz & methodology notes',
    type: 'assignment',
    dueDate: '2026-10-06',
    weight: 5,
    estimatedHours: 2,
    hoursDone: 2,
    size: 'small',
    estimateSource: 'user',
    materials: 'Online module 1 quiz submission',
    status: 'done',
    createdAt: '2026-09-28T10:00:00Z',
  },
  {
    id: 'ft7',
    userId: 'usr_101',
    title: '5k baseline time-trial run',
    type: 'other',
    dueDate: '2026-10-07',
    estimatedHours: 1,
    hoursDone: 1,
    size: 'small',
    estimateSource: 'size',
    materials: 'Track interval pace benchmark (completed in 24:10)',
    status: 'done',
    createdAt: '2026-09-29T08:00:00Z',
  },
  {
    id: 'ft8',
    userId: 'usr_101',
    title: 'Track interval session (6 x 400m repeats)',
    type: 'other',
    dueDate: '2026-10-10',
    estimatedHours: 1,
    hoursDone: 1,
    size: 'small',
    estimateSource: 'user',
    materials: 'Speed endurance maintenance',
    status: 'done',
    createdAt: '2026-10-01T07:30:00Z',
  },
];

/**
 * Full task definitions for today's daily plan.
 * Each daily to-do links to EXACTLY ONE thing: one goal OR one future task.
 */
export const allDailyTasksDefinition: Record<
  string,
  {
    title: string;
    description: string;
    reason: string;
    linkedTo: LinkedEntity;
    estimatedMinutes: number;
  }
> = {
  a1: {
    title: 'Write the intro paragraph of your biology lab report',
    description: 'Use your lab notes from section 2. Aim for 150 words.',
    reason: 'The report is due in 4 days and is worth 15%.',
    linkedTo: { type: 'futureTask', id: 'ft3', title: 'Biology lab report' },
    estimatedMinutes: 25,
  },
  a2: {
    title: 'Do 10 practice questions from chapter 5',
    description: 'Focus on the questions you got wrong last time.',
    reason: 'Your math exam is in 6 days.',
    linkedTo: { type: 'futureTask', id: 'ft1', title: 'Math midterm' },
    estimatedMinutes: 30,
  },
  a3: {
    title: 'Review 3 derivative shortcut proofs',
    description: 'Work through product and chain rule edge cases in notebook.',
    reason: 'Helps maintain consistent subject mastery.',
    linkedTo: {
      type: 'goal',
      id: 'g1',
      title: 'Maintain 3.8+ GPA this semester',
    },
    estimatedMinutes: 20,
  },
  a4: {
    title: 'Complete 25-minute recovery cadence run',
    description: 'Keep heart rate in zone 2 with light stretching after.',
    reason: 'Builds aerobic endurance without high training fatigue.',
    linkedTo: {
      type: 'goal',
      id: 'g2',
      title: 'Run a 10k in under 50 minutes',
    },
    estimatedMinutes: 25,
  },
};

/**
 * Bonus task definitions, handed out one per "Get bonus task" request
 * (bonus_1 on the first request, bonus_2 on the second, bonus_3 on the third).
 * Each one links to a goal, since bonus time is for extra goal progress.
 */
export const bonusTaskDefinitions: Record<
  string,
  {
    title: string;
    description: string;
    reason: string;
    linkedTo: LinkedEntity;
    estimatedMinutes: number;
  }
> = {
  bonus_1: {
    title: 'Polish one section of your portfolio README',
    description: 'Pick the setup or architecture section and tighten the wording.',
    reason: 'Small, steady polish keeps your portfolio recruiter-ready.',
    linkedTo: {
      type: 'goal',
      id: 'g3',
      title: 'Prepare Software Engineering portfolio',
    },
    estimatedMinutes: 10,
  },
  bonus_2: {
    title: "Make 5 flashcards from today's math practice",
    description: 'Turn the questions you found hardest into quick recall cards.',
    reason: 'Reviewing mistakes the same day helps them stick.',
    linkedTo: {
      type: 'goal',
      id: 'g1',
      title: 'Maintain 3.8+ GPA this semester',
    },
    estimatedMinutes: 10,
  },
  bonus_3: {
    title: 'Do a 10-minute mobility stretch',
    description: 'Hip flexors, calves and hamstrings. Go slow and breathe.',
    reason: 'Mobility work helps your legs recover between runs.',
    linkedTo: {
      type: 'goal',
      id: 'g2',
      title: 'Run a 10k in under 50 minutes',
    },
    estimatedMinutes: 10,
  },
};

/**
 * Initial GET /api/today payload:
 * - Completed tasks have estimatedMinutes and timeSpentSeconds
 * - Unfinished tasks MUST NOT have estimatedMinutes
 * - Each daily to-do has linkedTo (exactly one goal OR one future task)
 */
export const initialDailyPlanResponse: DailyPlanResponse = {
  date: '2026-10-09',
  totalTasks: 4,
  completedTasks: 1,
  // 2.5h = 150 min; today's 4 tasks take ~107 min, leaving ~43 min of bonus time
  hoursAvailableToday: 2.5,
  bonusRequestsToday: 0,
  tasks: [
    {
      id: 'a1',
      order: 1,
      title: 'Write the intro paragraph of your biology lab report',
      description: 'Use your lab notes from section 2. Aim for 150 words.',
      reason: 'The report is due in 4 days and is worth 15%.',
      linkedTo: { type: 'futureTask', id: 'ft3', title: 'Biology lab report' },
      estimatedMinutes: 25,
      timeSpentSeconds: 1920,
      startedAt: '2026-10-09T08:30:00Z',
      completedAt: '2026-10-09T09:02:00Z',
      isCompleted: true,
      isLocked: false,
    },
    {
      id: 'a2',
      order: 2,
      title: 'Do 10 practice questions from chapter 5',
      description: 'Focus on the questions you got wrong last time.',
      reason: 'Your math exam is in 6 days.',
      linkedTo: { type: 'futureTask', id: 'ft1', title: 'Math midterm' },
      isCompleted: false,
      isLocked: false,
      // Note: estimatedMinutes is intentionally omitted because task is unfinished
    },
    { id: 'a3', order: 3, isLocked: true },
    { id: 'a4', order: 4, isLocked: true },
  ],
};

/**
 * Mock history of completed daily to-dos linked to goals.
 * Contains at least 5 completed to-dos across 3 different dates for goal g1.
 */
export const initialGoalHistory: Record<string, GoalTodoHistoryItem[]> = {
  g1: [
    {
      id: 'h_g1_1',
      goalId: 'g1',
      title: 'Review Organic Chemistry chapter 4 reaction mechanisms',
      description: 'Summarized nucleophilic addition pathways and worked 5 synthesis flashcards.',
      date: '2026-10-08',
      completedAt: '2026-10-08T16:20:00Z',
      timeSpentSeconds: 1320, // 22 min
    },
    {
      id: 'h_g1_2',
      goalId: 'g1',
      title: 'Complete Cell Biology pre-lecture quiz',
      description: 'Reviewed mitochondrial transport diagrams and answered online quiz questions.',
      date: '2026-10-08',
      completedAt: '2026-10-08T11:45:00Z',
      timeSpentSeconds: 900, // 15 min
    },
    {
      id: 'h_g1_3',
      goalId: 'g1',
      title: 'Calculus lecture problem set #3 check',
      description: 'Worked out implicit differentiation problems from page 142.',
      date: '2026-10-07',
      completedAt: '2026-10-07T15:10:00Z',
      timeSpentSeconds: 1680, // 28 min
    },
    {
      id: 'h_g1_4',
      goalId: 'g1',
      title: 'Summarize Biology textbook section 2.4 notes',
      description: 'Key takeaways on enzyme substrate binding kinetics.',
      date: '2026-10-07',
      completedAt: '2026-10-07T10:30:00Z',
      timeSpentSeconds: 1200, // 20 min
    },
    {
      id: 'h_g1_5',
      goalId: 'g1',
      title: 'Active recall flashcards for Physics formulas',
      description: 'Reviewed rotational kinematics equations and moment of inertia formulas.',
      date: '2026-10-05',
      completedAt: '2026-10-05T17:05:00Z',
      timeSpentSeconds: 1080, // 18 min
    },
    {
      id: 'h_g1_6',
      goalId: 'g1',
      title: 'Weekly lecture synthesis & question list',
      description: 'Prepared questions for professor office hours on thermodynamics.',
      date: '2026-10-05',
      completedAt: '2026-10-05T13:15:00Z',
      timeSpentSeconds: 1500, // 25 min
    },
  ],
  g2: [
    {
      id: 'h_g2_1',
      goalId: 'g2',
      title: 'Morning 5k tempo run',
      description: 'Maintained 5:10/km pace across rolling campus trail.',
      date: '2026-10-08',
      completedAt: '2026-10-08T07:45:00Z',
      timeSpentSeconds: 1560, // 26 min
    },
    {
      id: 'h_g2_2',
      goalId: 'g2',
      title: 'Leg mobility & core stability routine',
      description: 'Glute bridges, hip flexor stretches, and plank progressions.',
      date: '2026-10-06',
      completedAt: '2026-10-06T18:30:00Z',
      timeSpentSeconds: 960, // 16 min
    },
    {
      id: 'h_g2_3',
      goalId: 'g2',
      title: 'Easy recovery jog (4km)',
      description: 'Kept heart rate below 140 bpm, focusing on cadence.',
      date: '2026-10-04',
      completedAt: '2026-10-04T08:15:00Z',
      timeSpentSeconds: 1440, // 24 min
    },
  ],
  g3: [
    {
      id: 'h_g3_1',
      goalId: 'g3',
      title: 'Refactor REST API route error handling',
      description: 'Added centralized error middleware and validated HTTP responses.',
      date: '2026-10-08',
      completedAt: '2026-10-08T19:00:00Z',
      timeSpentSeconds: 1800, // 30 min
    },
    {
      id: 'h_g3_2',
      goalId: 'g3',
      title: 'Write project README documentation',
      description: 'Documented architecture diagrams, tech stack choices, and local setup steps.',
      date: '2026-10-06',
      completedAt: '2026-10-06T14:20:00Z',
      timeSpentSeconds: 2100, // 35 min
    },
  ],
  g4: [
    {
      id: 'h_g4_1',
      goalId: 'g4',
      title: 'Evening screen shutdown at 10:15 PM',
      description: 'Read 20 pages of fiction book before sleep.',
      date: '2026-10-07',
      completedAt: '2026-10-07T22:20:00Z',
      timeSpentSeconds: 1200,
    },
  ],
};

/**
 * Text-based reflections and strategic notes specifically linked to goals
 */
export const initialGoalNotes: Record<string, GoalNote[]> = {
  g1: [
    {
      id: 'n_g1_1',
      goalId: 'g1',
      content:
        'Reviewed organic chemistry reaction pathways this morning. Breaking study sessions into 25-minute sprints before lecture makes retaining synthesis steps significantly easier than cramming the night before.',
      createdAt: '2026-10-08T17:30:00Z',
    },
    {
      id: 'n_g1_2',
      goalId: 'g1',
      content:
        'Midterm prep insight: when doing calculus derivatives, write down the chain rule substitutions explicitly on scratch paper first to avoid sign errors.',
      createdAt: '2026-10-06T14:15:00Z',
    },
    {
      id: 'n_g1_3',
      goalId: 'g1',
      content:
        'Biochem professor mentioned in office hours that spectrophotometer calibration drift is a frequent lab report deduction. Make sure to double-check blank standard readings.',
      createdAt: '2026-10-03T11:00:00Z',
    },
  ],
  g2: [
    {
      id: 'n_g2_1',
      goalId: 'g2',
      content:
        'Cadence felt smoother after warming up with dynamic lunges. Keeping heart rate strictly in zone 2 during recovery runs is helping legs recover faster between hard interval sessions.',
      createdAt: '2026-10-07T08:30:00Z',
    },
    {
      id: 'n_g2_2',
      goalId: 'g2',
      content:
        'Hydration tip: drink electrolytes 1 hour before morning long runs to avoid early fatigue on hills.',
      createdAt: '2026-10-02T09:10:00Z',
    },
  ],
  g3: [
    {
      id: 'n_g3_1',
      goalId: 'g3',
      content:
        'Simplifying project architecture into clean modules rather than over-engineering makes the README much easier for engineering recruiters to skim and understand.',
      createdAt: '2026-10-08T20:15:00Z',
    },
  ],
  g4: [
    {
      id: 'n_g4_1',
      goalId: 'g4',
      content:
        'Putting the phone across the room 30 minutes before bed cut sleep onset time from 40 mins down to 15 mins.',
      createdAt: '2026-10-07T22:45:00Z',
    },
  ],
};
