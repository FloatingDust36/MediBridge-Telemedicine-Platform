// src/pages/CompleteDoctorProfile.tsx
import React from 'react';
import './CompleteDoctorProfile.css'; // Import the new CSS file

const CompleteDoctorProfile: React.FC = () => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle doctor profile submission logic here
    console.log('Doctor Profile Submitted!');
    // Redirect to doctor dashboard or another relevant page
  };

  return (
    <div className="doctor-profile-container">
      <div className="doctor-profile-card">
        <div className="profile-title">Complete Your Profile</div>
        <form onSubmit={handleSubmit} className="doctor-form-area">
          <div className="form-group">
            <div className="form-label">Last Name</div>
            <div className="form-input-container">
              <input type="text" placeholder="Enter your Last name" className="form-input" required />
            </div>
          </div>
          <div className="form-group">
            <div className="form-label">First Name</div>
            <div className="form-input-container">
              <input type="text" placeholder="Enter your First name" className="form-input" required />
            </div>
          </div>
          <div className="form-group">
            <div className="form-label">Middle Name</div>
            <div className="form-input-container">
              <input type="text" placeholder="Enter your Middle name" className="form-input" />
            </div>
          </div>
          <div className="form-group">
            <div className="form-label">Doctor License</div>
            <div className="form-input-container">
              <input type="text" placeholder="License No." className="form-input" required />
            </div>
          </div>
          <div className="form-group">
            <div className="form-label">Speciality</div>
            <div className="form-input-container">
              <input type="text" placeholder="e.g. Cardiologist" className="form-input" required />
            </div>
          </div>
          <div className="form-group">
            <div className="form-label">Contact Number</div>
            <div className="form-input-container">
              <input type="tel" pattern="[0-9]{11}" placeholder="e.g. 09123456789" className="form-input" required />
            </div>
          </div>
          <div className="form-group">
            <div className="form-label">Emergency Contact</div>
            <div className="form-input-container">
              <input type="text" placeholder="Name & Number" className="form-input" />
            </div>
          </div>
          <button type="submit" className="submit-button">
            Submit
          </button>
        </form>
      </div>
    </div>
  );
};

export default CompleteDoctorProfile;