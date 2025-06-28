// Frontend/src/pages/ChatbotPage.tsx

import { useState, useEffect } from 'react';
import ChatWindow from '../components/ChatWindow';
import HistorySidebar from '../components/HistorySidebar';
import './ChatbotPage.css'; // Keep this for overall page layout styles

const API_URL = import.meta.env.VITE_API_BASE_URL;

interface Session {
  id: string;
  title: string;
  created_at: string;
}

const ChatbotPage = () => {
  // For testing, we'll use a fixed user_id.
  const userId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // Function to fetch all sessions for the sidebar
  const fetchSessions = async () => {
    try {
      const response = await fetch(`${API_URL}/sessions/user/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setSessions(data);
      }
    } catch (error) {
      console.error("Failed to fetch sessions:", error);
    }
  };

  // When the page loads, fetch the sessions and set the active session from localStorage
  useEffect(() => {
    fetchSessions();
    const storedSessionId = localStorage.getItem('chatSessionId');
    if (storedSessionId) {
      setActiveSessionId(storedSessionId);
    }
  }, []);

  const handleSelectSession = (sessionId: string) => {
    localStorage.setItem('chatSessionId', sessionId);
    setActiveSessionId(sessionId);
  };

  const handleNewChat = async () => {
    // Clear local storage to forget the old session
    localStorage.removeItem('chatSessionId');

    // Call the backend to create a new session
    try {
      const response = await fetch(`${API_URL}/chat/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      });
      const data = await response.json();
      if (data.session_id) {
        // Save the new session ID and make it active
        localStorage.setItem('chatSessionId', data.session_id);
        setActiveSessionId(data.session_id);
        // Refresh the session list to include the new one
        fetchSessions();
      }
    } catch (error) {
      console.error("Failed to start a new session:", error);
    }
  };

  return (
    <div className="chatbot-page-wrapper">
      <HistorySidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
      />
      <ChatWindow sessionId={activeSessionId} />
    </div>
  );
};

export default ChatbotPage;