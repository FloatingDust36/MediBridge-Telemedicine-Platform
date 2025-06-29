import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../lib/supabaseClient';
import './CompleteDoctorProfile.css';

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
      const { data: { session } } = await supabase.auth.getSession();
      setUserId(session?.user?.id ?? null);
    };
    fetchUser();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId) {
      alert('User not logged in');
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
    alert('Failed to update user information.');
    return;
  }

  // 2. Insert into `doctors` table
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
  console.error('Error inserting doctor data:', doctorError.message);
  alert('Failed to save doctor profile.');
  return;
}

  // Redirect after successful save
  navigate('/doctordashboard');
};

  return (
    <div className="doctor-profile-container">
      <div className="doctor-profile-card">
        <div className="profile-title">Complete Your Profile</div>
        <form onSubmit={handleSubmit} className="doctor-form-area">
          <div className="form-group">
            <div className="form-label">Last Name</div>
            <div className="form-input-container">
              <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Enter your Last name" className="form-input" required />
            </div>
          </div>
          <div className="form-group">
            <div className="form-label">First Name</div>
            <div className="form-input-container">
              <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Enter your First name" className="form-input" required />
            </div>
          </div>
          <div className="form-group">
            <div className="form-label">Middle Name</div>
            <div className="form-input-container">
              <input type="text" value={middleName} onChange={(e) => setMiddleName(e.target.value)} placeholder="Enter your Middle name" className="form-input" />
            </div>
          </div>
          <div className="form-group">
            <div className="form-label">Doctor License</div>
            <div className="form-input-container">
              <input type="text" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} placeholder="License No." className="form-input" required />
            </div>
          </div>
          <div className="form-group">
            <div className="form-label">Speciality</div>
            <div className="form-input-container">
              <input type="text" value={speciality} onChange={(e) => setSpeciality(e.target.value)} placeholder="e.g. Cardiologist" className="form-input" required />
            </div>
          </div>
          <div className="form-group">
            <div className="form-label">Contact Number</div>
            <div className="form-input-container">
              <input type="tel" value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} pattern="[0-9]{11}" placeholder="e.g. 09123456789" className="form-input" required />
            </div>
          </div>
          <div className="form-group">
            <div className="form-label">Emergency Contact</div>
            <div className="form-input-container">
              <input type="text" value={emergencyContact} onChange={(e) => setEmergencyContact(e.target.value)} placeholder="Name & Number" className="form-input" />
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
