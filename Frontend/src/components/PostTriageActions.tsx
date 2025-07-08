import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, CalendarPlus, Stethoscope, Phone } from 'lucide-react';
import './PostTriageActions.css';

interface PostTriageActionsProps {
  esiLevel: number;
  onSelfCareRequest: () => void; // This is the new callback function
}

const EMERGENCY_PHONE_NUMBER = import.meta.env.VITE_EMERGENCY_PHONE_NUMBER || '911';

const PostTriageActions: React.FC<PostTriageActionsProps> = ({ esiLevel, onSelfCareRequest }) => {
  const navigate = useNavigate();

  const getTitle = () => {
    if (esiLevel <= 2) return "Urgent Action Recommended";
    if (esiLevel === 3) return "Consultation Recommended";
    return "Next Steps";
  };

  return (
    <div className="post-triage-container">
      <h4>{getTitle()}</h4>
      <div className="action-buttons-grid">
        
        {(esiLevel <= 2) && (
          <button className="action-button call" onClick={() => window.location.href = `tel:${EMERGENCY_PHONE_NUMBER}`}>
            <Phone size={24} />
            <span>Call Emergency Services</span>
            <small>Immediately connect to {EMERGENCY_PHONE_NUMBER}</small>
          </button>
        )}

        {(esiLevel <= 3) && (
          <button className="action-button emergency" onClick={() => navigate('/emergency')}>
            <ShieldAlert size={24} />
            <span>Find Emergency Care</span>
            <small>For critical or urgent needs</small>
          </button>
        )}

        <button className="action-button appointment" onClick={() => navigate('/appointments')}>
          <CalendarPlus size={24} />
          <span>Book a Consultation</span>
          <small>Schedule a talk with a doctor</small>
        </button>

        {(esiLevel >= 4) && (
          <button className="action-button self-care" onClick={onSelfCareRequest}>
            <Stethoscope size={24} />
            <span>Self-Care Advice</span>
            <small>Get tips from the AI</small>
          </button>
        )}
      </div>
    </div>
  );
};

export default PostTriageActions;