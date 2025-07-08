import React, { useState, useEffect } from 'react';
import './AppointmentsPage.css';
import supabase from '../lib/supabaseClient';

interface Doctor {
  user_id: string;
  specialization: string;
  full_name: string;
}

interface ScheduleSlot {
  id: string;
  start_time: string;
  end_time: string;
}

const AppointmentsPage: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [schedules, setSchedules] = useState<ScheduleSlot[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<ScheduleSlot | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchDoctors = async () => {
      const { data, error } = await supabase
        .from('doctors')
        .select('user_id, specialization, users ( full_name )')
        .eq('is_available', true);

      if (error) {
        console.error('Failed to load doctors:', error.message);
        return;
      }

      const mapped = data.map((d: any) => ({
        user_id: d.user_id,
        specialization: d.specialization,
        full_name: d.users?.full_name ?? 'Unknown Doctor',
      }));

      setDoctors(mapped);
    };

    fetchDoctors();
  }, []);

  useEffect(() => {
    if (!selectedDoctorId) return;

    const fetchSchedules = async () => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('doctor_schedules')
        .select('id, start_time, end_time')
        .eq('doctor_id', selectedDoctorId)
        .eq('is_available', true)
        .gte('start_time', now)
        .order('start_time', { ascending: true });

      if (error) {
        console.error('Failed to load schedules:', error.message);
        return;
      }

      setSchedules(data);
    };

    fetchSchedules();
  }, [selectedDoctorId]);

  const fetchUpcomingAppointments = async () => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return;

    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('appointments')
      .select(`
        id,
        start_time,
        end_time,
        doctor_id,
        doctors (
          user_id,
          users (
            full_name
          )
        )
      `)
      .eq('patient_id', user.id)
      .gte('start_time', now)
      .order('start_time', { ascending: true });

    if (error) {
      console.error("Failed to load appointments:", error.message);
      return;
    }

    const mapped = data.map((app: any) => ({
      id: app.id,
      doctor: app.doctors?.users?.full_name ?? 'Unknown',
      date: new Date(app.start_time).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      time: new Date(app.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }));


    setUpcomingAppointments(mapped);
  };

  useEffect(() => {
    fetchUpcomingAppointments();
  }, []);

  const handleBookAppointment = async () => {
    if (!selectedDoctorId || !selectedSlot) {
      console.log('❗ Please select a doctor and time slot.');
      return;
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.log("❌ User not logged in.");
      return;
    }

    const patientId = user.id;

    const { error: insertError } = await supabase
      .from('appointments')
      .insert([
        {
          patient_id: patientId,
          doctor_id: selectedDoctorId,
          start_time: selectedSlot.start_time,
          end_time: selectedSlot.end_time,
          status: 'pending',
          appointment_type: 'video_consultation',
        }
      ]);

    if (insertError) {
      console.error('Error booking appointment:', insertError.message);
      console.log('❌ Booking failed.');
      return;
    }

    console.log('✅ Appointment successfully booked!');
    setSelectedSlot(null);
    fetchUpcomingAppointments();
  };

  const formattedDate = currentTime.toLocaleDateString('en-US', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
  const formattedTime = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', hour12: true,
  });

  return (
    <div className="main-content-area appointments-page-wrapper">
      <div className="appointments-top-info-bar">
        <h1 className="appointments-page-title">Appointments Dashboard</h1>
        <span className="appointments-timestamp">{formattedTime} · {formattedDate}</span>
      </div>

      <div className="appointments-content-grid">
        <div className="doctor-preference-card">
          <h3 className="card-title">Doctor Preference</h3>

          <div className="doctor-selection-section">
            <label htmlFor="doctor-select">Select a Doctor:</label>
            <select
              id="doctor-select"
              className="doctor-select"
              value={selectedDoctorId || ''}
              onChange={(e) => {
                setSelectedDoctorId(e.target.value);
                setSelectedSlot(null);
              }}
            >
              <option value="" disabled>Select a doctor</option>
              {doctors.map((doc) => (
                <option key={doc.user_id} value={doc.user_id}>
                  {doc.full_name} – {doc.specialization}
                </option>
              ))}
            </select>
          </div>

          <div className="time-slot-section">
            <h4 className="select-time-title">Select an Available Time Slot:</h4>
            <div className="time-slot-grid">
              {schedules.length > 0 ? schedules.map((slot) => {
                const start = new Date(slot.start_time);
                const end = new Date(slot.end_time);
                const label = `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

                return (
                  <button
                    key={slot.id}
                    type="button"
                    className={`time-slot-button ${selectedSlot?.id === slot.id ? 'active' : ''}`}
                    onClick={() => setSelectedSlot(slot)}
                  >
                    {label}
                  </button>
                );
              }) : (
                <p style={{ color: 'black' }}>No available slots for this doctor.</p>
              )}
            </div>
            <p className="time-slot-note">
              Note: Doctor schedules are real-time. Please choose accordingly.
            </p>
          </div>

          <button
            type="button"
            className="book-appointment-button"
            onClick={handleBookAppointment}
            disabled={!selectedDoctorId || !selectedSlot}
          >
            Book Appointment
          </button>
        </div>

        <div className="card-base upcoming-appointments-card">
          <h3 className="card-title">Upcoming Appointments</h3>
          <ul className="upcoming-appointments-list">
            {upcomingAppointments.length > 0 ? upcomingAppointments.map((app) => (
              <li key={app.id} className="upcoming-appointment-item">
                <span className="appointment-doctor">{app.doctor}</span>
                <span className="appointment-date-time">{app.date} - {app.time}</span>
              </li>
            )) : (
              <p style={{ color: 'green' }}>No upcoming appointments yet.</p>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AppointmentsPage;