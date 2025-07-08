import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, CalendarPlus, Stethoscope, MessageCircle } from 'lucide-react'; // Removed 'Phone' icon
import './PostTriageActions.css';

interface PostTriageActionsProps {
  esiLevel: number;
  onSelfCareRequest: () => void;
}

// Your WhatsApp number in international format
const WHATSAPP_CONTACT_NUMBER = '639310815850'; 

const PostTriageActions: React.FC<PostTriageActionsProps> = ({ esiLevel, onSelfCareRequest }) => {
  const navigate = useNavigate();

  const getTitle = () => {
    if (esiLevel <= 2) return "Urgent Action Recommended";
    if (esiLevel === 3) return "Consultation Recommended";
    return "Next Steps";
  };
  
  const handleWhatsAppClick = () => {
    const message = encodeURIComponent("Emergency Assistance Needed");
    window.open(`https://wa.me/${WHATSAPP_CONTACT_NUMBER}?text=${message}`, '_blank');
  };

  return (
    <div className="post-triage-container">
      <h4>{getTitle()}</h4>
      <div className="action-buttons-grid">
        
        {/* --- MODIFIED CALL BUTTON (NOW WHATSAPP) --- */}
        {(esiLevel <= 2) && (
          <button className="action-button call" onClick={handleWhatsAppClick}>
            <MessageCircle size={24} />
            <span>Contact via WhatsApp</span>
            <small>For immediate assistance</small>
          </button>
        )}
        {/* --- END OF MODIFIED BUTTON --- */}

        {/* --- EMERGENCY BUTTON (Restored to original) --- */}
        {(esiLevel <= 3) && (
          <button className="action-button emergency" onClick={() => navigate('/emergency')}>
            <ShieldAlert size={24} />
            <span>Find Emergency Care</span>
            <small>For critical or urgent needs</small>
          </button>
        )}
        {/* --- END OF RESTORED BUTTON --- */}

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