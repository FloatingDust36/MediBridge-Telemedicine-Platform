import { Link } from "react-router-dom";
import supabase from '../lib/supabaseClient';
import React, { useState, useEffect } from "react";
import "./PatientDashboard.css";
import { color } from "framer-motion";
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

const MedicalHistorySection: React.FC = () => {
  return (
    <div className="card-base medical-history-section">
      <h3 className="medical-history-title">🩺 Medical History</h3>
      <div className="card-content">
        <p>No medical history available.</p>
      </div>
    </div>
  );
};

const PatientDashboard: React.FC = () => {
  const [patientData, setPatientData] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const fetchPatientData = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      if (!userId) {
        console.error('No user session found');
        return;
      }

      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (patientError) {
        console.error('Error fetching patient:', patientError.message);
        return;
      }

      const { data: user, error: userError } = await supabase
        .from('users')
        .select('full_name')
        .eq('user_id', userId)
        .single();

      if (userError) {
        console.error('Error fetching user info:', userError.message);
        return;
      }

      setPatientData({
        ...patient,
        full_name: user.full_name,
      });
    };

    fetchPatientData();
  }, []);

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
      <section className="medical-history-section card-margin-bottom">
        <MedicalHistorySection />
      </section>
    </div>
  );
};

export default PatientDashboard;
