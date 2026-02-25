export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number; // index
  explanation: string;
}

export interface Task {
  id: string;
  description: string;
  completed: boolean;
  quiz?: Question; // The question generated for this task
  quizTaken?: boolean;
}

export interface DayPlan {
  day: number;
  tasks: Task[];
}

export interface WeekPlan {
  week: number;
  days: DayPlan[];
}

export interface StudyPlan {
  id: string;
  subject: string;
  duration: string;
  weeks: WeekPlan[];
  createdAt: number;
}

export interface Resource {
  id: string;
  title: string;
  type: 'video' | 'article' | 'exercise';
  url: string;
  authority: 'High' | 'Medium';
  description: string;
}

export interface Note {
  id: string;
  title: string;
  subject: string;
  content: string; // Markdown
  tags: string[];
  lastEdited: number;
}

export interface ChatSession {
  id: string;
  title: string;
  fileName?: string;
  documentContext: string; // Extracted text
  messages: {
    id: string;
    role: 'user' | 'model';
    text: string;
    timestamp: number;
  }[];
  createdAt: number;
  lastUpdated: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface UserMemory {
  name: string;
  grade: string;
  goals: string[];
  strengths: string[];
  weaknesses: string[];
  subjectsStudied: string[];
  pomodoroSessions: number;
  totalFocusTime: number; // minutes
  
  // Gamification Stats
  xp: number;
  level: number;
  questionsAnswered: number;
  questionsCorrect: number;
  
  // Rewards & Resources
  savedResources: Resource[];
  unlockedBadges: string[]; // e.g. "Novice Scholar", "Time Keeper"
}

export enum ViewState {
  LANDING = 'LANDING',
  AUTH = 'AUTH',
  ONBOARDING = 'ONBOARDING',
  DASHBOARD = 'DASHBOARD',
  PLANNER = 'PLANNER',
  RESOURCES = 'RESOURCES',
  SCRIBA = 'SCRIBA',
  TIMER = 'TIMER',
  NOTES = 'NOTES',
  SETTINGS = 'SETTINGS'
}