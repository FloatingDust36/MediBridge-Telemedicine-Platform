import React, { useEffect, useState } from 'react';
import supabase from '../lib/supabaseClient';
import './DoctorProfile.css'; // Make sure this CSS file contains the popup styles
import { useNavigate } from 'react-router-dom';

// Define interfaces for data structure
interface UserProfileData {
    user_id: string;
    email: string;
    full_name: string;
    phone_number: string;
}

interface DoctorSpecificData {
    user_id: string;
    specialization: string;
    license_number: string;
    is_available: boolean;
    emergency_contact: string | null;
    first_name: string;
    last_name: string;
    middle_name: string | null;
}

// Combined type for the form
type ProfileData = UserProfileData & DoctorSpecificData;

// Interface for the Supabase query result (for type safety during fetch)
interface SupabaseProfileResult {
    user_id: string;
    specialization: string;
    license_number: string;
    is_available: boolean;
    emergency_contact: string | null;
    first_name: string;
    last_name: string;
    middle_name: string | null;
    users: { // Nested user data from the join
        email: string;
        full_name: string;
        phone_number: string;
    };
}

const DoctorProfile: React.FC = () => {
    const navigate = useNavigate();
    const [doctorData, setDoctorData] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [editMode, setEditMode] = useState<boolean>(false);
    const [editedData, setEditedData] = useState<ProfileData | null>(null);

    // ONLY THESE STATES ARE NEEDED FOR THE NEW POPUP SYSTEM
    const [popupMessage, setPopupMessage] = useState<string | null>(null);
    const [popupMessageType, setPopupMessageType] = useState<'success' | 'error' | null>(null);
    const [showPopup, setShowPopup] = useState<boolean>(false);

    // HELPER FUNCTION TO SHOW TEMPORARY POPUP
    const showTemporaryMessage = (msg: string, type: 'success' | 'error') => {
        setPopupMessage(msg);
        setPopupMessageType(type);
        setShowPopup(true);
        setTimeout(() => {
            setShowPopup(false);
            // Optional: Clear message content after animation completes
            setTimeout(() => {
                setPopupMessage(null);
                setPopupMessageType(null);
            }, 500); // This should match your CSS transition duration for opacity/top
        }, 3000); // Message visible for 3 seconds
    };

    useEffect(() => {
        const fetchDoctorProfile = async () => {
            setLoading(true);
            // Clear any existing popup message when fetching new data
            setPopupMessage(null);
            setPopupMessageType(null);
            setShowPopup(false);

            const { data: { session }, error: sessionError } = await supabase.auth.getSession();

            if (sessionError || !session) {
                // Using the new popup function
                showTemporaryMessage('Please log in to view your profile.', 'error');
                setLoading(false);
                navigate('/login');
                return;
            }

            const userId = session.user.id;

            const { data: profile, error: fetchError } = await supabase
                .from('doctors')
                .select(`
                    user_id,
                    specialization,
                    license_number,
                    is_available,
                    emergency_contact,
                    first_name,
                    last_name,
                    middle_name,
                    users!inner (
                        email,
                        full_name,
                        phone_number
                    )
                `)
                .eq('user_id', userId)
                .single<SupabaseProfileResult>();

            if (fetchError || !profile) {
                console.error('Error fetching doctor profile:', fetchError?.message);
                // Using the new popup function for errors
                showTemporaryMessage(`Failed to load profile data. Error: ${fetchError?.message}`, 'error');
                setLoading(false);
                return;
            }

            const userData = profile.users;

            const parseFullName = (fullName: string) => {
                const nameParts = fullName.trim().split(' ');
                if (nameParts.length === 1) {
                    return { first_name: nameParts[0], middle_name: '', last_name: '' };
                } else if (nameParts.length === 2) {
                    return { first_name: nameParts[0], middle_name: '', last_name: nameParts[1] };
                } else {
                    return {
                        first_name: nameParts[0],
                        middle_name: nameParts.slice(1, -1).join(' '),
                        last_name: nameParts[nameParts.length - 1]
                    };
                }
            };

            const parsedNames = parseFullName(userData.full_name || '');

            const combinedData: ProfileData = {
                user_id: profile.user_id,
                email: userData.email,
                full_name: userData.full_name,
                phone_number: userData.phone_number,
                first_name: profile.first_name || parsedNames.first_name,
                last_name: profile.last_name || parsedNames.last_name,
                middle_name: profile.middle_name || parsedNames.middle_name || null,
                specialization: profile.specialization,
                license_number: profile.license_number,
                is_available: profile.is_available,
                emergency_contact: profile.emergency_contact || null,
            };

            setDoctorData(combinedData);
            setEditedData(combinedData);
            setLoading(false);
        };

        fetchDoctorProfile();
    }, [navigate]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;

        setEditedData((prevData) => {
            if (!prevData) return prevData;
            return {
                ...prevData,
                [name]: type === 'checkbox' ? checked : value,
            };
        });
    };

    const handleSave = async () => {
        if (!editedData || !doctorData) {
            showTemporaryMessage('No data to save.', 'error');
            return;
        }

        setLoading(true);
        // Clear any existing popup message before attempting to save
        setPopupMessage(null);
        setPopupMessageType(null);
        setShowPopup(false);

        try {
            const newFullName = `${editedData.first_name} ${editedData.middle_name ? editedData.middle_name + ' ' : ''}${editedData.last_name}`.trim();

            const { error: userUpdateError } = await supabase
                .from('users')
                .update({
                    full_name: newFullName,
                    phone_number: editedData.phone_number,
                })
                .eq('user_id', editedData.user_id);

            if (userUpdateError) throw userUpdateError;

            const { error: doctorUpdateError } = await supabase
                .from('doctors')
                .update({
                    specialization: editedData.specialization,
                    license_number: editedData.license_number,
                    emergency_contact: editedData.emergency_contact,
                    is_available: editedData.is_available,
                    first_name: editedData.first_name,
                    last_name: editedData.last_name,
                    middle_name: editedData.middle_name,
                })
                .eq('user_id', editedData.user_id);

            if (doctorUpdateError) throw doctorUpdateError;

            setDoctorData(editedData);
            setEditMode(false);
            // Using the new popup function for success
            showTemporaryMessage('Profile updated successfully!', 'success');

            window.dispatchEvent(new Event('doctorProfileUpdated'));

        } catch (error: any) {
            console.error('Error updating profile:', error.message);
            // Using the new popup function for errors
            showTemporaryMessage('Failed to update profile: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setEditMode(false);
        setEditedData(doctorData); // Revert changes
        // Clear any popup message on cancel
        setPopupMessage(null);
        setPopupMessageType(null);
        setShowPopup(false);
    };

    if (loading) {
        return <div className="doctor-profile-loading">Loading Doctor Profile...</div>;
    }

    if (!doctorData) {
        // If there's an error message from fetch, display it using the popup mechanism
        // Only show the message if it's explicitly set by showTemporaryMessage
        return (
            <div className="doctor-profile-error">
                {popupMessage ? (
                    <div className={`popup-message-container ${popupMessageType} show`}>
                        {popupMessage}
                    </div>
                ) : (
                    'No doctor profile data found.' // Fallback if no specific popup message
                )}
            </div>
        );
    }

    const currentData = editMode ? editedData : doctorData;

    return (
        <div className="doctor-profile-container">
            {/* THIS IS THE ONLY PLACE WHERE THE POPUP MESSAGE JSX SHOULD BE */}
            {popupMessage && (
                <div className={`popup-message-container ${popupMessageType} ${showPopup ? 'show' : ''}`}>
                    {popupMessage}
                </div>
            )}

            <div className="doctor-profile-card">
                <div className="profile-header-area">
                    <h2 className="profile-title">Doctor Profile</h2>
                    {!editMode ? (
                        <button type="button" onClick={() => setEditMode(true)} className="edit-button">
                            Edit Profile
                        </button>
                    ) : (
                        <div className="edit-mode-buttons">
                            <button type="button" onClick={handleCancel} className="cancel-button">
                                Cancel
                            </button>
                            <button type="button" onClick={handleSave} className="submit-button" disabled={loading}>
                                {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    )}
                </div>

                <form onSubmit={(e) => e.preventDefault()} className="doctor-form-area">
                    {/* Email Field (Non-editable) - always from users table */}
                    <div className="form-group">
                        <div className="form-label">Email</div>
                        <div className="form-input-container">
                            <p className="profile-display-text">{currentData?.email || 'N/A'}</p>
                        </div>
                    </div>

                    {/* First Name Field */}
                    <div className="form-group">
                        <label htmlFor="first_name" className="form-label">First Name</label>
                        <div className="form-input-container">
                            {editMode ? (
                                <input
                                    type="text"
                                    id="first_name"
                                    name="first_name"
                                    value={currentData?.first_name || ''}
                                    onChange={handleChange}
                                    className="form-input"
                                    required
                                />
                            ) : (
                                <p className="profile-display-text">{currentData?.first_name || 'N/A'}</p>
                            )}
                        </div>
                    </div>

                    {/* Middle Name Field */}
                    <div className="form-group">
                        <label htmlFor="middle_name" className="form-label">Middle Name</label>
                        <div className="form-input-container">
                            {editMode ? (
                                <input
                                    type="text"
                                    id="middle_name"
                                    name="middle_name"
                                    value={currentData?.middle_name || ''}
                                    onChange={handleChange}
                                    className="form-input"
                                />
                            ) : (
                                <p className="profile-display-text">{currentData?.middle_name || 'N/A'}</p>
                            )}
                        </div>
                    </div>

                    {/* Last Name Field */}
                    <div className="form-group">
                        <label htmlFor="last_name" className="form-label">Last Name</label>
                        <div className="form-input-container">
                            {editMode ? (
                                <input
                                    type="text"
                                    id="last_name"
                                    name="last_name"
                                    value={currentData?.last_name || ''}
                                    onChange={handleChange}
                                    className="form-input"
                                    required
                                />
                            ) : (
                                <p className="profile-display-text">{currentData?.last_name || 'N/A'}</p>
                            )}
                        </div>
                    </div>

                    {/* License Number Field */}
                    <div className="form-group">
                        <label htmlFor="license_number" className="form-label">License Number</label>
                        <div className="form-input-container">
                            {editMode ? (
                                <input
                                    type="text"
                                    id="license_number"
                                    name="license_number"
                                    value={currentData?.license_number || ''}
                                    onChange={handleChange}
                                    className="form-input"
                                    required
                                />
                            ) : (
                                <p className="profile-display-text">{currentData?.license_number || 'N/A'}</p>
                            )}
                        </div>
                    </div>

                    {/* Specialization Field */}
                    <div className="form-group">
                        <label htmlFor="specialization" className="form-label">Specialization</label>
                        <div className="form-input-container">
                            {editMode ? (
                                <input
                                    type="text"
                                    id="specialization"
                                    name="specialization"
                                    value={currentData?.specialization || ''}
                                    onChange={handleChange}
                                    className="form-input"
                                    required
                                />
                            ) : (
                                <p className="profile-display-text">{currentData?.specialization || 'N/A'}</p>
                            )}
                        </div>
                    </div>

                    {/* Phone Number Field */}
                    <div className="form-group">
                        <label htmlFor="phone_number" className="form-label">Phone Number</label>
                        <div className="form-input-container">
                            {editMode ? (
                                <input
                                    type="tel"
                                    id="phone_number"
                                    name="phone_number"
                                    value={currentData?.phone_number || ''}
                                    onChange={handleChange}
                                    pattern="[0-9]{11}"
                                    placeholder="e.g. 09123456789"
                                    className="form-input"
                                    required
                                />
                            ) : (
                                <p className="profile-display-text">{currentData?.phone_number || 'N/A'}</p>
                            )}
                        </div>
                    </div>

                    {/* Is Available Toggle */}
                    <div className="form-group checkbox-group">
                        <label htmlFor="is_available" className="form-label">Available for Appointments</label>
                        <div className="form-input-container">
                            {editMode ? (
                                <input
                                    type="checkbox"
                                    id="is_available"
                                    name="is_available"
                                    checked={currentData?.is_available || false}
                                    onChange={handleChange}
                                    className="form-checkbox"
                                />
                            ) : (
                                <p className="profile-display-text">
                                    {currentData?.is_available ? 'Yes' : 'No'}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Emergency Contact Field */}
                    <div className="form-group">
                        <label htmlFor="emergency_contact" className="form-label">Emergency Contact</label>
                        <div className="form-input-container">
                            {editMode ? (
                                <input
                                    type="text"
                                    id="emergency_contact"
                                    name="emergency_contact"
                                    value={currentData?.emergency_contact || ''}
                                    onChange={handleChange}
                                    className="form-input"
                                />
                            ) : (
                                <p className="profile-display-text">{currentData?.emergency_contact || 'N/A'}</p>
                            )}
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DoctorProfile;