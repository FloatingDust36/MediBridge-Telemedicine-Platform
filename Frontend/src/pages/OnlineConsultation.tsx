import React, { useState, useRef, useEffect, useCallback } from 'react';
import './OnlineConsultation.css';
import DailyIframe, { type DailyCall, type DailyCallOptions } from '@daily-co/daily-js';
import { Link, useNavigate } from 'react-router-dom'; // Import useNavigate for redirection

const OnlineConsultation: React.FC = () => {
  const [message, setMessage] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<
    { sender: string; text: string; isUser: boolean }[]
  >([
    {
      sender: 'Dr. JM. Nave',
      text: 'Hello Jane, I see you\'ve been experiencing frequent headaches. How often do they occur?',
      isUser: false,
    },
    {
      sender: 'Jane',
      text: 'Almost every other day for the past two weeks.',
      isUser: true,
    },
    {
      sender: 'Dr. JM. Nave',
      text: 'Do they usually come with nausea or vision problems?',
      isUser: false,
    },
  ]);

  const navigate = useNavigate(); // Initialize navigate

  // Ref for the DOM element where the Daily.co iframe will be mounted
  const dailyCallRef = useRef<HTMLDivElement>(null);
  // REF FOR THE DAILY.CO CALL INSTANCE ITSELF - This will prevent duplicate creation errors
  const dailyCallInstance = useRef<DailyCall | null>(null);

  // State for call status (e.g., 'idle', 'joining', 'joined', 'error') - this still drives UI rendering
  const [callStatus, setCallStatus] = useState<'idle' | 'joining' | 'joined' | 'error'>('idle');
  // NEW STATE: To prevent multiple simultaneous join attempts
  const [isJoining, setIsJoining] = useState(false); // Guard against multiple clicks/renders

  // State for local media controls
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  // IMPORTANT: For development, use a hardcoded room URL.
  // For production, you must fetch this from a backend server.
  const DAILY_ROOM_URL = 'https://goldensneky.daily.co/my-consultation-room'; // Replace with YOUR Daily.co room URL

  // Function to join the Daily.co call
  const joinCall = useCallback(() => {
    // ROBUST GUARD: Check if the DOM ref is ready AND if an instance already exists AND if a join attempt is already in progress
    if (!dailyCallRef.current || dailyCallInstance.current || isJoining) {
      console.warn("Attempted to join call but a Daily.co instance is already active, ref is not ready, or a join attempt is in progress.");
      return;
    }

    setIsJoining(true); // Set joining flag to true immediately
    setCallStatus('joining');

    try {
      const options: DailyCallOptions = {
        url: DAILY_ROOM_URL,
        showLeaveButton: false,
        iframeStyle: {
          position: 'absolute',
          top: '0',
          left: '0',
          width: '100%',
          height: '100%',
          border: '0',
          borderRadius: '8px',
        }
      };

      // Cast the createFrame function call to 'any' to bypass TypeScript's strict check for 'parentEl'
      const newCallFrame = (DailyIframe.createFrame as any)({
        parentEl: dailyCallRef.current,
        ...options
      });

      dailyCallInstance.current = newCallFrame;

      newCallFrame.on('loaded', () => {
        console.log('Daily.co call frame loaded.');
      });

      newCallFrame.on('joined-meeting', () => {
        console.log('Joined Daily.co meeting!');
        setCallStatus('joined');
        setIsJoining(false); // Reset joining flag on success
      });

      newCallFrame.on('left-meeting', () => {
        console.log('Left Daily.co meeting.');
        setCallStatus('idle');
        setIsJoining(false); // Reset joining flag on leaving
        // Clean up the DailyCall instance when leaving
        if (dailyCallInstance.current) {
          dailyCallInstance.current.destroy();
          dailyCallInstance.current = null;
        }
      });

      newCallFrame.on('error', (e: any) => {
        console.error('Daily.co error:', e);
        setCallStatus('error');
        setIsJoining(false); // Reset joining flag on error
        // Clean up the DailyCall instance on error
        if (dailyCallInstance.current) {
          dailyCallInstance.current.destroy();
          dailyCallInstance.current = null;
        }
      });

    } catch (error) {
      console.error('Failed to create Daily.co iframe:', error);
      setCallStatus('error');
      setIsJoining(false); // Reset joining flag on error
      dailyCallInstance.current = null; // Ensure ref is cleared even if createFrame itself fails
    }
  }, [isJoining]); // Add isJoining to dependencies to ensure useCallback updates correctly

  // Function to leave the Daily.co call
  const leaveCall = useCallback(() => {
    if (dailyCallInstance.current) {
      dailyCallInstance.current.leave();
    }
    // Navigate after the leave process has started
    navigate('/summary'); // Assuming you want to go to a consultation summary
  }, [navigate]);

  // Function to toggle mute
  const toggleMute = useCallback(() => {
    if (dailyCallInstance.current) {
      dailyCallInstance.current.setLocalAudio(!isMuted);
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  // Function to toggle video
  const toggleVideo = useCallback(() => {
    if (dailyCallInstance.current) {
      dailyCallInstance.current.setLocalVideo(!isVideoOff);
      setIsVideoOff(!isVideoOff);
    }
  }, [isVideoOff]);

  // Handle component unmount for Daily.co lifecycle cleanup
  useEffect(() => {
    return () => {
      // Ensure the DailyCall instance is destroyed when the component unmounts
      if (dailyCallInstance.current) {
        dailyCallInstance.current.destroy();
        dailyCallInstance.current = null;
      }
    };
  }, []); // Empty dependency array, runs once on mount and cleanup on unmount


  const handleSendMessage = () => {
    if (message.trim()) {
      setChatMessages([...chatMessages, { sender: 'You', text: message, isUser: true }]);
      setMessage('');
      // In a real app, you'd send this message via a websocket or API
      // You could also use Daily.co's sendAppMessage for in-call messaging
      // if (dailyCallInstance.current) {
      //   dailyCallInstance.current.sendAppMessage({ type: 'chat', text: message }, '*');
      // }
    }
  };

  return (
    <div className="online-consultation-container">
      <div className="online-consultation-content">
        {/* Main Video Call Area */}
        <div className="video-call-area">
          {callStatus === 'idle' && (
            <div className="call-start-prompt">
              <p>Ready to start your consultation?</p>
              <button onClick={joinCall} className="start-call-button" disabled={isJoining}>
                {isJoining ? 'Connecting...' : 'Start Call'}
              </button>
            </div>
          )}
          {callStatus === 'joining' && (
            <div className="call-status-message" style={{ color: 'white' }}>Connecting to consultation...</div>
          )}
          {callStatus === 'error' && (
            <div className="call-status-message" style={{ color: 'red' }}>Error connecting to call. Please try again.</div>
          )}

          {/* Daily.co iframe will be embedded here */}
          {/* Display this container only when a call is active or attempting to join */}
          <div className="daily-video-container" ref={dailyCallRef} style={{ display: (callStatus !== 'idle' || isJoining) ? 'block' : 'none' }}>
            {/* The Daily.co iframe will render inside this div */}
          </div>

          {callStatus === 'joined' && (
            <div className="call-controls">
              <button onClick={toggleMute} className="control-button">
                {isMuted ? 'Unmute Mic' : 'Mute Mic'}
              </button>
              <button onClick={toggleVideo} className="control-button">
                {isVideoOff ? 'Turn Video On' : 'Turn Video Off'}
              </button>
              <button onClick={leaveCall} className="end-call-button">End Call</button>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="consultation-sidebar">
          <div className="sidebar-header panel-box-header">
            <p className="details-text">Details</p>
            {/* You'd dynamically display names here based on logged-in user and other participant */}
            <p className="name-info">name doctor / name patient</p>
          </div>

          <div className="patient-info panel-box">
            <h3>Patient Information</h3>
            <p><strong>Name:</strong> Jane Doe</p>
            <p><strong>Age:</strong> 32</p>
            <p><strong>Allergies:</strong> Penicillin</p>
          </div>

          <div className="doctor-info panel-box">
            <h3>Doctor Information</h3>
            <p><strong>Name:</strong> Dr. JM Nave</p>
            <p><strong>Age:</strong> 25</p>
            <p><strong>Specialty:</strong> BBC</p>
            <p><strong>Previous Diagnosis:</strong> Mild migraine (2023)</p>
          </div>

          <div className="chat-box panel-box">
            <div className="chat-messages">
              {chatMessages.map((msg, index) => (
                <div key={index} className={`chat-message ${msg.isUser ? 'user-message' : 'other-message'}`}>
                  <span className="sender-name">{msg.sender}:</span> {msg.text}
                </div>
              ))}
              {chatMessages.length === 0 && <p className="chat-placeholder">Chat box here</p>}
            </div>
            <div className="chat-input-area">
              <input
                type="text"
                placeholder="Type your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSendMessage();
                  }
                }}
              />
              <button onClick={handleSendMessage}>Send</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnlineConsultation;