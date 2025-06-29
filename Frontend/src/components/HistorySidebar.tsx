// Frontend/src/components/HistorySidebar.tsx

import { PlusSquare, Trash2 } from 'lucide-react';
import './HistorySidebar.css';

interface Session {
  id: string;
  title: string;
  created_at: string;
}

interface HistorySidebarProps {
  sessions: Session[];
  activeSessionId: string | null;
  isLoading: boolean; // The new prop
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
        {/* Conditionally render based on the loading and sessions state */}
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
                  <button 
                    className="delete-session-button" 
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession(session.id);
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
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