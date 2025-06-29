import React, { useState, useRef, useEffect, useCallback } from 'react';
import './OnlineConsultation.css';
import DailyIframe, { type DailyCall, type DailyCallOptions } from '@daily-co/daily-js';
import { Link, useNavigate } from 'react-router-dom';

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

  const navigate = useNavigate();

  // Ref for the DOM element where the Daily.co iframe will be mounted
  const dailyCallRef = useRef<HTMLDivElement>(null);
  // REF FOR THE DAILY.CO CALL INSTANCE ITSELF - This will be the *single* source of truth for the instance
  const dailyCallInstance = useRef<DailyCall | null>(null);

  // NEW: Ref to track if DailyIframe.createFrame is actively being called
  const isCreatingRef = useRef(false);

  // State for call status (e.g., 'idle', 'fetching', 'joining', 'joined', 'error') - this drives UI rendering
  const [callStatus, setCallStatus] = useState<'idle' | 'fetching' | 'joining' | 'joined' | 'error'>('idle');
  // State for local media controls (mute/video toggle)
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  // State to store the dynamically fetched Daily.co room URL
  const [dailyRoomUrl, setDailyRoomUrl] = useState<string | null>(null);

  // IMPORTANT: This needs to be a unique ID for EACH consultation session.
  // For demo purposes, I'm using a static one.
  // In a real app, this might come from URL params (e.g., `/consultation/:id`),
  // props passed from a parent component (e.g., an appointment ID),
  // or a context/state management solution.
  const CONSULTATION_SESSION_ID = 'medibridge-consultation-session-123'; // Replace with dynamic ID logic


  // Base URL for your backend server
  const BACKEND_BASE_URL = 'http://localhost:5000'; // Make sure this matches your backend's port

  // Ref to hold the latest callStatus value for useCallback that needs it
  const callStatusRef = useRef(callStatus);
  useEffect(() => {
    callStatusRef.current = callStatus;
  }, [callStatus]); // Keep this ref updated whenever callStatus changes


  // Function to fetch the room URL from your backend
  const fetchRoomUrl = useCallback(async () => {
    // Use the ref to check the latest callStatus without making it a direct dependency
    if (callStatusRef.current === 'fetching' || callStatusRef.current === 'joining' || callStatusRef.current === 'joined') {
      console.log('Fetch room URL skipped: call already in progress or fetching (via ref).');
      return;
    }

    setCallStatus('fetching');
    try {
      const response = await fetch(`${BACKEND_BASE_URL}/video-call/${CONSULTATION_SESSION_ID}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.url) {
        setDailyRoomUrl(data.url);
        setCallStatus('idle'); // Back to idle after fetching, waiting for user to click join
        console.log('Fetched Daily.co room URL:', data.url);
      } else {
        throw new Error('No URL found in backend response.');
      }
    } catch (error) {
      console.error('Error fetching Daily.co room from backend:', error);
      setCallStatus('error');
      setDailyRoomUrl(null);
    }
  }, [CONSULTATION_SESSION_ID, BACKEND_BASE_URL]);


  // Initial fetch when component mounts - runs ONLY ONCE
  useEffect(() => {
    fetchRoomUrl();
  }, [fetchRoomUrl]);


  // Function to initiate joining the Daily.co call.
  const initiateJoinCall = useCallback(() => {
    if (callStatus === 'idle' && dailyRoomUrl && dailyCallRef.current && !dailyCallInstance.current) {
      setCallStatus('joining');
    } else if (!dailyRoomUrl) {
        console.warn("Cannot join: Daily.co room URL not yet fetched.");
        setCallStatus('error'); // Indicate to user
    } else {
      console.warn("Attempted to join call but call is not idle or instance already exists.");
    }
  }, [callStatus, dailyRoomUrl]);


  // EFFECT: Manages the Daily.co call instance lifecycle
  useEffect(() => {
    // Immediately check if a creation process is already underway or if an instance already exists
    if (isCreatingRef.current || dailyCallInstance.current) {
        return; // Prevent duplicate createFrame calls
    }

    let currentCallFrame: DailyCall | null = null;

    if (callStatus === 'joining' && dailyCallRef.current && dailyRoomUrl) {
      console.log('Attempting to create Daily.co iframe with URL:', dailyRoomUrl);
      isCreatingRef.current = true; // Set flag: creation is in progress
      try {
        const options: DailyCallOptions = {
          url: dailyRoomUrl, // Use the dynamically fetched URL
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
        currentCallFrame = (DailyIframe.createFrame as any)({
          parentEl: dailyCallRef.current,
          ...options
        });

        dailyCallInstance.current = currentCallFrame; // Store the instance in ref
        isCreatingRef.current = false; // Reset flag: creation attempt finished (success or handled error)

        // NULL CHECK: Ensure currentCallFrame is not null before attaching listeners
        if (currentCallFrame) {
          // Attach all event listeners
          currentCallFrame.on('loaded', () => {
            console.log('Daily.co call frame loaded.');
          });

          currentCallFrame.on('joined-meeting', () => {
            console.log('Joined Daily.co meeting!');
            setCallStatus('joined');
            setIsMuted((currentCallFrame?.participants()?.local?.audio as 'on' | 'off' | undefined) === 'off');
            setIsVideoOff((currentCallFrame?.participants()?.local?.video as 'on' | 'off' | undefined) === 'off');
          });

          currentCallFrame.on('left-meeting', () => {
            console.log('Left Daily.co meeting.');
            setCallStatus('idle');
            // FIX: Delay destruction to allow Daily.co's internal state to clear
            if (dailyCallInstance.current) {
              const instanceToDestroy = dailyCallInstance.current;
              dailyCallInstance.current = null; // Clear ref immediately
              setTimeout(() => {
                console.log('Daily.co instance being destroyed after delay.');
                instanceToDestroy.destroy();
              }, 100); // Small delay (e.g., 50ms-100ms)
            }
          });

          currentCallFrame.on('error', (e: any) => {
            console.error('Daily.co error:', e);
            setCallStatus('error');
            // FIX: Delay destruction to allow Daily.co's internal state to clear
            if (dailyCallInstance.current) {
              const instanceToDestroy = dailyCallInstance.current;
              dailyCallInstance.current = null; // Clear ref immediately
              setTimeout(() => {
                console.log('Daily.co instance being destroyed after error delay.');
                instanceToDestroy.destroy();
              }, 100); // Small delay
            }
          });
        }


      } catch (error) {
        console.error('Failed to create Daily.co iframe:', error);
        setCallStatus('error');
        isCreatingRef.current = false; // Reset flag on error
        // Ensure ref is cleared even if createFrame itself fails
        dailyCallInstance.current = null;
      }
    } else if (callStatus === 'joining' && (!dailyRoomUrl || !dailyCallRef.current)) {
        console.warn("Still waiting for room URL or DOM ref to be ready to join.");
        // Could transition to an error state if waiting too long
    }

    // Cleanup function for the useEffect. Runs on component unmount or if `callStatus` changes
    // from 'joining' to something else, effectively stopping a prior join attempt.
    return () => {
      console.log('Running useEffect cleanup for Daily.co instance.');
      if (dailyCallInstance.current) {
        const instanceToDestroy = dailyCallInstance.current;
        dailyCallInstance.current = null; // Clear ref immediately
        setTimeout(() => {
          console.log('Daily.co instance being destroyed on unmount/re-render cleanup after delay.');
          instanceToDestroy.destroy();
        }, 100); // Small delay
      }
      setCallStatus('idle'); // Reset status on unmount
    };
  }, [callStatus, dailyRoomUrl]); // Only depend on callStatus and dailyRoomUrl for *this* useEffect


  // Function to leave the Daily.co call (exposed to buttons)
  const leaveCall = useCallback(() => {
    if (dailyCallInstance.current) {
      dailyCallInstance.current.leave();
      // The 'left-meeting' event listener will handle cleanup and status update
    }
    navigate('/summary'); // Navigate after leaving
  }, [navigate]);

  // Toggle functions (remain unchanged)
  const toggleMute = useCallback(() => {
    if (dailyCallInstance.current) {
      dailyCallInstance.current.setLocalAudio(!isMuted);
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  const toggleVideo = useCallback(() => {
    if (dailyCallInstance.current) {
      dailyCallInstance.current.setLocalVideo(!isVideoOff);
      setIsVideoOff(!isVideoOff);
    }
  }, [isVideoOff]);

  const handleSendMessage = () => {
    if (message.trim()) {
      setChatMessages([...chatMessages, { sender: 'You', text: message, isUser: true }]);
      setMessage('');
    }
  };

  return (
    <div className="online-consultation-container">
      <div className="online-consultation-content">
        {/* Main Video Call Area */}
        <div className="video-call-area">
          {callStatus === 'fetching' && (
            <div className="call-status-message" style={{ color: 'white' }}>Fetching consultation room...</div>
          )}
          {callStatus === 'idle' && dailyRoomUrl && ( // Only show "Start Call" if URL is fetched
            <div className="call-start-prompt">
              <p>Ready to start your consultation?</p>
              <button onClick={initiateJoinCall} className="start-call-button">
                Start Call
              </button>
            </div>
          )}
          {callStatus === 'idle' && !dailyRoomUrl && ( // Show message if URL not yet fetched
            <div className="call-status-message" style={{ color: 'white' }}>Preparing consultation room...</div>
          )}
          {callStatus === 'joining' && (
            <div className="call-status-message" style={{ color: 'white' }}>Connecting to consultation...</div>
          )}
          {callStatus === 'error' && (
            <div className="call-status-message" style={{ color: 'red' }}>Error connecting to call. Please try again.</div>
          )}

          {/* Daily.co iframe will be embedded here */}
          <div
            className="daily-video-container"
            ref={dailyCallRef}
            // Display if joined or in the process of joining/fetching (to ensure ref is attached)
            style={{ display: (callStatus === 'joined' || callStatus === 'joining' || callStatus === 'fetching') ? 'block' : 'none' }}
          >
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
          </div >

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