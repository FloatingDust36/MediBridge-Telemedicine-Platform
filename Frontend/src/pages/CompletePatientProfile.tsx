import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import supabase from '../lib/supabaseClient';

const CompletePatientProfile: React.FC = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);

  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [address, setAddress] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [allergies, setAllergies] = useState('');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
  const fetchUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user ?? null);
  };
  fetchUser();
}, []);

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!user) {
    alert('User not logged in');
    return;
  }

  const userId = user.id;
  const email = user.email;

  const { error: userError } = await supabase
  .from('users')
  .upsert(
    [
      {
        user_id: userId,
        email: email, 
        full_name: `${firstName} ${middleName} ${lastName}`,
        date_of_birth: dateOfBirth,
        address,
        phone_number: contactNumber,
        role: 'patient',
      },
    ],
    { onConflict: 'user_id' }
  );

  if (userError) {
    console.error('Error updating user table:', userError.message);
    alert('Failed to update user information.');
    return;
  }

  const { error: patientError } = await supabase
    .from('patients')
    .upsert(
      [
        {
          user_id: userId,
          last_name: lastName,
          first_name: firstName,
          middle_name: middleName,
          date_of_birth: dateOfBirth,
          address,
          contact_number: contactNumber,
          emergency_contact: emergencyContact,
          allergies,
        },
      ],
      { onConflict: 'user_id' } 
    );

  if (patientError) {
    console.error('Error inserting patient details:', patientError.message);
    alert('Failed to save patient details.');
    return;
  }

  navigate('/patientdashboard');
};

  const styles: { [key: string]: React.CSSProperties } = {
    patientProfileContainerWrapper: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#f0f2f5',
      padding: '60px',
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
      fontFamily: 'Roboto, sans-serif',
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
      position: 'relative',
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
  };

   return (
    <div style={styles.patientProfileContainerWrapper}>
      <div style={styles.patientProfileCard}>
        <h2 style={styles.profileTitle}>Complete Your Patient Profile</h2>
        <form onSubmit={handleSubmit} style={styles.profileFormArea}>
          <div style={styles.formGroup}>
            <label htmlFor="lastName" style={styles.formLabel}>Last Name</label>
            <div style={styles.formInputContainer}>
              <input type="text" id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Enter your Last name" style={styles.formInput} required />
            </div>
          </div>
          <div style={styles.formGroup}>
            <label htmlFor="firstName" style={styles.formLabel}>First Name</label>
            <div style={styles.formInputContainer}>
              <input type="text" id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Enter your First name" style={styles.formInput} required />
            </div>
          </div>
          <div style={styles.formGroup}>
            <label htmlFor="middleName" style={styles.formLabel}>Middle Name</label>
            <div style={styles.formInputContainer}>
              <input type="text" id="middleName" value={middleName} onChange={(e) => setMiddleName(e.target.value)} placeholder="Enter your Middle name" style={styles.formInput} />
            </div>
          </div>
          <div style={styles.formGroup}>
            <label htmlFor="dateOfBirth" style={styles.formLabel}>Date of Birth</label>
            <div style={styles.formInputContainer}>
              <input type="date" id="dateOfBirth" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} placeholder="mm/dd/yyyy" style={{ ...styles.formInput, paddingRight: '30px' }} required />
              <div style={styles.calendarIcon}></div>
            </div>
          </div>
          <div style={styles.formGroup}>
            <label htmlFor="address" style={styles.formLabel}>Address</label>
            <div style={styles.formInputContainer}>
              <input type="text" id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, City, Province" style={styles.formInput} required />
            </div>
          </div>
          <div style={styles.formGroup}>
            <label htmlFor="contactNumber" style={styles.formLabel}>Contact Number</label>
            <div style={styles.formInputContainer}>
              <input type="tel" id="contactNumber" value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} pattern="[0-9]{11}" placeholder="e.g. 09123456789" style={styles.formInput} required />
            </div>
          </div>
          <div style={styles.formGroup}>
            <label htmlFor="emergencyContact" style={styles.formLabel}>Emergency Contact</label>
            <div style={styles.formInputContainer}>
              <input type="text" id="emergencyContact" value={emergencyContact} onChange={(e) => setEmergencyContact(e.target.value)} placeholder="Name & Number" style={styles.formInput} />
            </div>
          </div>
          <div style={styles.formGroup}>
            <label htmlFor="allergies" style={styles.formLabel}>Allergies</label>
            <div style={styles.formInputContainer}>
              <input type="text" id="allergies" value={allergies} onChange={(e) => setAllergies(e.target.value)} placeholder="e.g. Penicillin, Seafood" style={styles.formInput} />
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