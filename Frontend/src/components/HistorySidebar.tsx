// Frontend/src/components/HistorySidebar.tsx

import { PlusSquare, Trash2, Download } from 'lucide-react';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import type { Session } from '../pages/ChatbotPage';
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

const SkeletonLoader = () => (
    <div className="skeleton-container">
        <div className="skeleton-item"></div>
        <div className="skeleton-item"></div>
        <div className="skeleton-item"></div>
    </div>
);

// Helper function for dynamic date formatting
function formatSessionTime(dateStr: string): string {
  const date = new Date(dateStr);
  if (isToday(date)) {
    return formatDistanceToNow(date, { addSuffix: true });
  }
  if (isYesterday(date)) {
    return `Yesterday at ${format(date, 'p')}`;
  }
  return format(date, 'MMM d, p');
}

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
                    {session.title || formatSessionTime(session.created_at)}
                  </div>
                  <div className="session-actions">
                    {session.has_summary && (
                      <a 
                        href={`${API_URL}/session/${session.id}/summary/pdf`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="download-session-button"
                        onClick={(e) => e.stopPropagation()}
                        title="Download Summary"
                        aria-label="Download chat summary"
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
                      aria-label="Delete chat"
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