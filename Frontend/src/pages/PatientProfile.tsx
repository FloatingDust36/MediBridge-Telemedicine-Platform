// src/pages/PatientProfile.tsx

import React, { useEffect, useState } from 'react';
// Removed: import { useParams } from 'react-router-dom'; // No longer needed as we're not reading from URL

// Import the CSS file.
import './PatientProfile.css';

const PatientProfile: React.FC = () => {
  // We are removing useParams and the patientId state.
  // The component will now directly use a fixed piece of mock data.
  const [patientData, setPatientData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // --- HARDCODED MOCK DATA (Only John Doe will be used for display) ---
  const MOCK_JOHN_DOE_DATA = {
    user_id: 'patient-id-123',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com',
    dob: '1990-05-15',
    phone: '123-456-7890',
    address: '123 Main St, Anytown, USA',
    medical_history: [
      { id: 1, condition: 'Allergies (Pollen)', date: '2010-03-01' },
      { id: 2, condition: 'Flu (Annual)', date: '2023-11-20' },
      { id: 3, condition: 'Mild Asthma', date: '2005-09-01' },
    ],
    prescriptions: [
      { id: 1, medication: 'Loratadine', dosage: '10mg', frequency: 'Daily', issue_date: '2024-04-01', doctor_name: 'Dr. Smith' },
      { id: 2, medication: 'Albuterol', dosage: '90mcg', frequency: 'As needed', issue_date: '2023-10-15', doctor_name: 'Dr. Jones' },
    ],
    consultation_notes: [
      { id: 1, note: 'Patient presented with seasonal allergy symptoms. Recommended continued Loratadine. Follow-up in 6 months.', date: '2024-05-01', doctor_name: 'Dr. Lee' },
      { id: 2, note: 'Annual physical check-up. Patient in good health. No new concerns.', date: '2023-09-10', doctor_name: 'Dr. Green' },
    ]
  };
  // --- END HARDCODED MOCK DATA ---

  useEffect(() => {
    setLoading(true);
    setError(null); // Clear any previous errors

    // Simulate a brief loading time, then set the fixed mock data
    const timer = setTimeout(() => {
      setPatientData(MOCK_JOHN_DOE_DATA); // Directly set John Doe's data
      setLoading(false);
    }, 500); // 500ms delay

    return () => clearTimeout(timer); // Cleanup timer
  }, []); // Empty dependency array means this runs only once on mount

  // --- Rendering Logic ---
  if (loading) {
    return <div className="patient-profile-loading">Loading patient profile design...</div>;
  }

  if (error) {
    // In this simplified version, 'error' should ideally not happen
    // unless you manually set it for debugging.
    return <div className="patient-profile-error">Error loading design: {error}</div>;
  }

  // If not loading and no error, and patientData is available (which it should be after useEffect)
  if (!patientData) {
      // This case should theoretically not be hit if useEffect runs correctly.
      return <div className="patient-profile-no-data">No patient design data available.</div>;
  }

  return (
    <div className="patient-profile-container">
      <h1>Patient Profile: {patientData.first_name} {patientData.last_name}</h1>
      <p>Email: {patientData.email}</p>
      <p>Date of Birth: {patientData.dob}</p>
      <p>Phone: {patientData.phone}</p>
      <p>Address: {patientData.address}</p>

      <h2>Medical History</h2>
      {patientData.medical_history && patientData.medical_history.length > 0 ? (
        <ul>
          {patientData.medical_history.map((item: any) => (
            <li key={item.id}>
              **{item.condition}** - {item.date}
            </li>
          ))}
        </ul>
      ) : (
        <p>No medical history recorded.</p>
      )}

      <h2>Prescriptions</h2>
      {patientData.prescriptions && patientData.prescriptions.length > 0 ? (
        <ul>
          {patientData.prescriptions.map((item: any) => (
            <li key={item.id}>
              **{item.medication}** ({item.dosage}, {item.frequency}) - Issued: {item.issue_date} by {item.doctor_name}
            </li>
          ))}
        </ul>
      ) : (
        <p>No prescriptions found.</p>
      )}

      <h2>Consultation Notes</h2>
      {patientData.consultation_notes && patientData.consultation_notes.length > 0 ? (
        <ul>
          {patientData.consultation_notes.map((item: any) => (
            <li key={item.id}>
              **{item.date}** (by {item.doctor_name}): "{item.note}"
            </li>
          ))}
        </ul>
      ) : (
        <p>No consultation notes found.</p>
      )}
    </div>
  );
};

export default PatientProfile;