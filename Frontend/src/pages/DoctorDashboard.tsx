import React, { useEffect, useState } from 'react';
import supabase from '../lib/supabaseClient';
import './DoctorDashboard.css';

const DoctorDashboard: React.FC = () => {
  const [doctorName, setDoctorName] = useState<string>('Loading...');
  const [selectedPatient, setSelectedPatient] = useState<string>('');
  const [consultationNotes, setConsultationNotes] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [appointments, setAppointments] = useState<any[]>([]);
  const [patientList, setPatientList] = useState<string[]>([]);
  const [currentDate, setCurrentDate] = useState<string>('');

  useEffect(() => {
    const fetchDoctorData = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      if (!userId) {
        console.error('No logged-in doctor');
        return;
      }

      // Fetch doctor name from users table
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('full_name')
        .eq('user_id', userId)
        .single();

      if (userError) {
        console.error('Error fetching doctor name:', userError.message);
        return;
      }

      setDoctorName(user.full_name);

      // Fetch appointments (Mock: filter by today only)
      const { data: appts, error: apptError } = await supabase
        .from('appointments')
        .select('id, start_time, end_time, patients(first_name, last_name)')
        .eq('doctor_id', userId);

      if (apptError) {
        console.error('Error fetching appointments:', apptError.message);
        return;
      }

      const today = new Date().toISOString().slice(0, 10);
      const todayAppts = appts?.filter((appt: any) => appt.date === today) || [];

      setAppointments(todayAppts);
      setPatientList(todayAppts.map((a: any) => `${a.patients?.[0]?.first_name} ${a.patients?.[0]?.last_name}`));
      if (todayAppts.length > 0) { const patient = todayAppts[0].patients?.[0];
      if (patient) {setSelectedPatient(`${patient.first_name} ${patient.last_name}`);
      }}
      
      const formattedDate = new Date().toLocaleDateString('en-US', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
      });
      setCurrentDate(formattedDate);
    };

    fetchDoctorData();
  }, []);

  const handleSaveNotes = async () => {
  if (!consultationNotes.trim()) {
    alert('Please enter consultation notes before saving.');
    return;
  }

  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  const doctorId = session?.user?.id;

  if (!doctorId) {
    alert('Doctor not logged in.');
    return;
  }

  // Fetch patient_id from patient name
  const { data: patient, error: patientError } = await supabase
    .from('patients')
    .select('user_id')
    .eq('full_name', selectedPatient)
    .single();

  if (patientError || !patient) {
    console.error('Error finding patient:', patientError?.message);
    alert('Failed to find patient.');
    return;
  }

  const { error: insertError } = await supabase.from('consultation_notes').insert({
    doctor_id: doctorId,
    patient_id: patient.user_id,
    notes: consultationNotes,
  });

  if (insertError) {
    console.error('Error saving note:', insertError.message);
    alert('Failed to save note.');
  } else {
    alert('Consultation notes saved successfully!');
    setConsultationNotes('');
  }
};


  const handleSearch = () => {
    if (!searchQuery.trim()) {
      alert('Please enter a patient name or ID to search.');
      return;
    }

    console.log(`Searching for patient: ${searchQuery}`);
    alert(`Searching for: ${searchQuery}`);
  };

  return (
    <div className="main-content-area doctor-dashboard-wrapper">
      <div className="welcome-section">
        <h1>Welcome, Dr. {doctorName}</h1>
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
          <p className="card-value">3</p> {/* Optional: fetch from backend */}
        </div>
        <div className="card">
          <h3>Pending Messages</h3>
          <p className="card-value">4</p> {/* Optional: fetch from backend */}
        </div>
      </div>

      <div className="main-sections">
        <div className="section-left">
          <div className="today-appointments panel-box">
            <h2>Today's Appointments</h2>
            {appointments.length > 0 ? (
              appointments.map((appt) => (
                <div className="appointment-item" key={appt.id}>
                  <p className="patient-name"> Patient: {appt.patients?.[0]?.first_name} {appt.patients?.[0]?.last_name} 
                  </p>
                  <p className="appointment-time">
                    {new Date(appt.start_time).toLocaleString()} - {new Date(appt.end_time).toLocaleTimeString()}
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
                onChange={(e) => setSelectedPatient(e.target.value)}
              >
                {patientList.map((name, idx) => (
                  <option value={name} key={idx}>{name}</option>
                ))}
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
              disabled={!consultationNotes.trim()}
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
