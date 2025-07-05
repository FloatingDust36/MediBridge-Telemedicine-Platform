// src/pages/DoctorProfile.tsx

import React, { useState, useEffect } from 'react';
import './DoctorProfile.css'; // Import the CSS for this component

const DoctorProfile: React.FC = () => {
  // Mock data for display and editing
  const MOCK_DOCTOR_DATA = {
    user_id: 'doctor-id-456',
    first_name: 'Alice',
    last_name: 'Smith',
    middle_name: 'Joy',
    email: 'alice.smith@example.com',
    license_number: 'DR12345',
    specialization: 'Pediatrician',
    contact_number: '09123456789',
    emergency_contact: 'Bob Smith - 09987654321', // This field will be moved in display
    is_available: true,
  };

  const [doctorData, setDoctorData] = useState(MOCK_DOCTOR_DATA);
  const [loading, setLoading] = useState<boolean>(true);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    // Simulate fetching data
    const timer = setTimeout(() => {
      setLoading(false);
      setMessage(null);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDoctorData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Simulating save:', doctorData);
    setEditMode(false);
    setMessage('Profile updated successfully (local changes only)!');
    setTimeout(() => setMessage(null), 3000); // Clear message after 3 seconds
  };

  if (loading) {
    return <div className="doctor-profile-loading">Loading Doctor Profile...</div>;
  }

  return (
    <div className="doctor-profile-container">
      <div className="doctor-profile-card">
        {/* New Header Area for Title and Edit Profile Button */}
        <div className="profile-header-area">
          <h2 className="profile-title">Doctor Profile</h2>
          {!editMode && (
            <button type="button" onClick={() => setEditMode(true)} className="edit-button">
              Edit Profile
            </button>
          )}
        </div>

        {message && (
          <div className={`profile-message ${message.includes('successfully') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="doctor-form-area">
          {/* Last Name Field */}
          <div className="form-group">
            <label htmlFor="last_name" className="form-label">Last Name</label>
            <div className="form-input-container">
              {editMode ? (
                <input
                  type="text"
                  id="last_name"
                  name="last_name"
                  value={doctorData.last_name}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              ) : (
                <p className="profile-display-text">{doctorData.last_name}</p>
              )}
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
                  value={doctorData.first_name}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              ) : (
                <p className="profile-display-text">{doctorData.first_name}</p>
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
                  value={doctorData.middle_name}
                  onChange={handleChange}
                  className="form-input"
                />
              ) : (
                <p className="profile-display-text">{doctorData.middle_name || 'N/A'}</p>
              )}
            </div>
          </div>

          {/* Email Field (Non-editable) */}
          <div className="form-group">
            <div className="form-label">Email</div>
            <div className="form-input-container">
              <p className="profile-display-text">{doctorData.email}</p>
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
                  value={doctorData.license_number}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              ) : (
                <p className="profile-display-text">{doctorData.license_number}</p>
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
                  value={doctorData.specialization}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              ) : (
                <p className="profile-display-text">{doctorData.specialization}</p>
              )}
            </div>
          </div>

          {/* Contact Number Field */}
          <div className="form-group">
            <label htmlFor="contact_number" className="form-label">Contact Number</label>
            <div className="form-input-container">
              {editMode ? (
                <input
                  type="tel"
                  id="contact_number"
                  name="contact_number"
                  value={doctorData.contact_number}
                  onChange={handleChange}
                  pattern="[0-9]{11}"
                  placeholder="e.g. 09123456789"
                  className="form-input"
                  required
                />
              ) : (
                <p className="profile-display-text">{doctorData.contact_number}</p>
              )}
            </div>
          </div>

          {/* EMERGENCY CONTACT FIELD - AT THE BOTTOM */}
          <div className="form-group">
            <label htmlFor="emergency_contact" className="form-label">Emergency Contact</label>
            <div className="form-input-container">
              {editMode ? (
                <input
                  type="text"
                  id="emergency_contact"
                  name="emergency_contact"
                  value={doctorData.emergency_contact}
                  onChange={handleChange}
                  className="form-input"
                />
              ) : (
                <p className="profile-display-text">{doctorData.emergency_contact || 'N/A'}</p>
              )}
            </div>
          </div>

          {/* Action Buttons (Save/Cancel only visible in edit mode) */}
          {editMode && (
            <div className="profile-actions">
              <button type="submit" className="submit-button">Save Changes</button>
              <button type="button" onClick={() => setEditMode(false)} className="cancel-button">Cancel</button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default DoctorProfile;