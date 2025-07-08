import { useState, useEffect, useCallback } from 'react';
import supabase from '../lib/supabaseClient'; // 👈 1. Import Supabase client
import ChatWindow from '../components/ChatWindow';
import HistorySidebar from '../components/HistorySidebar';
import { useChatStore } from '../store/chatStore';
import './ChatbotPage.css';

const API_URL = import.meta.env.VITE_API_BASE_URL;

export interface Session {
  id: string;
  title: string;
  created_at: string;
  has_summary: boolean;
}

export interface Message {
  type: 'bot' | 'user';
  text: string;
  imageUrl?: string;
  key?: string;
}

const LoadingSpinner = () => (
    <div className="loading-spinner-container">
        <div className="loading-spinner"></div>
    </div>
);

const ChatbotPage = () => {
  const { sessions, activeSessionId, setSessions, setActiveSessionId } = useChatStore();
  
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null); // 👈 2. Use state for the user ID

  // 👈 3. Get the currently logged-in user's ID from Supabase
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
        } else {
          console.error("User not authenticated.");
          // Optionally, redirect to login page here
          setIsAppLoading(false);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        setIsAppLoading(false);
      }
    };
    fetchUser();
  }, []);
  
  const fetchSessions = useCallback(async () => {
    if (!userId) return; // Don't fetch if there's no user
    try {
      const response = await fetch(`${API_URL}/sessions/user/${userId}`);
      if (!response.ok) throw new Error("Failed to fetch sessions");
      const data = await response.json();
      setSessions(data);
    } catch (error) {
      console.error("Failed to fetch sessions:", error);
    }
  }, [userId, setSessions]); // 👈 4. Depend on the dynamic userId

  // This effect now fetches sessions only after the userId is set
  useEffect(() => {
    const initializeApp = async () => {
        if (userId) {
            await fetchSessions();
            setIsAppLoading(false);
        }
    };
    initializeApp();
  }, [userId, fetchSessions]);

  const handleSelectSession = (sessionId: string) => {
    setActiveSessionId(sessionId);
  };

  const handleNewChat = useCallback(async () => {
    if (!userId) return; // Don't start a new chat if there's no user
    setActiveSessionId(null);
    try {
      const response = await fetch(`${API_URL}/chat/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }), // Use dynamic userId
      });
      const data = await response.json();
      if (data.session_id) {
        await fetchSessions();
        setActiveSessionId(data.session_id);
      }
    } catch (error) {
      console.error("Failed to start a new session:", error);
    }
  }, [userId, fetchSessions, setActiveSessionId]); // Depend on dynamic userId

  const handleDeleteSession = useCallback(async (sessionIdToDelete: string) => {
    if (!window.confirm("Are you sure you want to delete this conversation?")) return;
    
    const updatedSessions = sessions.filter(s => s.id !== sessionIdToDelete);
    setSessions(updatedSessions);

    if (activeSessionId === sessionIdToDelete) {
      setActiveSessionId(null);
    }

    try {
      const response = await fetch(`${API_URL}/session/${sessionIdToDelete}`, { method: 'DELETE' });
      if (!response.ok) {
        fetchSessions();
      }
    } catch (error) {
      console.error("Failed to delete session:", error);
      fetchSessions();
    }
  }, [sessions, activeSessionId, setSessions, setActiveSessionId, fetchSessions]);

  const handleMessageSent = useCallback((sessionId: string) => {
    const currentSession = sessions.find(s => s.id === sessionId);
    if (currentSession && !currentSession.title) {
        setTimeout(() => fetchSessions(), 800);
    }
  }, [sessions, fetchSessions]);

  if (isAppLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="chatbot-page-wrapper">
      <div className="chatbot-main-container">
        <HistorySidebar
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={handleSelectSession}
          onNewChat={handleNewChat}
          onDeleteSession={handleDeleteSession}
          isLoading={isAppLoading}
        />
        <ChatWindow 
          onTriageComplete={() => fetchSessions()}
          onMessageSent={() => {
            const currentActiveId = useChatStore.getState().activeSessionId;
            if (currentActiveId) handleMessageSent(currentActiveId);
          }}
        />
      </div>
    </div>
  );
};

export default ChatbotPage;