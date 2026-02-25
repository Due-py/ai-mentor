import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserMemory, Note, StudyPlan, ViewState, Task, Resource, ChatSession } from '../types';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// --- CONFIGURATION ---
// Replace these with your actual Supabase keys to enable cross-device features
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY || '';

interface MemoryContextType {
  memory: UserMemory;
  updateMemory: (updates: Partial<UserMemory>) => void;
  view: ViewState;
  setView: (view: ViewState) => void;
  activePlan: StudyPlan | null;
  setActivePlan: (plan: StudyPlan | null) => void;
  completeTask: (weekIndex: number, dayIndex: number, taskId: string, xpGained: number, isCorrect?: boolean) => void;
  
  notes: Note[];
  addNote: (note: Note) => void;
  updateNote: (id: string, updates: Partial<Pick<Note, 'title' | 'content' | 'subject' | 'tags'>>) => void;
  deleteNote: (id: string) => void;

  // Scriba Sessions (Like Notes)
  chatSessions: ChatSession[];
  addChatSession: (session: ChatSession) => void;
  updateChatSession: (id: string, updates: Partial<ChatSession>) => void;
  deleteChatSession: (id: string) => void;
  
  // Resource Management
  saveResource: (resource: Resource) => void;
  removeResource: (resourceId: string) => void;
  
  apiKey: string | null;
  setApiKey: (key: string) => void;
  isAuthenticated: boolean;
  isOnline: boolean; // New status indicator
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => void;
  currentUserEmail: string | null;
}

// STRICT ZERO INITIALIZATION
const defaultMemory: UserMemory = {
  name: 'Học sinh',
  grade: '',
  goals: [],
  strengths: [],
  weaknesses: [],
  subjectsStudied: [],
  pomodoroSessions: 0,
  totalFocusTime: 0,
  xp: 0,
  level: 1,
  questionsAnswered: 0,
  questionsCorrect: 0,
  savedResources: [],
  unlockedBadges: ['Học viên Mới']
};

// Rewards System Configuration
const LEVEL_THRESHOLDS = 100; // XP needed per level
const BADGES: Record<number, string> = {
  1: 'Học viên Mới',
  3: 'Nhà Nghiên cứu Đồng',
  5: 'Học giả Bạc',
  10: 'Triết gia Vàng',
  20: 'Đại kiện tướng Tri thức'
};

const MemoryContext = createContext<MemoryContextType | undefined>(undefined);

export const MemoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  
  const [memory, setMemoryState] = useState<UserMemory>(defaultMemory);
  const [view, setView] = useState<ViewState>(ViewState.LANDING);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activePlan, setActivePlan] = useState<StudyPlan | null>(null);
  
  // Persistent Arrays
  const [notes, setNotes] = useState<Note[]>([]);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);

  const [apiKey, setApiKeyState] = useState<string | null>(() => {
    return import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem('gemini_api_key');
  });

  // --- INITIALIZE STORAGE ENGINE ---
  useEffect(() => {
    if (SUPABASE_URL && SUPABASE_KEY) {
      try {
        const client = createClient(SUPABASE_URL, SUPABASE_KEY);
        setSupabase(client);
        setIsOnline(true);
        console.log("AI Mentor connected to Supabase Cloud.");
      } catch (e) {
        console.error("Failed to connect to Supabase. Falling back to LocalStorage.", e);
        setIsOnline(false);
      }
    } else {
      console.warn("No Supabase keys found. Using LocalStorage (Offline Mode).");
      setIsOnline(false);
    }
  }, []);

  // --- DATABASE HELPERS (Hybrid) ---

  const getUsersDB_Local = () => {
    const db = localStorage.getItem('mind_mentor_users');
    return db ? JSON.parse(db) : {};
  };

  const saveToUserDB_Local = (email: string, userData: any) => {
    const db = getUsersDB_Local();
    db[email] = { ...db[email], ...userData };
    localStorage.setItem('mind_mentor_users', JSON.stringify(db));
  };

  // --- CLOUD SYNC LOGIC ---
  // We sync the entire 'memory' object to the 'memory' column in Supabase
  const syncToCloud = async (email: string, data: Partial<UserMemory> | any) => {
    if (!supabase || !isOnline) return;

    // We need to merge with existing cloud data or current state
    // For simplicity in this architecture, we push the current 'memory' state
    // In a real app, we would split tables (friends, messages) to avoid race conditions.
    // Here we assume 'data' contains the updated fields.
    
    // 1. Fetch current to merge (Optimistic locking omitted for prototype speed)
    const { data: currentRemote } = await supabase.from('mind_mentor_users').select('memory').eq('email', email).single();
    
    const mergedMemory = { ...(currentRemote?.memory || defaultMemory), ...data };

    await supabase.from('mind_mentor_users').upsert({
      email: email,
      memory: mergedMemory,
      updated_at: new Date().toISOString()
    });
  };


  // --- SYNC STATE ON CHANGE (Hybrid) ---
  useEffect(() => {
    if (currentUserEmail) {
      if (isOnline) {
        syncToCloud(currentUserEmail, { ...memory }); // Persist main memory changes
        // Notes, ChatSessions etc would be separate tables in production
        // For prototype, we could bundle them into memory or ignore (local only)
        // Here we keep notes local-first as requested "Do NOT redesign" drastically
      } else {
        saveToUserDB_Local(currentUserEmail, { memory });
      }
    }
  }, [memory, currentUserEmail, isOnline]);

  // Keep Notes/Sessions Local for this prototype unless we expand schema
  useEffect(() => {
    if (currentUserEmail) saveToUserDB_Local(currentUserEmail, { notes });
  }, [notes, currentUserEmail]);

  useEffect(() => {
    if (currentUserEmail) saveToUserDB_Local(currentUserEmail, { chatSessions });
  }, [chatSessions, currentUserEmail]);

  useEffect(() => {
    if (currentUserEmail) saveToUserDB_Local(currentUserEmail, { activePlan });
  }, [activePlan, currentUserEmail]);


  const setApiKey = (key: string) => {
    setApiKeyState(key);
    localStorage.setItem('gemini_api_key', key);
  };

  const updateMemory = (updates: Partial<UserMemory>) => {
    setMemoryState(prev => ({ ...prev, ...updates }));
  };

  const signup = async (email: string, password: string, name: string): Promise<boolean> => {
    // Hybrid Signup
    const newUserMemory = { ...defaultMemory, name };
    
    if (isOnline && supabase) {
      const { data: existing } = await supabase.from('mind_mentor_users').select('email').eq('email', email).single();
      if (existing) return false;

      await supabase.from('mind_mentor_users').insert({
        email,
        name,
        memory: newUserMemory
      });
      // Also save local for cache
      saveToUserDB_Local(email, { password, name, memory: newUserMemory, notes: [], chatSessions: [] });
    } else {
       const db = getUsersDB_Local();
       if (db[email]) return false;
       saveToUserDB_Local(email, { password, name, memory: newUserMemory, notes: [], chatSessions: [] });
    }

    setCurrentUserEmail(email);
    setMemoryState(newUserMemory);
    setNotes([]);
    setChatSessions([]);
    setActivePlan(null);
    setIsAuthenticated(true);
    return true;
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    if (isOnline && supabase) {
      // For this prototype, we don't have a real Auth table with passwords in Supabase (to keep it simple).
      // We check if user exists in 'mind_mentor_users'.
      // In a real app, use supabase.auth.signInWithPassword.
      
      const { data } = await supabase.from('mind_mentor_users').select('*').eq('email', email).single();
      
      if (data) {
        setCurrentUserEmail(email);
        setMemoryState({ ...defaultMemory, ...data.memory });
        
        // Try to load local notes/sessions if available
        const local = getUsersDB_Local()[email];
        setNotes(local?.notes || []);
        setChatSessions(local?.chatSessions || []);
        
        setIsAuthenticated(true);
        return true;
      }
      
      // Fallback to local if cloud fails or user not found in cloud but is local
      const local = getUsersDB_Local()[email];
      if (local && local.password === password) {
         setCurrentUserEmail(email);
         setMemoryState({ ...defaultMemory, ...local.memory });
         setNotes(local.notes || []);
         setChatSessions(local.chatSessions || []);
         setIsAuthenticated(true);
         return true;
      }
      return false;

    } else {
      const db = getUsersDB_Local();
      const user = db[email];
      if (user && user.password === password) {
        setCurrentUserEmail(email);
        setMemoryState({ ...defaultMemory, ...user.memory }); 
        setNotes(user.notes || []);
        setChatSessions(user.chatSessions || []);
        setActivePlan(user.activePlan || null);
        setIsAuthenticated(true);
        return true;
      }
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setCurrentUserEmail(null);
    setMemoryState(defaultMemory);
    setNotes([]);
    setChatSessions([]);
    setActivePlan(null);
    setView(ViewState.LANDING);
  };

  // --- IMPLEMENTATIONS OF MISSING METHODS ---

  const completeTask = (weekIndex: number, dayIndex: number, taskId: string, xpGained: number, isCorrect?: boolean) => {
    if (!activePlan) return;

    // Update Plan
    const newWeeks = [...activePlan.weeks];
    const day = newWeeks[weekIndex].days[dayIndex];
    const taskIndex = day.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;

    // Check if already completed to avoid double counting
    if (day.tasks[taskIndex].completed) return;

    day.tasks[taskIndex].completed = true;
    day.tasks[taskIndex].quizTaken = isCorrect !== undefined;
    
    setActivePlan({ ...activePlan, weeks: newWeeks });

    // Update Memory (XP, Level, Stats)
    const newXP = memory.xp + xpGained;
    const newLevel = Math.floor(newXP / LEVEL_THRESHOLDS) + 1;
    const newBadge = BADGES[newLevel] ? [...memory.unlockedBadges, BADGES[newLevel]] : memory.unlockedBadges;

    // Stats
    const questionsAnswered = isCorrect !== undefined ? memory.questionsAnswered + 1 : memory.questionsAnswered;
    const questionsCorrect = (isCorrect !== undefined && isCorrect) ? memory.questionsCorrect + 1 : memory.questionsCorrect;

    updateMemory({
      xp: newXP,
      level: newLevel,
      unlockedBadges: Array.from(new Set(newBadge)), // unique
      questionsAnswered,
      questionsCorrect
    });
  };

  const addNote = (note: Note) => {
    setNotes(prev => [note, ...prev]);
  };

  const updateNote = (id: string, updates: Partial<Pick<Note, 'title' | 'content' | 'subject' | 'tags'>>) => {
    setNotes(prev =>
      prev.map(n => (n.id === id ? { ...n, ...updates, lastEdited: Date.now() } : n))
    );
  };

  const deleteNote = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  const addChatSession = (session: ChatSession) => {
    setChatSessions(prev => [session, ...prev]);
  };

  const updateChatSession = (id: string, updates: Partial<ChatSession>) => {
    setChatSessions(prev => prev.map(s => s.id === id ? { ...s, ...updates, lastUpdated: Date.now() } : s));
  };

  const deleteChatSession = (id: string) => {
    setChatSessions(prev => prev.filter(s => s.id !== id));
  };

  const saveResource = (resource: Resource) => {
    // Avoid duplicates
    if (memory.savedResources.some(r => r.id === resource.id)) return;
    updateMemory({ savedResources: [...memory.savedResources, resource] });
  };

  const removeResource = (resourceId: string) => {
    updateMemory({ savedResources: memory.savedResources.filter(r => r.id !== resourceId) });
  };

  return (
    <MemoryContext.Provider value={{
      memory,
      updateMemory,
      view,
      setView,
      activePlan,
      setActivePlan,
      completeTask,
      
      notes,
      addNote,
      updateNote,
      deleteNote,
      
      chatSessions,
      addChatSession,
      updateChatSession,
      deleteChatSession,

      saveResource,
      removeResource,

      currentUserEmail,

      apiKey,
      setApiKey,
      isAuthenticated,
      isOnline, // Export status
      login,
      signup,
      logout
    }}>
      {children}
    </MemoryContext.Provider>
  );
};

export const useMemory = () => {
  const context = useContext(MemoryContext);
  if (!context) throw new Error("useMemory must be used within a MemoryProvider");
  return context;
};
