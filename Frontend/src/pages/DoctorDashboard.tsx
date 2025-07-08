import React, { useState, useEffect, useCallback } from 'react';
import supabase from '../lib/supabaseClient';
import './DoctorDashboard.css';
import logo from '../assets/MediBridge_LogoClear.png'; // Make sure this path is correct

interface Appointment {
  id: string;
  start_time: string;
  end_time: string;
  patients: { first_name: string; last_name: string; user_id: string } | null;
}

interface DoctorWithUser {
  first_name: string;
  last_name: string;
  middle_name: string | null;
  specialization: string;
  is_available: boolean;
  users: {
    full_name: string;
  };
}

interface DoctorInfo {
  full_name: string;
  first_name: string;
  last_name: string;
  middle_name: string | null;
  specialization: string;
  is_available: boolean;
}

const DoctorDashboard: React.FC = () => {
  const [doctorInfo, setDoctorInfo] = useState<DoctorInfo | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<string>('');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [consultationNotes, setConsultationNotes] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patientList, setPatientList] = useState<{ name: string; id: string }[]>([]);
  const [currentDate, setCurrentDate] = useState<string>('');
  const [consultationsDone, setConsultationsDone] = useState<number>(0);
  const [pendingMessages, setPendingMessages] = useState<number>(0);

  const fetchDoctorDashboardData = useCallback(async () => {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    if (sessionError || !userId) {
      console.error('No logged-in doctor or session error:', sessionError?.message);
      return;
    }

    try {
      const { data: doctorData, error: doctorError } = await supabase
        .from('doctors')
        .select(`
          first_name,
          last_name,
          middle_name,
          specialization,
          is_available,
          users (
            full_name
          )
        `)
        .eq('user_id', userId)
        .single<DoctorWithUser>();

      if (doctorError || !doctorData) {
        console.error('Error fetching doctor info:', doctorError?.message);
        setDoctorInfo({
          full_name: 'Dr. Unknown',
          first_name: 'Unknown',
          last_name: '',
          middle_name: null,
          specialization: 'General',
          is_available: false
        });
      } else {
        // Parse individual names from full_name as a fallback, if doctorData's name fields are empty
        const parseFullName = (fullName: string) => {
          const nameParts = fullName.trim().split(' ');
          if (nameParts.length === 1) {
            return { first_name: nameParts[0], middle_name: '', last_name: '' };
          } else if (nameParts.length === 2) {
            return { first_name: nameParts[0], middle_name: '', last_name: nameParts[1] };
          } else {
            return {
              first_name: nameParts[0],
              middle_name: nameParts.slice(1, -1).join(' '),
              last_name: nameParts[nameParts.length - 1]
            };
          }
        };

        const parsedNames = parseFullName(doctorData.users.full_name || '');

        setDoctorInfo({
          full_name: doctorData.users.full_name || 'Dr. Unknown',
          first_name: doctorData.first_name || parsedNames.first_name,
          last_name: doctorData.last_name || parsedNames.last_name,
          middle_name: doctorData.middle_name || parsedNames.middle_name || null,
          specialization: doctorData.specialization || 'General',
          is_available: doctorData.is_available || false
        });
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      const { data: appts, error: apptError } = await supabase
        .from('appointments')
        .select(`
          id,
          start_time,
          end_time,
          patients (
            user_id,
            first_name,
            last_name
          )
        `)
        .eq('doctor_id', userId)
        .gte('start_time', today.toISOString())
        .lt('start_time', tomorrow.toISOString())
        .order('start_time', { ascending: true });

      if (apptError) {
        console.error('Error fetching appointments:', apptError.message);
        setAppointments([]);
      } else {
        const formattedAppts: Appointment[] = appts.map((appt: any) => ({
          id: appt.id,
          start_time: appt.start_time,
          end_time: appt.end_time,
          patients: appt.patients ? {
            user_id: appt.patients.user_id,
            first_name: appt.patients.first_name,
            last_name: appt.patients.last_name,
          } : null,
        }));
        setAppointments(formattedAppts);

        const patientListData = formattedAppts
          .filter(appt => appt.patients)
          .map(appt => ({
            name: `${appt.patients?.first_name} ${appt.patients?.last_name}`,
            id: appt.patients?.user_id || '',
          }));
        setPatientList(patientListData);

        if (patientListData.length > 0) {
          setSelectedPatient(patientListData[0].name);
          setSelectedPatientId(patientListData[0].id);
        }
      }

      const { count: consultationsCount } = await supabase
        .from('consultation_notes')
        .select('*', { count: 'exact' })
        .eq('doctor_id', userId);

      setConsultationsDone(consultationsCount || 0);

      const { count: messagesCount } = await supabase
        .from('session_messages')
        .select('*', { count: 'exact' })
        .eq('receiver_id', userId)
        .neq('sender_id', userId); // Assuming doctor should not count messages they sent

      setPendingMessages(messagesCount || 0);

      const formattedDate = new Date().toLocaleDateString('en-US', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
      });
      setCurrentDate(formattedDate);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  }, []); // useCallback dependency array: fetchDoctorDashboardData has no external dependencies

  useEffect(() => {
    fetchDoctorDashboardData();

    const handleProfileUpdate = () => {
      console.log('Doctor profile updated event received. Refetching dashboard data...');
      fetchDoctorDashboardData(); // Re-fetch data to update the dashboard
    };

    window.addEventListener('doctorProfileUpdated', handleProfileUpdate);

    return () => {
      window.removeEventListener('doctorProfileUpdated', handleProfileUpdate);
    };
  }, [fetchDoctorDashboardData]); // Dependency array for useEffect

  const handleSaveNotes = async () => {
    if (!consultationNotes.trim() || !selectedPatientId) {
      alert('Please select a patient and enter consultation notes.');
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    const doctorId = session?.user?.id;
    if (!doctorId) {
      alert('Doctor not logged in.');
      return;
    }

    const selectedAppt = appointments.find(appt => appt.patients?.user_id === selectedPatientId);

    const { error: insertError } = await supabase.from('consultation_notes').insert({
      doctor_id: doctorId,
      patient_id: selectedPatientId,
      notes: consultationNotes,
      appointment_id: selectedAppt?.id || null, // Link to appointment if found
    });

    if (!insertError) {
      setConsultationNotes('');
      alert('Consultation notes saved successfully!');
      // Re-fetch consultations done count
      const { count: newConsultationsCount } = await supabase
        .from('consultation_notes')
        .select('*', { count: 'exact' })
        .eq('doctor_id', doctorId);
      setConsultationsDone(newConsultationsCount || 0);
    } else {
      console.error('Error saving consultation notes:', insertError.message);
      alert('Failed to save notes: ' + insertError.message);
    }
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      alert('Please enter a patient name or ID to search.');
      return;
    }
    console.log(`Searching for patient: ${searchQuery}`);
    // Implement actual search logic here, e.g., navigate to a patient records page
    // or display search results within the dashboard.
  };

  const getDisplayName = () => {
    // Prioritize individual first and last name from doctorInfo if available
    if (doctorInfo?.first_name && doctorInfo?.last_name) {
      return `${doctorInfo.first_name} ${doctorInfo.last_name}`;
    }
    // Fallback to full_name, removing "Dr." prefix if present
    return doctorInfo?.full_name?.replace(/^Dr\.?\s*/, '') || 'Unknown';
  };

  return (
    <div className="main-content-area doctor-dashboard-wrapper">
      <div className="welcome-section">
        <h1>Welcome, Dr. {getDisplayName()}</h1>
        <p>
          Specialization: {doctorInfo?.specialization || 'General'} |
          Status: {doctorInfo?.is_available ? 'Available' : 'Unavailable'}
        </p>
        <p>Manage your appointments, view patient records, and conduct consultations.</p>
        <span className="current-date">{currentDate}</span>
      </div>

      <div className="summary-cards">
        <div className="card">
          <h3>Appointments Today</h3>
          <p className="card-value">{appointments.length}</p>
        </div>
        <div className="card">
          <h3>Consultations Done</h3>
          <p className="card-value">{consultationsDone}</p>
        </div>
        <div className="card">
          <h3>Pending Messages</h3>
          <p className="card-value">{pendingMessages}</p>
        </div>
      </div>

      <div className="main-sections">
        <div className="section-left">
          <div className="today-appointments panel-box">
            <h2>Today's Appointments</h2>
            {appointments.length > 0 ? (
              appointments.map((appt) => (
                <div className="appointment-item" key={appt.id}>
                  <p className="patient-name">
                    Patient: {appt.patients?.first_name} {appt.patients?.last_name}
                  </p>
                  <p className="appointment-time">
                    {new Date(appt.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                    {new Date(appt.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              ))
            ) : (
              <p>No appointments for today.</p>
            )}
          </div>

          <div className="add-consultation-notes panel-box">
            <h2>Add Patient Consultation Notes</h2>
            <div className="form-group">
              <label htmlFor="select-patient">Select Patient</label>
              <select
                id="select-patient"
                className="input-field2"
                value={selectedPatient}
                onChange={(e) => {
                  const selectedName = e.target.value;
                  setSelectedPatient(selectedName);
                  const patient = patientList.find(p => p.name === selectedName);
                  setSelectedPatientId(patient ? patient.id : null);
                }}
              >
                {patientList.length > 0 ? (
                  patientList.map((patient, idx) => (
                    <option value={patient.name} key={idx}>{patient.name}</option>
                  ))
                ) : (
                  <option value="">No patients available</option>
                )}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="consultation-details">Consultation Details</label>
              <textarea
                id="consultation-details"
                className="input-field textarea-field"
                placeholder="Enter consultation details, symptoms, diagnosis, treatment plan..."
                value={consultationNotes}
                onChange={(e) => setConsultationNotes(e.target.value)}
                rows={5}
              />
            </div>

            <button
              className="save-notes-button"
              onClick={handleSaveNotes}
              disabled={!consultationNotes.trim() || !selectedPatientId}
            >
              Save Notes
            </button>
          </div>
        </div>

        <div className="section-right">
          <div className="search-patient-records panel-box">
            <h2>Search Patient Records</h2>
            <input
              type="text"
              placeholder="Enter patient name or ID"
              className="input-field"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button className="search-button" onClick={handleSearch}>
              Search
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;