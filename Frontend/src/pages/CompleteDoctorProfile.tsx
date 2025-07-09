import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../lib/supabaseClient';
import './CompleteDoctorProfile.css'; // Keep this for pseudo-classes and media queries

const CompleteDoctorProfile: React.FC = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);

  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [speciality, setSpeciality] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      setUserId(userId ?? null);

      if (!userId) return;

      const { data: existingUser, error: findError } = await supabase
        .from('users')
        .select('user_id')
        .eq('user_id', userId)
        .single();

      if (!existingUser) {
        const { error: insertError } = await supabase.from('users').insert({
          user_id: userId,
          email: session?.user?.email,
          full_name: '',
          role: 'doctor',
          created_at: new Date().toISOString()
        });

        if (insertError) {
          console.error('Failed to insert into users table:', insertError.message);
        }
      }
    };

    fetchUser();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId) {
      console.log('User not logged in');
      return;
    }

    const { error: userError } = await supabase
      .from('users')
      .update({
        full_name: `${firstName} ${middleName} ${lastName}`,
        phone_number: contactNumber,
        role: 'doctor',
      })
      .eq('user_id', userId);

    if (userError) {
      console.error('Error updating user table:', userError.message);
      console.log('Failed to update user information.');
      return;
    }

    const { error: doctorError } = await supabase.from('doctors').upsert([
      {
        user_id: userId,
        license_number: licenseNumber,
        specialization: speciality,
        emergency_contact: emergencyContact,
        first_name: firstName,
        last_name: lastName,
        middle_name: middleName,
        is_available: true,
        role: 'doctor',
      },
    ]);

    if (doctorError) {
      console.error('Doctor insert failed:', doctorError);
      console.log(`Failed to save doctor profile: ${doctorError.message}`);
      return;
    }

    navigate('/addschedule');
  };

  // Inline styles object
  const styles: { [key: string]: React.CSSProperties } = {
    doctorProfileContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#f0f2f5', // Matching patient profile's background
      padding: '60px',
      boxSizing: 'border-box',
    },
    doctorProfileCard: {
      width: '576px',
      minHeight: '600px',
      maxHeight: '95vh',
      background: 'linear-gradient(to bottom, rgba(178, 245, 239, 0.2), rgba(245, 245, 245, 0.2))', // Matching patient profile's gradient
      borderRadius: '12px',
      boxShadow: '0px 4px 15px rgba(0, 0, 0, 0.1)', // Matching patient profile's shadow
      display: 'flex',
      flexDirection: 'column',
      padding: '32px', // Matching patient profile's padding
      boxSizing: 'border-box',
      overflow: 'hidden',
    },
    profileTitle: {
      fontSize: '28px', // Matching patient profile's font size
      fontWeight: 'bold',
      fontFamily: 'Roboto, sans-serif',
      color: '#333', // Matching patient profile's color
      marginBottom: '25px', // Matching patient profile's margin
      textAlign: 'left', // Matching patient profile's alignment
    },
    doctorFormArea: {
      flexGrow: 1,
      display: 'flex',
      flexDirection: 'column',
      gap: '18px', // Matching patient profile's gap
      overflowY: 'auto',
      paddingRight: '15px', // Matching patient profile's padding
      marginBottom: '25px', // Matching patient profile's margin
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '6px', // Matching patient profile's gap
      width: '100%',
      position: 'relative', // For calendar icon, if added later
    },
    formLabel: {
      fontSize: '15px', // Matching patient profile's font size
      fontWeight: '500', // Matching patient profile's font weight
      fontFamily: 'Roboto, sans-serif',
      color: '#555', // Matching patient profile's color
    },
    formInputContainer: {
      width: '100%',
      height: '44px', // Matching patient profile's height
      backgroundColor: 'white',
      borderRadius: '6px', // Matching patient profile's border-radius
      border: '1px solid #e0e0e0', // Matching patient profile's border
      display: 'flex',
      alignItems: 'center',
      padding: '0 12px', // Matching patient profile's padding
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
    calendarIcon: { // Included for completeness if a date input is added
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
      width: '120px', // Matching patient profile's width
      height: '48px', // Matching patient profile's height
      backgroundColor: '#2563eb', // Matching patient profile's blue color
      borderRadius: '6px', // Matching patient profile's border-radius
      boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)', // Matching patient profile's shadow
      color: 'white',
      fontSize: '18px', // Matching patient profile's font size
      fontWeight: 'bold', // Matching patient profile's font weight
      fontFamily: 'Roboto, sans-serif',
      border: 'none',
      cursor: 'pointer',
      transition: 'background-color 0.3s ease, transform 0.2s ease',
      alignSelf: 'flex-start',
      marginTop: '0px', // Reset margin-top as gap handles spacing
    },
  };

  return (
    <div style={styles.doctorProfileContainer}>
      <div style={styles.doctorProfileCard}>
        <div style={styles.profileTitle}>Complete Your Profile</div>
        <form onSubmit={handleSubmit} style={styles.doctorFormArea}>
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
            <label htmlFor="licenseNumber" style={styles.formLabel}>Doctor License</label>
            <div style={styles.formInputContainer}>
              <input type="text" id="licenseNumber" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} placeholder="License No." style={styles.formInput} required />
            </div>
          </div>
          <div style={styles.formGroup}>
            <label htmlFor="speciality" style={styles.formLabel}>Speciality</label>
            <div style={styles.formInputContainer}>
              <input type="text" id="speciality" value={speciality} onChange={(e) => setSpeciality(e.target.value)} placeholder="e.g. Cardiologist" style={styles.formInput} required />
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
          <button type="submit" style={styles.submitButton}>
            Submit
          </button>
        </form>
      </div>
    </div>
  );
};

export default CompleteDoctorProfile;