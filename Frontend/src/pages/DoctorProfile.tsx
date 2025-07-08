import React, { useState, useEffect } from 'react';
import supabase from '../lib/supabaseClient';
import './DoctorProfile.css';
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

const DoctorProfile: React.FC = () => {
  const navigate = useNavigate();
  const [doctorData, setDoctorData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);
  const [editedData, setEditedData] = useState<ProfileData | null>(null);

  useEffect(() => {
    const fetchDoctorProfile = async () => {
      setLoading(true);
      setMessage(null);

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        setMessage('Please log in to view your profile.');
        setLoading(false);
        navigate('/login');
        return;
      }

      const userId = session.user.id;

      // Fetch from 'doctors' table and join with 'users'
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
        .single();

      if (fetchError || !profile) {
        console.error('Error fetching doctor profile:', fetchError?.message);
        setMessage(`Failed to load profile data. Error: ${fetchError?.message}`);
        setLoading(false);
        return;
      }

      // Parse name from full_name if individual name fields are empty
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

      const parsedNames = parseFullName(profile.users.full_name || '');

      // Combine fetched data
      const combinedData: ProfileData = {
        user_id: profile.user_id,
        email: profile.users.email,
        full_name: profile.users.full_name,
        phone_number: profile.users.phone_number,
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
      setMessage('No data to save.');
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      // Construct full_name for the 'users' table update
      const newFullName = `${editedData.first_name} ${editedData.middle_name ? editedData.middle_name + ' ' : ''}${editedData.last_name}`.trim();

      // Update 'users' table - ONLY update fields that exist in your schema
      const { error: userUpdateError } = await supabase
        .from('users')
        .update({
          full_name: newFullName,
          phone_number: editedData.phone_number,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', editedData.user_id);

      if (userUpdateError) throw userUpdateError;

      // Update 'doctors' table
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
      setMessage('Profile updated successfully!');
      
      // Dispatch event to notify dashboard to refresh
      window.dispatchEvent(new Event('doctorProfileUpdated'));

    } catch (error: any) {
      console.error('Error updating profile:', error.message);
      setMessage('Failed to update profile: ' + error.message);
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleCancel = () => {
    setEditMode(false);
    setEditedData(doctorData);
    setMessage(null);
  };

  if (loading) {
    return <div className="doctor-profile-loading">Loading Doctor Profile...</div>;
  }

  if (!doctorData) {
    return <div className="doctor-profile-error">{message || 'No doctor profile data found.'}</div>;
  }

  const currentData = editMode ? editedData : doctorData;

  return (
    <div className="doctor-profile-container">
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

        {message && (
          <div className={`profile-message ${message.includes('successfully') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        <form onSubmit={(e) => e.preventDefault()} className="doctor-form-area">
          {/* Email Field (Non-editable) */}
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
            <label htmlFor="is_available" className="form-label">Available for appointments</label>
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