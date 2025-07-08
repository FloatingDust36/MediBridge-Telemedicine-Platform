import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../lib/supabaseClient';
import './PatientProfile.css';

interface PatientData {
  user_id: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  email: string; // This will come from the 'users' table
  date_of_birth: string; // This will come from the 'patients' table
  phone_number: string; // This will come from the 'users' table
  address: string; // This will come from the 'patients' table
  contact_number?: string; // This is a distinct field in 'patients' table
  emergency_contact?: string;
  allergies?: string;
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
            phone_number
          )
        `)
        .eq('user_id', userId)
        .single();

      if (patientError || !patientInfo) {
        console.error('Error fetching patient profile:', patientError?.message);
        throw new Error('Failed to fetch patient data: ' + (patientError?.message || 'No data returned'));
      }

      // Access the nested users object safely (following DoctorProfile pattern)
      const userData = (patientInfo as any).users || {};

      // Build the combined data with proper null checks
      const combinedData: PatientData = {
        user_id: patientInfo.user_id,
        first_name: patientInfo.first_name || '',
        last_name: patientInfo.last_name || '',
        middle_name: patientInfo.middle_name || '',
        email: userData.email || '',
        date_of_birth: patientInfo.date_of_birth || '',
        phone_number: userData.phone_number || '',
        address: patientInfo.address || '',
        contact_number: patientInfo.contact_number || '',
        emergency_contact: patientInfo.emergency_contact || '',
        allergies: patientInfo.allergies || '',
      };

      setPatientData(combinedData);
      setEditedData(combinedData);

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
    setEditedData(patientData);
  };

  const handleSave = async () => {
    if (!editedData || !patientData) return;

    try {
      setSaving(true);

      const { error: patientError } = await supabase
        .from('patients')
        .update({
          first_name: editedData.first_name,
          last_name: editedData.last_name,
          middle_name: editedData.middle_name,
          date_of_birth: editedData.date_of_birth,
          address: editedData.address,
          contact_number: editedData.contact_number,
          emergency_contact: editedData.emergency_contact,
          allergies: editedData.allergies,
        })
        .eq('user_id', patientData.user_id);

      if (patientError) throw patientError;

      const { error: usersError } = await supabase
        .from('users')
        .update({
          phone_number: editedData.phone_number,
        })
        .eq('user_id', patientData.user_id);

      if (usersError) throw usersError;

      setPatientData(editedData);
      setIsEditing(false);
      alert('Profile updated successfully!');

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

          <div className="profile-field">
            <label>Email:</label>
            <input
              type="email"
              value={currentData?.email || ''}
              disabled={true}
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
            <label>Phone Number:</label>
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