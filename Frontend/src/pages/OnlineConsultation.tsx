// Inside OnlineConsultation.tsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import './OnlineConsultation.css';

declare global {
    interface Window {
        JitsiMeetExternalAPI: any;
    }
}

interface OnlineConsultationProps {
    roomName: string;
    jwt: string;
    onHangup: () => void;
    userDisplayName: string;
    userEmail: string;
    userId: string;
}

const OnlineConsultation: React.FC<OnlineConsultationProps> = ({
    roomName,
    jwt,
    onHangup,
    userDisplayName,
    userEmail,
    userId
}) => {
    const jitsiContainerRef = useRef<HTMLDivElement>(null);
    const apiRef = useRef<any>(null);
    const [jitsiApiLoaded, setJitsiApiLoaded] = useState(false);

    const loadJitsiScript = useCallback(() => {
        if (document.getElementById('jitsi-external-api-script')) {
            return Promise.resolve(true); // Script already loaded
        }

        const script = document.createElement('script');
        script.src = 'https://8x8.vc/external_api.js';
        script.id = 'jitsi-external-api-script';
        script.async = true;
        document.body.appendChild(script);

        return new Promise((resolve) => {
            script.onload = () => {
                // Wait for JitsiMeetExternalAPI to be available on window
                const checkJitsiApi = setInterval(() => {
                    if (window.JitsiMeetExternalAPI) {
                        clearInterval(checkJitsiApi);
                        console.log("JitsiMeetExternalAPI found on window.");
                        resolve(true);
                    }
                }, 100); // Check every 100ms

                setTimeout(() => { // Add a timeout to prevent infinite loop if it never appears
                    if (!window.JitsiMeetExternalAPI) {
                        clearInterval(checkJitsiApi);
                        console.error("JitsiMeetExternalAPI did not become available after timeout.");
                        resolve(false);
                    }
                }, 5000); // Max wait of 5 seconds
            };
            script.onerror = () => {
                console.error("Failed to load Jitsi Meet External API script via onerror event.");
                resolve(false);
            };
        });
    }, []);

    const initializeJitsi = useCallback(async () => {
        if (!jitsiContainerRef.current || !jwt || !roomName || apiRef.current) {
            return;
        }

        console.log("Attempting to initialize Jitsi API...");
        const scriptLoadedAndApiAvailable = await loadJitsiScript(); // This will now wait for window.JitsiMeetExternalAPI

        if (!scriptLoadedAndApiAvailable || !window.JitsiMeetExternalAPI) {
            console.error("Jitsi Meet External API is still not available after loading and check.");
            setJitsiApiLoaded(false); // Indicate failure
            return;
        }

        // If we reach here, JitsiMeetExternalAPI should definitely be on the window object
        setJitsiApiLoaded(true); // Indicate that Jitsi API is ready to be used

        const domain = '8x8.vc';
        const options = {
            roomName: roomName,
            jwt: jwt,
            parentNode: jitsiContainerRef.current,
            width: '100%',
            height: '100%',
            configOverwrite: {
                startWithVideoMuted: false,
                startWithAudioMuted: false,
                disableSimulcast: false,
                disableLocalVideoFlip: true,
                desktopSharingSources: ['screen', 'window'],
                prejoinPageEnabled: false,
            },
            interfaceConfigOverwrite: {
                DEFAULT_REMOTE_DISPLAY_NAME: 'New Participant',
                APP_NAME: 'MediBridge Consult',
                SHOW_JITSI_WATERMARK: false,
                SHOW_WATERMARK_FOR_GUESTS: false,
                HIDE_INVITE_MORE_BUTTON: true,
                TOOLBAR_BUTTONS: [
                    'microphone', 'camera', 'desktop', 'fullscreen',
                    'fodeviceselection', 'profile', 'chat',
                    'settings', 'raisehand', 'videoquality',
                    'tileview', 'mute-everyone', 'etherpad', 'sharedvideo',
                ],
            },
            userInfo: {
                displayName: userDisplayName,
                email: userEmail,
            },
        };

        try {
            const newApi = new window.JitsiMeetExternalAPI(domain, options);
            apiRef.current = newApi;

            newApi.addEventListener('readyToClose', () => {
                console.log('Jitsi API ready to close. Handling hangup...');
                onHangup();
            });

            newApi.addEventListener('participantLeft', (participant: any) => {
                console.log('Participant Left:', participant);
            });

            newApi.addEventListener('participantJoined', (participant: any) => {
                console.log('Participant Joined:', participant);
            });

            newApi.addEventListener('videoConferenceLeft', (data: any) => {
                console.log('Video conference left:', data);
                onHangup();
            });

            newApi.addEventListener('externalApiReady', () => {
                console.log('Jitsi External API Ready Event Fired');
                if (newApi.executeCommand) {
                    newApi.executeCommand('displayName', userDisplayName);
                    newApi.executeCommand('email', userEmail);
                }
            });

            console.log("Jitsi API initialized successfully.");

        } catch (error) {
            console.error("Error initializing Jitsi Meet External API instance:", error);
        }
    }, [roomName, jwt, onHangup, loadJitsiScript, userDisplayName, userEmail]);

    useEffect(() => {
        console.log("OnlineConsultation useEffect: Running Jitsi initialization...");
        initializeJitsi();

        return () => {
            console.log("OnlineConsultation useEffect Cleanup: Disposing Jitsi API...");
            if (apiRef.current) {
                apiRef.current.dispose();
                apiRef.current = null;
                console.log("Jitsi API disposed.");
            }
        };
    }, [initializeJitsi]);

    if (!jitsiApiLoaded && jitsiContainerRef.current) {
        return <div className="jitsi-loading">Loading video conference...</div>;
    }

    return (
    <div id="jitsi-container" ref={jitsiContainerRef} className="jitsi-container">
        {/* You can add a small overlay or fixed div for the room code */}
        <div style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            background: 'rgba(0,0,0,0.7)',
            color: 'white',
            padding: '5px 10px',
            borderRadius: '5px',
            fontSize: '0.9em',
            zIndex: 1000 // Ensure it's above Jitsi UI elements
        }}>
            Room Code: <strong>{roomName}</strong>
            {/* Optional: Add a copy button */}
            <button onClick={() => navigator.clipboard.writeText(roomName)} style={{ marginLeft: '10px', background: 'none', border: '1px solid white', color: 'white', cursor: 'pointer' }}>Copy</button>
        </div>
        {/* The Jitsi iframe will be injected here */}
    </div>
    );
};

export default OnlineConsultation;