import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../lib/supabaseClient';
import './PatientProfile.css';

// Define the interface for PatientData, reflecting combined data from 'users' and 'patients' tables
interface PatientData {
  user_id: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  email: string; // From 'users' table
  date_of_birth: string; // Present in both 'patients' and 'users' in schema
  phone_number: string; // From 'users' table
  address: string; // Present in both 'patients' and 'users' in schema
  contact_number?: string; // From 'patients' table (patient-specific contact)
  emergency_contact?: string; // From 'patients' table
  allergies?: string; // From 'patients' table
}

const PatientProfile: React.FC = () => {
  const navigate = useNavigate();
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editedData, setEditedData] = useState<PatientData | null>(null);
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    fetchPatientData();
  }, []);

  const fetchPatientData = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        console.error('Session error:', sessionError?.message);
        navigate('/');
        return;
      }

      const userId = session.user.id;

      // Fetch from 'patients' table and join with 'users' to get email, phone_number, full_name, etc.
      // Ensure date_of_birth and address are fetched from both if they exist in both tables
      const { data: patientInfo, error: patientError } = await supabase
        .from('patients')
        .select(`
          user_id,
          first_name,
          last_name,
          middle_name,
          date_of_birth,
          address,
          contact_number,
          emergency_contact,
          allergies,
          users!inner(
            email,
            phone_number,
            full_name,
            date_of_birth,
            address
          )
        `)
        .eq('user_id', userId)
        .single();

      if (patientError || !patientInfo) {
        console.error('Error fetching patient profile:', patientError?.message);
        throw new Error('Failed to fetch patient data: ' + (patientError?.message || 'No data returned'));
      }

      // Extract user-specific data from the joined 'users' table
      const userData = (patientInfo as any).users || {};

      // Combine data into the PatientData interface
      // Prioritize data from 'patients' table for shared fields, fallback to 'users' table
      const combinedData: PatientData = {
        user_id: patientInfo.user_id,
        first_name: patientInfo.first_name || '',
        last_name: patientInfo.last_name || '',
        middle_name: patientInfo.middle_name || '',
        email: userData.email || '', // From users table
        date_of_birth: patientInfo.date_of_birth || userData.date_of_birth || '', // Prefer patients DOB, fallback users DOB
        phone_number: userData.phone_number || '', // From users table
        address: patientInfo.address || userData.address || '', // Prefer patients Address, fallback users Address
        contact_number: patientInfo.contact_number || '', // From patients table
        emergency_contact: patientInfo.emergency_contact || '', // From patients table
        allergies: patientInfo.allergies || '', // From patients table
      };

      setPatientData(combinedData);
      setEditedData(combinedData); // Initialize editedData with fetched data

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      console.error('Error fetching patient data:', errorMessage);
      setError('Failed to load patient profile. Please try again. ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedData(patientData); // Revert editedData to the last saved patientData
  };

  const handleSave = async () => {
    if (!editedData || !patientData) return;

    try {
      setSaving(true);

      // --- Update 'patients' table fields ---
      const { error: patientError } = await supabase
        .from('patients')
        .update({
          first_name: editedData.first_name,
          last_name: editedData.last_name,
          middle_name: editedData.middle_name,
          date_of_birth: editedData.date_of_birth, // Update patient's DOB
          address: editedData.address,             // Update patient's Address
          contact_number: editedData.contact_number,
          emergency_contact: editedData.emergency_contact,
          allergies: editedData.allergies,
        })
        .eq('user_id', patientData.user_id);

      if (patientError) throw patientError;

      // --- Update 'users' table fields (for Dashboard display consistency) ---
      // Construct full_name from edited first, middle, last names
      const newFullName = `${editedData.first_name} ${editedData.middle_name ? editedData.middle_name + ' ' : ''}${editedData.last_name}`;

      const { error: usersError } = await supabase
        .from('users')
        .update({
          full_name: newFullName,          // Update full_name for dashboard display
          phone_number: editedData.phone_number,
          date_of_birth: editedData.date_of_birth, // Also update user's DOB
          address: editedData.address,             // Also update user's Address
        })
        .eq('user_id', patientData.user_id);

      if (usersError) throw usersError;

      // Update local state with the saved data
      setPatientData(editedData);
      setIsEditing(false);
      alert('Profile updated successfully!');

      // --- CRITICAL CONNECTION POINT ---
      // Dispatch a custom event to notify other components (e.g., PatientDashboard) to refresh their data
      window.dispatchEvent(new Event('patientProfileUpdated'));

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      console.error('Error updating profile:', errorMessage);
      alert('Failed to update profile. Please try again: ' + errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof PatientData, value: string) => {
    if (editedData) {
      setEditedData({
        ...editedData,
        [field]: value,
      });
    }
  };

  const handleBackToDashboard = () => {
    navigate('/patientdashboard');
  };

  if (loading) {
    return <div className="patient-profile-loading">Loading patient profile...</div>;
  }

  if (error) {
    return (
      <div className="patient-profile-error">
        <p>Error: {error}</p>
        <button onClick={fetchPatientData}>Retry</button>
      </div>
    );
  }

  if (!patientData) {
    return <div className="patient-profile-no-data">No patient data available.</div>;
  }

  // Use editedData when in editing mode, otherwise use patientData
  const currentData = isEditing ? editedData : patientData;

  return (
    <div className="patient-profile-container">
      <div className="profile-header">
        <button className="back-button" onClick={handleBackToDashboard}>
          ← Back to Dashboard
        </button>
        <h1>Patient Profile</h1>
        {!isEditing ? (
          <button className="edit-button" onClick={handleEdit}>
            Edit Profile
          </button>
        ) : (
          <div className="edit-buttons">
            <button className="cancel-button" onClick={handleCancel}>
              Cancel
            </button>
            <button
              className="save-button"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        )}
      </div>

      <div className="profile-content">
        <div className="profile-section">
          <h2>Personal Information</h2>

          {/* Email is typically not editable from profile, managed by Auth */}
          <div className="profile-field">
            <label>Email:</label>
            <input
              type="email"
              value={currentData?.email || ''}
              disabled={true} // Email is read-only
              className="profile-input disabled"
            />
          </div>

          <div className="profile-field">
            <label>First Name:</label>
            <input
              type="text"
              value={currentData?.first_name || ''}
              disabled={!isEditing}
              className={`profile-input ${!isEditing ? 'disabled' : ''}`}
              onChange={(e) => handleInputChange('first_name', e.target.value)}
            />
          </div>

          <div className="profile-field">
            <label>Last Name:</label>
            <input
              type="text"
              value={currentData?.last_name || ''}
              disabled={!isEditing}
              className={`profile-input ${!isEditing ? 'disabled' : ''}`}
              onChange={(e) => handleInputChange('last_name', e.target.value)}
            />
          </div>

          <div className="profile-field">
            <label>Middle Name:</label>
            <input
              type="text"
              value={currentData?.middle_name || ''}
              disabled={!isEditing}
              className={`profile-input ${!isEditing ? 'disabled' : ''}`}
              onChange={(e) => handleInputChange('middle_name', e.target.value)}
            />
          </div>

          <div className="profile-field">
            <label>Date of Birth:</label>
            <input
              type="date"
              value={currentData?.date_of_birth || ''}
              disabled={!isEditing}
              className={`profile-input ${!isEditing ? 'disabled' : ''}`}
              onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
            />
          </div>

          <div className="profile-field">
            <label>Phone Number (from Users table):</label>
            <input
              type="tel"
              value={currentData?.phone_number || ''}
              disabled={!isEditing}
              className={`profile-input ${!isEditing ? 'disabled' : ''}`}
              onChange={(e) => handleInputChange('phone_number', e.target.value)}
            />
          </div>

          <div className="profile-field">
            <label>Address:</label>
            <textarea
              value={currentData?.address || ''}
              disabled={!isEditing}
              className={`profile-input ${!isEditing ? 'disabled' : ''}`}
              onChange={(e) => handleInputChange('address', e.target.value)}
              rows={3}
            />
          </div>

          <div className="profile-field">
            <label>Contact Number (Patient Specific):</label>
            <input
              type="text"
              value={currentData?.contact_number || ''}
              disabled={!isEditing}
              className={`profile-input ${!isEditing ? 'disabled' : ''}`}
              onChange={(e) => handleInputChange('contact_number', e.target.value)}
            />
          </div>

          <div className="profile-field">
            <label>Emergency Contact:</label>
            <input
              type="text"
              value={currentData?.emergency_contact || ''}
              disabled={!isEditing}
              className={`profile-input ${!isEditing ? 'disabled' : ''}`}
              onChange={(e) => handleInputChange('emergency_contact', e.target.value)}
            />
          </div>

          <div className="profile-field">
            <label>Allergies:</label>
            <textarea
              value={currentData?.allergies || ''}
              disabled={!isEditing}
              className={`profile-input ${!isEditing ? 'disabled' : ''}`}
              onChange={(e) => handleInputChange('allergies', e.target.value)}
              rows={3}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientProfile;