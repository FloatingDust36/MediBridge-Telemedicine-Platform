// src/pages/CompletePatientProfile.tsx
import React from 'react';
// import './CompletePatientProfile.css'; // REMOVE OR COMMENT OUT THIS LINE TEMPORARILY

const CompletePatientProfile: React.FC = () => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Patient Profile Submitted!');
    // Handle patient profile submission logic here
  };

  // Define inline styles directly in the component
  const styles: { [key: string]: React.CSSProperties } = {
    patientProfileContainerWrapper: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#f0f2f5',
      padding: '20px',
      boxSizing: 'border-box',
    },
    patientProfileCard: {
      width: '576px',
      minHeight: '600px',
      maxHeight: '95vh',
      background: 'linear-gradient(to bottom, rgba(178, 245, 239, 0.2), rgba(245, 245, 245, 0.2))',
      borderRadius: '12px',
      boxShadow: '0px 4px 15px rgba(0, 0, 0, 0.1)',
      display: 'flex',
      flexDirection: 'column',
      padding: '32px',
      boxSizing: 'border-box',
      overflow: 'hidden',
    },
    profileTitle: {
      fontSize: '28px',
      fontWeight: 'bold',
      fontFamily: 'Roboto, sans-serif', // Ensure Roboto is loaded globally or remove if not needed
      color: '#333',
      marginBottom: '25px',
      textAlign: 'left',
    },
    profileFormArea: {
      flexGrow: 1,
      display: 'flex',
      flexDirection: 'column',
      gap: '18px',
      overflowY: 'auto',
      paddingRight: '15px',
      marginBottom: '25px',
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
      width: '100%',
    },
    formLabel: {
      fontSize: '15px',
      fontWeight: '500',
      fontFamily: 'Roboto, sans-serif',
      color: '#555',
    },
    formInputContainer: {
      width: '100%',
      height: '44px',
      backgroundColor: 'white',
      borderRadius: '6px',
      border: '1px solid #e0e0e0',
      display: 'flex',
      alignItems: 'center',
      padding: '0 12px',
      boxSizing: 'border-box',
      transition: 'border-color 0.2s ease-in-out',
      position: 'relative', // Needed for calendar icon positioning
    },
    formInput: {
      flexGrow: 1,
      border: 'none',
      background: 'transparent',
      fontSize: '16px',
      fontFamily: 'Roboto, sans-serif',
      color: '#333',
      outline: 'none',
      padding: '0',
      boxSizing: 'border-box',
    },
    // No specific inline style for ::placeholder or ::-webkit-calendar-picker-indicator
    // as they cannot be applied inline. We'll rely on global/external CSS for these if needed.
    calendarIcon: {
      position: 'absolute',
      right: '12px',
      top: '50%',
      transform: 'translateY(-50%)',
      width: '20px',
      height: '20px',
      background: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-calendar"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>') no-repeat center center`,
      backgroundSize: 'contain',
      pointerEvents: 'none',
      color: '#888',
    },
    submitButton: {
      width: '120px',
      height: '48px',
      backgroundColor: '#2563eb',
      borderRadius: '6px',
      boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
      color: 'white',
      fontSize: '18px',
      fontWeight: 'bold',
      fontFamily: 'Roboto, sans-serif',
      border: 'none',
      cursor: 'pointer',
      transition: 'background-color 0.3s ease, transform 0.2s ease',
      alignSelf: 'flex-start',
    },
    // Note: :hover and :active states cannot be applied via inline styles.
  };

  return (
    <div style={styles.patientProfileContainerWrapper}>
      <div style={styles.patientProfileCard}>
        <h2 style={styles.profileTitle}>Complete Your Patient Profile</h2>
        <form onSubmit={handleSubmit} style={styles.profileFormArea}>
          <div style={styles.formGroup}>
            <label htmlFor="lastName" style={styles.formLabel}>Last Name</label>
            <div style={styles.formInputContainer}>
              <input type="text" id="lastName" placeholder="Enter your Last name" style={styles.formInput} required />
            </div>
          </div>
          <div style={styles.formGroup}>
            <label htmlFor="firstName" style={styles.formLabel}>First Name</label>
            <div style={styles.formInputContainer}>
              <input type="text" id="firstName" placeholder="Enter your First name" style={styles.formInput} required />
            </div>
          </div>
          <div style={styles.formGroup}>
            <label htmlFor="middleName" style={styles.formLabel}>Middle Name</label>
            <div style={styles.formInputContainer}>
              <input type="text" id="middleName" placeholder="Enter your Middle name" style={styles.formInput} />
            </div>
          </div>
          <div style={styles.formGroup}>
            <label htmlFor="dateOfBirth" style={styles.formLabel}>Date of Birth</label>
            <div style={styles.formInputContainer}>
              {/* Special handling for date input, inline styles can't override all native date picker styles */}
              <input type="date" id="dateOfBirth" placeholder="mm/dd/yyyy" style={{...styles.formInput, paddingRight: '30px'}} required />
              <div style={styles.calendarIcon}></div>
            </div>
          </div>
          <div style={styles.formGroup}>
            <label htmlFor="address" style={styles.formLabel}>Address</label>
            <div style={styles.formInputContainer}>
              <input type="text" id="address" placeholder="Street, City, Province" style={styles.formInput} required />
            </div>
          </div>
          <div style={styles.formGroup}>
            <label htmlFor="contactNumber" style={styles.formLabel}>Contact Number</label>
            <div style={styles.formInputContainer}>
              <input type="tel" id="contactNumber" pattern="[0-9]{11}" placeholder="e.g. 09123456789" style={styles.formInput} required />
            </div>
          </div>
          <div style={styles.formGroup}>
            <label htmlFor="emergencyContact" style={styles.formLabel}>Emergency Contact</label>
            <div style={styles.formInputContainer}>
              <input type="text" id="emergencyContact" placeholder="Name & Number" style={styles.formInput} />
            </div>
          </div>
          <div style={styles.formGroup}>
            <label htmlFor="allergies" style={styles.formLabel}>Allergies</label>
            <div style={styles.formInputContainer}>
              <input type="text" id="allergies" placeholder="e.g. Penicillin, Seafood" style={styles.formInput} />
            </div>
          </div>
          <button type="submit" style={styles.submitButton}>
            Submit
          </button>
        </form>
      </div>
    </div>
  );
};

export default CompletePatientProfile;