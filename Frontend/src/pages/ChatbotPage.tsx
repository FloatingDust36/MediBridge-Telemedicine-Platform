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

const LoadingSpinner = () => (
    <div className="loading-spinner-container">
        <div className="loading-spinner"></div>
    </div>
);

const ChatbotPage = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
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
    try {
      const response = await fetch(`${API_URL}/session/${sessionIdToDelete}`, { method: 'DELETE' });
      if (!response.ok) setSessions(previousSessions);
    } catch (error) {
      console.error("Failed to delete session:", error);
      setSessions(previousSessions);
    }
  }, [sessions, activeSessionId]);

  // --- NEW FUNCTION TO HANDLE TITLE GENERATION ---
  const handleMessageSent = useCallback((sessionId: string) => {
    const currentSession = sessions.find(s => s.id === sessionId);
    // Trigger title generation if the session exists and still has its default date-based title
    // This prevents re-generating titles for old chats.
    if (currentSession && !currentSession.has_summary) {
        // We can add more complex logic here, e.g., only generate after 2 user messages.
        // For now, we'll trigger it after the first user message.
        console.log(`Triggering title generation for session: ${sessionId}`);
        fetch(`${API_URL}/session/${sessionId}/generate-title`, { method: 'POST' });
        // Refresh the sidebar after a short delay to allow the title to be generated and saved.
        setTimeout(() => fetchSessions(), 2500); 
    }
  }, [sessions, fetchSessions]);
  // --- END OF NEW FUNCTION ---


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
        {/* We now pass the new handler function to ChatWindow */}
        <ChatWindow 
          sessionId={activeSessionId}
          onTriageComplete={() => fetchSessions()} // Refresh sessions when triage is done
          onMessageSent={() => {
            if (activeSessionId) handleMessageSent(activeSessionId);
          }}
        />
      </div>
    </div>
  );
};

export default ChatbotPage;