import { Link } from "react-router-dom";
import supabase from '../lib/supabaseClient';
import React, { useState, useEffect, useCallback } from "react"; // Added useCallback
import "./PatientDashboard.css";
import logo from '../assets/MediBridge_LogoClear.png';

const PatientDashboardSection: React.FC<{ data: any }> = ({ data }) => {
  if (!data) return <div style={{ color: 'black' }}>Loading patient info...</div>;

  return (
    <div className="card-base patient-dashboard-section">
      <h3 className="patient-dashboard-section-title">📈 Patient Overview</h3>
      <div className="card-content patient-dashboard-section-content">
        <p><strong>Name:</strong> {data.full_name}</p>
        <p><strong>Age:</strong> {
          data.date_of_birth
            ? `${Math.floor((new Date().getTime() - new Date(data.date_of_birth).getTime()) / (1000 * 60 * 60 * 24 * 365.25))} years`
            : 'N/A'
        }</p>
        <p><strong>Address:</strong> {data.address}</p>
        <p><strong>Contact:</strong> {data.contact_number}</p>
        <p><strong>Emergency Contact:</strong> {data.emergency_contact}</p>
        <p><strong>Allergies:</strong> {data.allergies || 'None reported'}</p>
      </div>
    </div>
  );
};

const NotesSection: React.FC = () => {
  const [patientNotes, setPatientNotes] = useState<string[]>([]);
  const [newNote, setNewNote] = useState("");

  const handleAddNote = () => {
    if (newNote.trim() !== "") {
      setPatientNotes([...patientNotes, newNote.trim()]);
      setNewNote("");
    }
  };

  return (
    <div className="card-base notes-section">
      <h3 className="notes-title">📝 Patient Notes</h3>
      <div className="card-content">
        <ul className="notes-list">
          {patientNotes.map((note, index) => (
            <li key={index}>{note}</li>
          ))}
        </ul>
        <textarea
          className="add-note-textarea"
          placeholder="Add a new note..."
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          rows={3}
        ></textarea>
        <button className="add-note-button" onClick={handleAddNote}>Add Note</button>
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

const PrescriptionsSection: React.FC = () => {
  return (
    <div className="card-base prescriptions-section">
      <h3 className="prescriptions-title">💊 Prescriptions</h3>
      <div className="card-content">
        <p>No prescriptions found.</p>
      </div>
    </div>
  );
};

const PatientDashboard: React.FC = () => {
  const [patientData, setPatientData] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Wrap fetchPatientData in useCallback to prevent re-creation on every render
  const fetchPatientData = useCallback(async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    if (!userId) {
      console.error('No user session found');
      setPatientData(null); // Clear data if no user session
      return;
    }

    // Fetch from 'users' first to get the full_name, email, and other user-related data
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

    // Fetch from 'patients' for patient-specific data
    const { data: patientDetails, error: patientError } = await supabase
      .from('patients')
      .select('first_name, last_name, middle_name, contact_number, emergency_contact, allergies')
      .eq('user_id', userId)
      .single();

    if (patientError) {
      console.error('Error fetching patient details:', patientError.message);
      // It's possible for a user to exist but not yet have a patient profile
      // In this case, we still want to show what we have from the user table.
      setPatientData({
        user_id: userId,
        full_name: userProfile?.full_name || '',
        email: userProfile?.email || '',
        phone_number: userProfile?.phone_number || '',
        date_of_birth: userProfile?.date_of_birth || '',
        address: userProfile?.address || '',
        role: userProfile?.role || 'patient', // Default to patient if not explicitly set
        // Default patient-specific fields if patientDetails is null
        first_name: '',
        last_name: '',
        middle_name: '',
        contact_number: userProfile?.phone_number || '', // Fallback to user's phone
        emergency_contact: '',
        allergies: '',
      });
      return;
    }

    // Combine data from both tables
    setPatientData({
      user_id: userId,
      full_name: userProfile?.full_name || '',
      email: userProfile?.email || '',
      phone_number: userProfile?.phone_number || '',
      date_of_birth: userProfile?.date_of_birth || '',
      address: userProfile?.address || '',
      role: userProfile?.role || 'patient', // Default to patient
      
      first_name: patientDetails?.first_name || '',
      last_name: patientDetails?.last_name || '',
      middle_name: patientDetails?.middle_name || '',
      contact_number: patientDetails?.contact_number || userProfile?.phone_number || '',
      emergency_contact: patientDetails?.emergency_contact || '',
      allergies: patientDetails?.allergies || '',
    });
  }, []); // Empty dependency array means this function is created once

  useEffect(() => {
    fetchPatientData();

    // Listen for custom event to refetch data
    const handleProfileUpdate = () => {
      console.log('Patient profile updated event received. Refetching dashboard data...');
      fetchPatientData();
    };
    window.addEventListener('patientProfileUpdated', handleProfileUpdate);

    return () => {
      window.removeEventListener('patientProfileUpdated', handleProfileUpdate);
    };
  }, [fetchPatientData]); // Re-run effect if fetchPatientData changes (though with useCallback it won't)

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
      <section className="notes-section card-margin-bottom">
        <NotesSection />
      </section>
      <section className="consultation-section card-margin-bottom">
        <ConsultationAppointmentsSection />
      </section>
      <section className="prescriptions-section card-margin-bottom">
        <PrescriptionsSection />
      </section>
    </div>
  );
};

export default PatientDashboard;