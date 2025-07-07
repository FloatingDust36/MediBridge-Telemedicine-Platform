// Frontend/src/components/PostTriageActions.tsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, CalendarPlus, Stethoscope, Phone } from 'lucide-react';
import './PostTriageActions.css'; // We will create this file next

interface PostTriageActionsProps {
  esiLevel: number;
}

const PostTriageActions: React.FC<PostTriageActionsProps> = ({ esiLevel }) => {
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
          <button className="action-button call" onClick={() => window.location.href = 'tel:911'}>
            <Phone size={24} />
            <span>Call Emergency Services</span>
            <small>Immediately connect to 911</small>
          </button>
        )}

        {(esiLevel <= 3) && (
          <button className="action-button emergency" onClick={() => navigate('/emergency')}>
            <ShieldAlert size={24} />
            <span>Find Emergency Care</span>
            <small>For critical or urgent needs</small>
          </button>
        )}

        {(esiLevel <= 4) && (
           <button className="action-button appointment" onClick={() => navigate('/appointments')}>
            <CalendarPlus size={24} />
            <span>Book a Consultation</span>
            <small>Schedule a talk with a doctor</small>
          </button>
        )}

        {(esiLevel >= 4) && (
           <button className="action-button self-care" onClick={() => alert("Continuing self-care. Remember to monitor your symptoms.")}>
            <Stethoscope size={24} />
            <span>Continue Self-Care</span>
            <small>Monitor symptoms and rest</small>
          </button>
        )}
      </div>
    </div>
  );
};

export default PostTriageActions;