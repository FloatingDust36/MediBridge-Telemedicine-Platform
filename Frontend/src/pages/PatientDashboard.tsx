// src/pages/PatientDashboard.tsx
import { Link } from "react-router-dom";
import supabase from '../lib/supabaseClient';
import React, { useState, useEffect, useCallback, useRef } from "react";
import "./PatientDashboard.css";
import logo from '../assets/MediBridge_LogoClear.png'; // Assuming this is a placeholder or default image

// Utility function (still useful for full profile, but less relevant for just pic)
function parseFullName(fullName: string) {
    const parts = fullName.split(' ').filter(p => p.trim() !== '');
    let firstName = '';
    let middleName = '';
    let lastName = '';

    if (parts.length === 1) {
        firstName = parts[0];
    } else if (parts.length === 2) {
        firstName = parts[0];
        lastName = parts[1];
    } else if (parts.length >= 3) {
        firstName = parts[0];
        lastName = parts[parts.length - 1];
        middleName = parts.slice(1, parts.length - 1).join(' ');
    }

    return {
        first_name: firstName,
        middle_name: middleName,
        last_name: lastName
    };
}

const PatientDashboardSection: React.FC<{ data: any }> = ({ data }) => {
    if (!data) return <div style={{ color: 'black' }}>Loading patient info...</div>;

    return (
        <div className="card-base patient-dashboard-section">
            <h3 className="patient-dashboard-section-title">📈 Patient Overview</h3>
            <div className="card-content patient-dashboard-section-content">
                <p><strong>Name:</strong> {data.full_name}</p>
                <p><strong>Age:</strong> {
                    data.date_of_birth
                        ? `${Math.floor((new Date().getTime() - new Date(data.date_of_birth).getTime()) / (1000 * 60 * 60 * 24 * 365.25))} years`
                        : 'N/A'
                }</p>
                <p><strong>Address:</strong> {data.address}</p>
                <p><strong>Contact:</strong> {data.contact_number}</p>
                <p><strong>Emergency Contact:</strong> {data.emergency_contact}</p>
                <p><strong>Allergies:</strong> {data.allergies || 'None reported'}</p>
            </div>
        </div>
    );
};

const ConsultationAppointmentsSection: React.FC = () => {
    return (
        <div className="card-base consultation-section">
            <h3 className="consultation-section-title">🗓️ Consultation Appointments</h3>
            <div className="card-content">
                <p>No appointments to display.</p>
            </div>
        </div>
    );
};

interface ProfilePictureUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    currentProfilePicUrl: string | null;
    onUploadSuccess: (newUrl: string) => void;
}

const ProfilePictureUploadModal: React.FC<ProfilePictureUploadModalProps> = ({ isOpen, onClose, userId, currentProfilePicUrl, onUploadSuccess }) => {
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(currentProfilePicUrl);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setPreviewUrl(currentProfilePicUrl); // Update preview if currentProfilePicUrl changes
    }, [currentProfilePicUrl]);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setPreviewUrl(URL.createObjectURL(selectedFile)); // Create a local URL for preview
        }
    };

    const handleUpload = async () => {
        if (!file) {
            alert('Please select an image to upload.');
            return;
        }

        setUploading(true);
        const fileExtension = file.name.split('.').pop();
        const fileName = `${userId}_profile_pic_${Date.now()}.${fileExtension}`; // Unique file name
        const filePath = `profile_pictures/${fileName}`; // Folder in your Supabase Storage bucket

        try {
            // Upload the new file
            const { data, error: uploadError } = await supabase.storage
                .from('medibridge_images') // Replace with your actual bucket name
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false // Set to true if you want to overwrite if file with same name exists
                });

            if (uploadError) {
                throw uploadError;
            }

            // Get the public URL of the uploaded file
            const { data: publicUrlData } = supabase.storage
                .from('medibridge_images') // Replace with your actual bucket name
                .getPublicUrl(filePath);

            if (!publicUrlData || !publicUrlData.publicUrl) {
                throw new Error('Failed to get public URL for the uploaded image.');
            }

            const newProfilePicUrl = publicUrlData.publicUrl;

            // Update the user's profile_picture_url in the 'users' table
            const { error: dbUpdateError } = await supabase
                .from('users')
                .update({ profile_picture_url: newProfilePicUrl })
                .eq('user_id', userId);

            if (dbUpdateError) {
                // If DB update fails, you might want to delete the uploaded file from storage
                // const { error: deleteError } = await supabase.storage.from('medibridge_images').remove([filePath]);
                // if (deleteError) console.error('Failed to clean up uploaded file:', deleteError.message);
                throw dbUpdateError;
            }

            // Delete old profile picture if it exists and is different from default/placeholder
            if (currentProfilePicUrl && currentProfilePicUrl !== logo) {
                 // Extract path from public URL
                const oldFilePathMatch = currentProfilePicUrl.match(/\/public\/(.*)/);
                if (oldFilePathMatch && oldFilePathMatch[1]) {
                    const oldFilePath = oldFilePathMatch[1];
                    console.log("Attempting to remove old file:", oldFilePath);
                    const { error: deleteOldError } = await supabase.storage.from('medibridge_images').remove([oldFilePath]);
                    if (deleteOldError) {
                        console.warn('Could not delete old profile picture:', deleteOldError.message);
                    }
                } else {
                    console.warn("Could not parse old profile picture URL for deletion:", currentProfilePicUrl);
                }
            }


            onUploadSuccess(newProfilePicUrl); // Notify parent component to re-fetch/update state
            alert('Profile picture updated successfully!');
            onClose(); // Close modal
            setFile(null); // Clear file input
            if (fileInputRef.current) {
                fileInputRef.current.value = ''; // Clear file input visual
            }

        } catch (error: any) {
            console.error('Error uploading profile picture:', error.message);
            alert('Failed to upload profile picture: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Change Profile Picture</h2>
                <div className="profile-pic-preview-container">
                    <img
                        src={previewUrl || logo} // Show selected file preview or current/default
                        alt="Profile Preview"
                        className="profile-pic-preview"
                    />
                </div>
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    ref={fileInputRef}
                    className="file-input"
                />
                <div className="modal-actions">
                    <button onClick={handleUpload} disabled={!file || uploading} className="save-button">
                        {uploading ? 'Uploading...' : 'Upload & Save'}
                    </button>
                    <button type="button" onClick={() => {
                        setFile(null); // Clear selected file on cancel
                        setPreviewUrl(currentProfilePicUrl); // Reset preview to current
                        if (fileInputRef.current) {
                            fileInputRef.current.value = '';
                        }
                        onClose();
                    }} className="cancel-button">Cancel</button>
                </div>
            </div>
        </div>
    );
};


const PatientDashboard: React.FC = () => {
    const [patientData, setPatientData] = useState<any>(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [isProfilePicModalOpen, setIsProfilePicModalOpen] = useState(false);
    const [profilePicUrl, setProfilePicUrl] = useState<string | null>(null);


    const fetchAllDashboardData = useCallback(async (userId: string) => {
        try {
            // 1. Fetch user profile data
            const { data: userProfile, error: userError } = await supabase
                .from('users')
                .select('full_name, email, phone_number, date_of_birth, address, role, profile_picture_url')
                .eq('user_id', userId)
                .single();

            if (userError) {
                console.error('Error fetching user info:', userError.message);
            }

            // 2. Fetch patient-specific details
            const { data: patientDetails, error: patientError } = await supabase
                .from('patients')
                .select('first_name, last_name, middle_name, contact_number, emergency_contact, allergies')
                .eq('user_id', userId)
                .single();

            // Combine user and patient data
            if (userProfile || patientDetails) {
                const patientFullName = userProfile?.full_name || `${patientDetails?.first_name || ''} ${patientDetails?.middle_name || ''} ${patientDetails?.last_name || ''}`.trim();
                const parsedNames = parseFullName(patientFullName);

                setPatientData({
                    user_id: userId,
                    full_name: patientFullName,
                    email: userProfile?.email || '',
                    phone_number: userProfile?.phone_number || '',
                    date_of_birth: userProfile?.date_of_birth || '',
                    address: userProfile?.address || '',
                    role: userProfile?.role || 'patient',
                    profile_picture_url: userProfile?.profile_picture_url || null,

                    first_name: patientDetails?.first_name || parsedNames.first_name,
                    last_name: patientDetails?.last_name || parsedNames.last_name,
                    middle_name: patientDetails?.middle_name || parsedNames.middle_name,
                    contact_number: patientDetails?.contact_number || userProfile?.phone_number || '',
                    emergency_contact: patientDetails?.emergency_contact || '',
                    allergies: patientDetails?.allergies || '',
                });
                setProfilePicUrl(userProfile?.profile_picture_url || null);
            } else {
                setPatientData(null);
                setProfilePicUrl(null);
            }

            // Removed: Fetching consultation notes
            // Removed: Fetching personal notes

        } catch (err: any) {
            console.error('Failed to fetch dashboard data:', err.message);
        }
    }, []);

    useEffect(() => {
        const getSessionAndFetch = async () => {
            const { data: { session }, error } = await supabase.auth.getSession();
            const userId = session?.user?.id;

            if (error || !userId) {
                console.error('No user session found or error:', error?.message);
                setPatientData(null);
                setCurrentUserId(null);
                return;
            }
            setCurrentUserId(userId);
            fetchAllDashboardData(userId);

            // Removed: Realtime listener for consultation_notes
            // Removed: Realtime listener for personal_notes

            // Realtime listener for `users` table for profile picture changes
            const usersChannel = supabase
                .channel(`users_profile_pic_${userId}`)
                .on('postgres_changes', {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'users',
                    filter: `user_id=eq.${userId}`
                }, (payload: any) => {
                    // Check if profile_picture_url changed
                    if (payload.new.profile_picture_url !== payload.old.profile_picture_url) {
                        console.log('Profile picture updated via realtime:', payload.new.profile_picture_url);
                        setProfilePicUrl(payload.new.profile_picture_url);
                        // Also update patientData to keep it consistent
                        setPatientData((prev: any) => ({
                            ...prev,
                            profile_picture_url: payload.new.profile_picture_url
                        }));
                    }
                })
                .subscribe();


            return () => {
                usersChannel.unsubscribe(); // Unsubscribe from users channel
            };
        };

        getSessionAndFetch();
    }, [fetchAllDashboardData]);


    // Timer for current time display
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const formattedDate = currentTime.toLocaleDateString('en-US', {
        day: '2-digit', month: 'long', year: 'numeric',
    });

    const formattedTime = currentTime.toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit', hour12: true,
    });

    const handleProfilePicUploadSuccess = useCallback((newUrl: string) => {
        setProfilePicUrl(newUrl);
        setPatientData((prev: any) => ({
            ...prev,
            profile_picture_url: newUrl
        }));
    }, []);


    return (
        <div className="main-content-area">
            <div className="top-info-bar">
                <h1 className="page-title">Patient Dashboard</h1>
                <div className="welcome-and-profile">
                    {/* Make only the image container clickable */}
                    <div className="profile-image-container clickable-profile-pic" onClick={() => setIsProfilePicModalOpen(true)}>
                        <img src={profilePicUrl || logo} alt="Patient" className="profile-image" />
                    </div>
                    <div className="welcome-text-group">
                        <span className="medical-profile-label">Medical Profile</span>
                        <span className="welcome-message">Welcome, {patientData?.full_name || 'Patient'}</span>
                    </div>
                </div>
                <div className="current-timestamp">{`${formattedTime} · ${formattedDate}`}</div>
            </div>

            <section className="dashboard-section card-margin-bottom">
                <PatientDashboardSection data={patientData} />
            </section>
            {/* Removed: Personal Notes Section */}
            {/* Removed: Consultation Notes Section */}
            <section className="consultation-section card-margin-bottom">
                <ConsultationAppointmentsSection />
            </section>

            {/* Render the Profile Picture Upload Modal */}
            {currentUserId && ( // Only render if userId is available
                <ProfilePictureUploadModal
                    isOpen={isProfilePicModalOpen}
                    onClose={() => setIsProfilePicModalOpen(false)}
                    userId={currentUserId}
                    currentProfilePicUrl={profilePicUrl}
                    onUploadSuccess={handleProfilePicUploadSuccess}
                />
            )}
        </div>
    );
};

export default PatientDashboard;