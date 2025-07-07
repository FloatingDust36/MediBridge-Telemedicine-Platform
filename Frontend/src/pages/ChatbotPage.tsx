// Frontend/src/pages/ChatbotPage.tsx

import { useState, useEffect, useCallback } from 'react';
import ChatWindow from '../components/ChatWindow';
import HistorySidebar from '../components/HistorySidebar';
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
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(
    () => sessionStorage.getItem('activeSessionId') || null
  );
  const [isAppLoading, setIsAppLoading] = useState(true);
  const userId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
  
  const fetchSessions = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/sessions/user/${userId}`);
      if (!response.ok) throw new Error("Failed to fetch sessions");
      const data = await response.json();
      setSessions(data);
    } catch (error) {
      console.error("Failed to fetch sessions:", error);
    }
  }, [userId]);

  useEffect(() => {
    if (activeSessionId) {
      sessionStorage.setItem('activeSessionId', activeSessionId);
    } else {
      sessionStorage.removeItem('activeSessionId');
    }
  }, [activeSessionId]);

  useEffect(() => {
    const initializeApp = async () => {
        await fetchSessions();
        setIsAppLoading(false);
    };
    initializeApp();
  }, [fetchSessions]);

  const handleSelectSession = (sessionId: string) => {
    setActiveSessionId(sessionId);
  };

  const handleNewChat = useCallback(async () => {
    setActiveSessionId(null);
    try {
      const response = await fetch(`${API_URL}/chat/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      });
      const data = await response.json();
      if (data.session_id) {
        await fetchSessions();
        setActiveSessionId(data.session_id);
      }
    } catch (error) {
      console.error("Failed to start a new session:", error);
    }
  }, [userId, fetchSessions]);

  const handleDeleteSession = useCallback(async (sessionIdToDelete: string) => {
    if (!window.confirm("Are you sure you want to delete this conversation?")) return;
    
    const previousSessions = sessions;
    setSessions(prev => prev.filter(s => s.id !== sessionIdToDelete));
    if (activeSessionId === sessionIdToDelete) {
      setActiveSessionId(null);
    }
    // Remove the deleted session's messages from the session storage cache
    sessionStorage.removeItem(`messages_${sessionIdToDelete}`);
    try {
      const response = await fetch(`${API_URL}/session/${sessionIdToDelete}`, { method: 'DELETE' });
      if (!response.ok) setSessions(previousSessions);
    } catch (error) {
      console.error("Failed to delete session:", error);
      setSessions(previousSessions);
    }
  }, [sessions, activeSessionId]);

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
          sessionId={activeSessionId}
          onTriageComplete={() => fetchSessions()}
          onMessageSent={() => {
            if (activeSessionId) handleMessageSent(activeSessionId);
          }}
        />
      </div>
    </div>
  );
};

export default ChatbotPage;