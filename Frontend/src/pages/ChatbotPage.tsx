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

  const handleDeleteSession = async (sessionIdToDelete: string) => {
      // Ask for confirmation before deleting
      if (!window.confirm("Are you sure you want to delete this conversation?")) {
          return;
      }

      try {
          const response = await fetch(`${API_URL}/session/${sessionIdToDelete}`, { method: 'DELETE' });
          if (response.ok) {
              // If the deletion was successful, update the UI instantly
              console.log(`Session ${sessionIdToDelete} deleted successfully.`);
              setSessions(prev => prev.filter(s => s.id !== sessionIdToDelete));

              // If we deleted the currently active chat, clear the chat window
              if (activeSessionId === sessionIdToDelete) {
                setActiveSessionId(null);
              } 
          } else {
              console.error("Failed to delete session on the server.");
          }
      } catch (error) {
        console.error("An error occurred while deleting the session:", error);
      }
  };

  return (
    <div className="chatbot-page-wrapper">
      <HistorySidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
      />
      <ChatWindow sessionId={activeSessionId} />
    </div>
  );
};

export default ChatbotPage;