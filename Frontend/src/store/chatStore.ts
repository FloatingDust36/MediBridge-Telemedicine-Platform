//Frontend/src/store/chatStore.ts

import { create } from 'zustand';
import type { Session, Message } from '../pages/ChatbotPage'; // Import types from our page

// This defines the "shape" of our global state
interface ChatState {
  sessions: Session[];
  activeSessionId: string | null;
  messageCache: { [key: string]: Message[] };
  setSessions: (sessions: Session[]) => void;
  setActiveSessionId: (sessionId: string | null) => void;
  addMessage: (sessionId: string, message: Message) => void;
  updateMessage: (sessionId: string, messageKey: string, newText: string) => void;
  setMessagesForSession: (sessionId: string, messages: Message[]) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  // --- STATE ---
  sessions: [],
  activeSessionId: sessionStorage.getItem('activeSessionId') || null, // Initialize from sessionStorage
  messageCache: {},

  // --- ACTIONS (functions to modify the state) ---
  setSessions: (newSessions) => set({ sessions: newSessions }),

  setActiveSessionId: (sessionId) => {
    if (sessionId) {
      sessionStorage.setItem('activeSessionId', sessionId);
    } else {
      sessionStorage.removeItem('activeSessionId');
    }
    set({ activeSessionId: sessionId });
  },
  
  setMessagesForSession: (sessionId, messages) => {
    set(state => ({
      messageCache: {
        ...state.messageCache,
        [sessionId]: messages
      }
    }));
  },

  addMessage: (sessionId, message) => {
    set(state => {
      const existingMessages = state.messageCache[sessionId] || [];
      return {
        messageCache: {
          ...state.messageCache,
          [sessionId]: [...existingMessages, message]
        }
      };
    });
  },

  updateMessage: (sessionId, messageKey, newText) => {
    set(state => {
      const existingMessages = state.messageCache[sessionId] || [];
      return {
        messageCache: {
          ...state.messageCache,
          [sessionId]: existingMessages.map(msg => 
            msg.key === messageKey ? { ...msg, text: newText } : msg
          )
        }
      };
    });
  }
}));