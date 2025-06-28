// Frontend/src/components/HistorySidebar.tsx

import { PlusSquare } from 'lucide-react';
import './HistorySidebar.css';

interface Session {
  id: string;
  title: string;
  created_at: string;
}

interface HistorySidebarProps {
  sessions: Session[];
  activeSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onNewChat: () => void;
}

const HistorySidebar = ({ sessions, activeSessionId, onSelectSession, onNewChat }: HistorySidebarProps) => {
  return (
    <div className="history-sidebar">
      {/* Section for the New Chat button, which will stay at the top */}
      <div className="sidebar-header">
        <button className="new-chat-button" onClick={onNewChat}>
          <PlusSquare size={20} />
          New Chat
        </button>
      </div>

      {/* Conditionally render the "Recent" label only if there are sessions */}
      {sessions.length > 0 && (
        <h4 className="recent-label">Recent</h4>
      )}

      {/* The scrollable list of past sessions */}
      <div className="session-list">
        {sessions.map((session) => (
          <div
            key={session.id}
            className={`session-item ${session.id === activeSessionId ? 'active' : ''}`}
            onClick={() => onSelectSession(session.id)}
          >
            {session.title}
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistorySidebar;