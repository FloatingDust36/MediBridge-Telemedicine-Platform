import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../lib/supabaseClient';
import './PatientProfile.css';

interface PatientData {
  user_id: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  email: string;
  date_of_birth: string;
  phone_number: string;
  address: string;
  contact_number?: string; // This might be redundant if phone_number is consistently used
  emergency_contact?: string;
  allergies?: string;
}

interface MedicalHistory {
  id: string;
  condition: string;
  date: string;
}

interface Prescription {
  id: string;
  medication: string;
  dosage: string;
  frequency: string;
  issue_date: string;
  doctor_name: string;
}

interface ConsultationNote {
  id: string;
  note: string;
  date: string;
  doctor_name: string;
}

const PatientProfile: React.FC = () => {
  const navigate = useNavigate();
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [medicalHistory, setMedicalHistory] = useState<MedicalHistory[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [consultationNotes, setConsultationNotes] = useState<ConsultationNote[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editedData, setEditedData] = useState<PatientData | null>(null);
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    fetchPatientData();
  }, []);

  const fetchPatientData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        navigate('/'); // Redirect to login if no session
        return;
      }

      const userId = session.user.id;

      // Fetch patient data with user data
      const { data: patientInfo, error: patientError } = await supabase
        .from('patients')
        .select(`
          *,
          users!inner(
            user_id,
            email,
            full_name,
            phone_number,
            date_of_birth,
            address
          )
        `)
        .eq('user_id', userId)
        .single();

      if (patientError || !patientInfo) {
        throw new Error('Failed to fetch patient data: ' + patientError?.message);
      }

      // Combine patient and user data
      const combinedData: PatientData = {
        user_id: patientInfo.user_id,
        first_name: patientInfo.first_name || '',
        last_name: patientInfo.last_name || '',
        middle_name: patientInfo.middle_name || '',
        email: patientInfo.users?.email || '',
        date_of_birth: patientInfo.date_of_birth || patientInfo.users?.date_of_birth || '',
        phone_number: patientInfo.users?.phone_number || patientInfo.contact_number || '', // Prioritize users.phone_number
        address: patientInfo.address || patientInfo.users?.address || '', // Prioritize users.address
        contact_number: patientInfo.contact_number || '', // Keep for direct patient table field if used
        emergency_contact: patientInfo.emergency_contact || '',
        allergies: patientInfo.allergies || '',
      };

      setPatientData(combinedData);
      setEditedData(combinedData);

      // Fetch medical reports (as medical history)
      const { data: medicalReports, error: medicalReportsError } = await supabase
        .from('medical_reports')
        .select(`
          id,
          diagnosis,
          created_at,
          doctors(
            first_name,
            last_name
          )
        `)
        .eq('patient_id', userId)
        .order('created_at', { ascending: false });

      if (medicalReportsError) {
        console.error('Error fetching medical reports:', medicalReportsError.message);
      } else if (medicalReports) {
        const historyData: MedicalHistory[] = medicalReports.map(report => ({
          id: report.id,
          condition: report.diagnosis,
          date: new Date(report.created_at).toLocaleDateString(),
        }));
        setMedicalHistory(historyData);
      }

      // Fetch prescriptions from medical reports
      const { data: prescriptionData, error: prescriptionDataError } = await supabase
        .from('medical_reports')
        .select(`
          id,
          medications_prescribed,
          created_at,
          doctors(
            first_name,
            last_name
          )
        `)
        .eq('patient_id', userId)
        .not('medications_prescribed', 'is', null)
        .order('created_at', { ascending: false });

      if (prescriptionDataError) {
        console.error('Error fetching prescriptions:', prescriptionDataError.message);
      } else if (prescriptionData) {
        const prescriptionsList: Prescription[] = prescriptionData.map(report => ({
          id: report.id,
          medication: report.medications_prescribed || 'Not specified',
          dosage: 'As prescribed', // Placeholder
          frequency: 'As directed', // Placeholder
          issue_date: new Date(report.created_at).toLocaleDateString(),
          // Safely access doctor's name, assuming 'doctors' is an object here
          doctor_name: `Dr. ${report.doctors?.first_name || 'Unknown'} ${report.doctors?.last_name || 'Doctor'}`,
        }));
        setPrescriptions(prescriptionsList);
      }

      // Fetch consultation notes
      const { data: consultationData, error: consultationDataError } = await supabase
        .from('consultation_notes')
        .select(`
          id,
          notes,
          created_at,
          doctors(
            first_name,
            last_name
          )
        `)
        .eq('patient_id', userId)
        .order('created_at', { ascending: false });

      if (consultationDataError) {
        console.error('Error fetching consultation notes:', consultationDataError.message);
      } else if (consultationData) {
        const notesList: ConsultationNote[] = consultationData.map(note => ({
          id: note.id,
          note: note.notes || 'No notes available',
          date: new Date(note.created_at).toLocaleDateString(),
          // Safely access doctor's name, assuming 'doctors' is an object here
          doctor_name: `Dr. ${note.doctors?.first_name || 'Unknown'} ${note.doctors?.last_name || 'Doctor'}`,
        }));
        setConsultationNotes(notesList);
      }

    } catch (err: any) { // Type 'any' for general error handling
      console.error('Error fetching patient data:', err.message);
      setError('Failed to load patient profile. Please try again. ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedData(patientData); // Revert changes if cancelled
  };

  const handleSave = async () => {
    if (!editedData || !patientData) return;

    try {
      setSaving(true);

      // Update users table
      const { error: userError } = await supabase
        .from('users')
        .update({
          phone_number: editedData.phone_number,
          date_of_birth: editedData.date_of_birth,
          address: editedData.address,
          full_name: `${editedData.first_name} ${editedData.middle_name ? editedData.middle_name + ' ' : ''}${editedData.last_name}`.trim(), // Ensure full_name is updated
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', patientData.user_id);

      if (userError) throw userError;

      // Update patients table
      const { error: patientError } = await supabase
        .from('patients')
        .update({
          first_name: editedData.first_name,
          last_name: editedData.last_name,
          middle_name: editedData.middle_name,
          // date_of_birth: editedData.date_of_birth, // Already in users, can be redundant here if not needed in patients table
          // address: editedData.address, // Already in users, can be redundant here if not needed in patients table
          contact_number: editedData.contact_number, // Keep this if 'contact_number' is distinct in patients table
          emergency_contact: editedData.emergency_contact,
          allergies: editedData.allergies,
        })
        .eq('user_id', patientData.user_id);

      if (patientError) throw patientError;

      setPatientData(editedData); // Update local state with edited data
      setIsEditing(false);
      alert('Profile updated successfully!');

      // Dispatch a custom event to notify other components (like Dashboard) to refetch
      window.dispatchEvent(new Event('patientProfileUpdated'));

    } catch (err: any) {
      console.error('Error updating profile:', err.message);
      alert('Failed to update profile. Please try again: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof PatientData, value: string) => {
    if (editedData) {
      setEditedData({
        ...editedData,
        [field]: value,
      });
    }
  };

  const handleBackToDashboard = () => {
    navigate('/patientdashboard');
  };

  if (loading) {
    return <div className="patient-profile-loading">Loading patient profile...</div>;
  }

  if (error) {
    return (
      <div className="patient-profile-error">
        <p>Error: {error}</p>
        <button onClick={fetchPatientData}>Retry</button>
      </div>
    );
  }

  if (!patientData) {
    return <div className="patient-profile-no-data">No patient data available.</div>;
  }

  const currentData = isEditing ? editedData : patientData;

  return (
    <div className="patient-profile-container">
      <div className="profile-header">
        <button className="back-button" onClick={handleBackToDashboard}>
          ← Back to Dashboard
        </button>
        <h1>Patient Profile</h1>
        {!isEditing ? (
          <button className="edit-button" onClick={handleEdit}>
            Edit Profile
          </button>
        ) : (
          <div className="edit-buttons">
            <button className="cancel-button" onClick={handleCancel}>
              Cancel
            </button>
            <button
              className="save-button"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        )}
      </div>

      <div className="profile-content">
        <div className="profile-section">
          <h2>Personal Information</h2>

          <div className="profile-field">
            <label>Email:</label>
            <input
              type="email"
              value={currentData?.email || ''}
              disabled={true}
              className="profile-input disabled"
            />
          </div>

          <div className="profile-field">
            <label>First Name:</label>
            <input
              type="text"
              value={currentData?.first_name || ''}
              disabled={!isEditing}
              className={`profile-input ${!isEditing ? 'disabled' : ''}`}
              onChange={(e) => handleInputChange('first_name', e.target.value)}
            />
          </div>

          <div className="profile-field">
            <label>Last Name:</label>
            <input
              type="text"
              value={currentData?.last_name || ''}
              disabled={!isEditing}
              className={`profile-input ${!isEditing ? 'disabled' : ''}`}
              onChange={(e) => handleInputChange('last_name', e.target.value)}
            />
          </div>

          <div className="profile-field">
            <label>Middle Name:</label>
            <input
              type="text"
              value={currentData?.middle_name || ''}
              disabled={!isEditing}
              className={`profile-input ${!isEditing ? 'disabled' : ''}`}
              onChange={(e) => handleInputChange('middle_name', e.target.value)}
            />
          </div>

          <div className="profile-field">
            <label>Date of Birth:</label>
            <input
              type="date"
              value={currentData?.date_of_birth || ''}
              disabled={!isEditing}
              className={`profile-input ${!isEditing ? 'disabled' : ''}`}
              onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
            />
          </div>

          <div className="profile-field">
            <label>Phone Number:</label>
            <input
              type="tel"
              value={currentData?.phone_number || ''}
              disabled={!isEditing}
              className={`profile-input ${!isEditing ? 'disabled' : ''}`}
              onChange={(e) => handleInputChange('phone_number', e.target.value)}
            />
          </div>

          <div className="profile-field">
            <label>Address:</label>
            <textarea
              value={currentData?.address || ''}
              disabled={!isEditing}
              className={`profile-input ${!isEditing ? 'disabled' : ''}`}
              onChange={(e) => handleInputChange('address', e.target.value)}
              rows={3}
            />
          </div>

          <div className="profile-field">
            <label>Emergency Contact:</label>
            <input
              type="text"
              value={currentData?.emergency_contact || ''}
              disabled={!isEditing}
              className={`profile-input ${!isEditing ? 'disabled' : ''}`}
              onChange={(e) => handleInputChange('emergency_contact', e.target.value)}
            />
          </div>

          <div className="profile-field">
            <label>Allergies:</label>
            <textarea
              value={currentData?.allergies || ''}
              disabled={!isEditing}
              className={`profile-input ${!isEditing ? 'disabled' : ''}`}
              onChange={(e) => handleInputChange('allergies', e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <div className="profile-section">
          <h2>Medical History</h2>
          {medicalHistory.length > 0 ? (
            <ul className="profile-list">
              {medicalHistory.map((item) => (
                <li key={item.id}>
                  <strong>{item.condition}</strong> - {item.date}
                </li>
              ))}
            </ul>
          ) : (
            <p className="no-data">No medical history recorded.</p>
          )}
        </div>

        <div className="profile-section">
          <h2>Prescriptions</h2>
          {prescriptions.length > 0 ? (
            <ul className="profile-list">
              {prescriptions.map((item) => (
                <li key={item.id}>
                  <strong>{item.medication}</strong> ({item.dosage}, {item.frequency}) -
                  Issued: {item.issue_date} by {item.doctor_name}
                </li>
              ))}
            </ul>
          ) : (
            <p className="no-data">No prescriptions found.</p>
          )}
        </div>

        <div className="profile-section">
          <h2>Consultation Notes</h2>
          {consultationNotes.length > 0 ? (
            <ul className="profile-list">
              {consultationNotes.map((item) => (
                <li key={item.id}>
                  <strong>{item.date}</strong> (by {item.doctor_name}): "{item.note}"
                </li>
              ))}
            </ul>
          ) : (
            <p className="no-data">No consultation notes found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientProfile;