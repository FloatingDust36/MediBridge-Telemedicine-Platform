// Frontend/src/components/HistorySidebar.tsx

import { PlusSquare, Trash2, Download } from 'lucide-react'; // Add Download icon
import type { Session } from '../pages/ChatbotPage'; // Import the Session type
import './HistorySidebar.css';

const API_URL = import.meta.env.VITE_API_BASE_URL;

interface HistorySidebarProps {
  sessions: Session[];
  activeSessionId: string | null;
  isLoading: boolean;
  onSelectSession: (sessionId: string) => void;
  onNewChat: () => void;
  onDeleteSession: (sessionId: string) => void;
}

// A simple component for the loading placeholder
const SkeletonLoader = () => (
    <div className="skeleton-container">
        <div className="skeleton-item"></div>
        <div className="skeleton-item"></div>
        <div className="skeleton-item"></div>
    </div>
);

const HistorySidebar = ({ sessions, activeSessionId, isLoading, onSelectSession, onNewChat, onDeleteSession }: HistorySidebarProps) => {
  return (
    <div className="history-sidebar">
      <div className="sidebar-header">
        <button className="new-chat-button" onClick={onNewChat}>
          <PlusSquare size={20} />
          New Chat
        </button>
      </div>

      <div className="session-list-container">
        {isLoading ? (
          <SkeletonLoader />
        ) : sessions.length > 0 ? (
          <>
            <h4 className="recent-label">Recent</h4>
            <div className="session-list">
              {sessions.map((session) => (
                <div key={session.id} className="session-item-container">
                  <div
                    className={`session-item ${session.id === activeSessionId ? 'active' : ''}`}
                    onClick={() => onSelectSession(session.id)}
                  >
                    {session.title}
                  </div>
                  <div className="session-actions">
                    {/* Conditionally render the download button if a summary exists */}
                    {session.has_summary && (
                      <a 
                        href={`${API_URL}/session/${session.id}/summary/pdf`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="download-session-button"
                        onClick={(e) => e.stopPropagation()} // Prevent selecting chat
                        title="Download Summary"
                      >
                        <Download size={14} />
                      </a>
                    )}
                    <button 
                      className="delete-session-button" 
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSession(session.id);
                      }}
                      title="Delete Chat"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="empty-list-message">
            No recent chats.
          </div>
        )}
      </div>
    </div>
  );
};

export default HistorySidebar;