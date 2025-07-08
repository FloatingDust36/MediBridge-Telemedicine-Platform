import supabase from '../lib/supabaseClient';
import React, { useState, useEffect, useCallback } from "react";
import "./PatientDashboard.css";
import logo from '../assets/MediBridge_LogoClear.png';

const PatientDashboardSection: React.FC<{ data: any }> = ({ data }) => {
  if (!data) return <div style={{ color: 'black' }}>Loading patient info...</div>;

  // Calculate age based on date_of_birth
  const calculateAge = (dobString: string) => {
    if (!dobString) return 'N/A';
    const dob = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return `${age} years`;
  };

  return (
    <div className="card-base patient-dashboard-section">
      <h3 className="patient-dashboard-section-title">📈 Patient Overview</h3>
      <div className="card-content patient-dashboard-section-content">
        <p><strong>Name:</strong> {data.full_name}</p>
        <p><strong>Age:</strong> {calculateAge(data.date_of_birth)}</p>
        <p><strong>Address:</strong> {data.address}</p>
        {/* Display 'Contact' from 'patients.contact_number', fallback to 'users.phone_number' */}
        <p><strong>Contact:</strong> {data.contact_number || data.phone_number || 'N/A'}</p>
        <p><strong>Emergency Contact:</strong> {data.emergency_contact}</p>
        <p><strong>Allergies:</strong> {data.allergies || 'None reported'}</p>
      </div>
    </div>
  );
};

const ConsultationAppointmentsSection: React.FC = () => {
  return (
    <div className="card-base consultation-section">
      <h3 className="consultation-section-title">🗓️ Consultation Appointments</h3>
      <div className="card-content">
        <p>No appointments to display.</p>
      </div>
    </div>
  );
};

const PatientDashboard: React.FC = () => {
  const [patientData, setPatientData] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  const fetchPatientData = useCallback(async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    if (!userId) {
      console.error('No user session found');
      setPatientData(null);
      return;
    }

    // Fetch user profile from 'users' table - This is the primary source for general user info
    const { data: userProfile, error: userError } = await supabase
      .from('users')
      .select('full_name, email, phone_number, date_of_birth, address, role')
      .eq('user_id', userId)
      .single();

    if (userError) {
      console.error('Error fetching user info:', userError.message);
      setPatientData(null);
      return;
    }

    // Fetch patient specific details from 'patients' table
    const { data: patientDetails, error: patientError } = await supabase
      .from('patients')
      .select('first_name, last_name, middle_name, contact_number, emergency_contact, allergies')
      .eq('user_id', userId)
      .single();

    if (patientError) {
      console.error('Error fetching patient details:', patientError.message);
      // If patientDetails are not found, fallback to userProfile data for core info
      setPatientData({
        user_id: userId,
        full_name: userProfile?.full_name || '',
        email: userProfile?.email || '',
        phone_number: userProfile?.phone_number || '',
        date_of_birth: userProfile?.date_of_birth || '', // Get DOB from users table
        address: userProfile?.address || '',             // Get Address from users table
        role: userProfile?.role || 'patient',
        first_name: '',
        last_name: '',
        middle_name: '',
        contact_number: userProfile?.phone_number || '', // Fallback for contact
        emergency_contact: '',
        allergies: '',
      });
      return;
    }

    // Combine data from both tables, prioritizing `users` for `full_name`, `date_of_birth`, `address`
    setPatientData({
      user_id: userId,
      full_name: userProfile?.full_name || '', // Dashboard relies on this for name
      email: userProfile?.email || '',
      phone_number: userProfile?.phone_number || '',
      date_of_birth: userProfile?.date_of_birth || '', // Dashboard relies on this for age
      address: userProfile?.address || '',             // Dashboard relies on this for address
      role: userProfile?.role || 'patient',
      first_name: patientDetails?.first_name || '',
      last_name: patientDetails?.last_name || '',
      middle_name: patientDetails?.middle_name || '',
      contact_number: patientDetails?.contact_number || userProfile?.phone_number || '', // Prefer patients contact, fallback to users phone
      emergency_contact: patientDetails?.emergency_contact || '',
      allergies: patientDetails?.allergies || '',
    });
  }, []);

  useEffect(() => {
    fetchPatientData(); // Initial data fetch when component mounts

    // --- CRITICAL CONNECTION POINT ---
    // Event listener for the custom 'patientProfileUpdated' event dispatched from PatientProfile.tsx
    const handleProfileUpdate = () => {
      console.log('Patient profile updated event received. Refetching dashboard data...');
      fetchPatientData(); // Re-fetch data to update the dashboard
    };
    window.addEventListener('patientProfileUpdated', handleProfileUpdate);

    // Cleanup: remove event listener when component unmounts
    return () => {
      window.removeEventListener('patientProfileUpdated', handleProfileUpdate);
    };
  }, [fetchPatientData]); // Dependency array: useCallback ensures fetchPatientData reference is stable

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = currentTime.toLocaleDateString('en-US', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  const formattedTime = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', hour12: true,
  });

  return (
    <div className="main-content-area">
      <div className="top-info-bar">
        <h1 className="page-title">Patient Dashboard</h1>
        <div className="welcome-and-profile">
          <div className="profile-image-container">
            <img src={logo} alt="Patient" className="profile-image" />
          </div>
          <div className="welcome-text-group">
            <span className="medical-profile-label">Medical Profile</span>
            <span className="welcome-message">Welcome, {patientData?.full_name || 'Patient'}</span>
          </div>
        </div>
        <div className="current-timestamp">{`${formattedTime} · ${formattedDate}`}</div>
      </div>

      <section className="dashboard-section card-margin-bottom">
        <PatientDashboardSection data={patientData} />
      </section>
      <section className="consultation-section card-margin-bottom">
        <ConsultationAppointmentsSection />
      </section>
    </div>
  );
};

export default PatientDashboard;