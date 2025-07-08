import React, { useState, useEffect, useCallback } from 'react';
import './AppointmentsPage.css'; // Make sure your CSS file is correctly linked
import supabase from '../lib/supabaseClient'; // Make sure your Supabase client is correctly linked

// Interfaces for better type checking
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
    // State variables
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [schedules, setSchedules] = useState<ScheduleSlot[]>([]);
    const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
    const [selectedSlot, setSelectedSlot] = useState<ScheduleSlot | null>(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([]);

    // Effect to update current time every second for display
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer); // Cleanup on component unmount
    }, []);

    // Memoized function to fetch available doctors
    const fetchDoctors = useCallback(async () => {
        const { data, error } = await supabase
            .from('doctors')
            .select('user_id, specialization, users ( full_name )') // Join with users to get full_name
            .eq('is_available', true); // Only fetch doctors marked as available

        if (error) {
            console.error('Failed to load doctors:', error.message);
            setDoctors([]); // Clear doctors on error
            return;
        }

        // Map data to the Doctor interface, handling potential null full_name
        const mappedDoctors = data.map((d: any) => ({
            user_id: d.user_id,
            specialization: d.specialization,
            full_name: d.users?.full_name ?? 'Unknown Doctor', // Use optional chaining for safety
        }));

        setDoctors(mappedDoctors);

        // If the previously selected doctor is no longer available, clear the selection
        if (selectedDoctorId && !mappedDoctors.some(doc => doc.user_id === selectedDoctorId)) {
            setSelectedDoctorId(null);
            setSelectedSlot(null);
            setSchedules([]); // Clear schedules as well
        }
    }, [selectedDoctorId]); // Recreate if selectedDoctorId changes, to re-evaluate its availability

    // Memoized function to fetch upcoming appointments for the logged-in patient
    const fetchUpcomingAppointments = useCallback(async () => {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            console.error("User not logged in:", userError?.message);
            setUpcomingAppointments([]); // Clear appointments if no user
            return;
        }

        const now = new Date().toISOString(); // Get current time in ISO format

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
            .eq('patient_id', user.id) // Filter by the current patient's ID
            .gte('start_time', now) // Only retrieve future appointments
            .order('start_time', { ascending: true }); // Order by start time

        if (error) {
            console.error("Failed to load appointments:", error.message);
            setUpcomingAppointments([]); // Clear appointments on error
            return;
        }

        // Map data for display, extracting doctor's full name
        const mappedAppointments = data.map((app: any) => ({
            id: app.id,
            doctor: app.doctors?.users?.full_name ?? 'Unknown Doctor', // Get full name from joined 'users' table
            date: new Date(app.start_time).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
            time: new Date(app.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }));

        setUpcomingAppointments(mappedAppointments);
    }, []); // No dependencies for this useCallback, as it only depends on current user session and date.now()

    // Effect to fetch doctors and upcoming appointments on mount
    // Also, sets up the event listener for doctor profile updates
    useEffect(() => {
        fetchDoctors(); // Initial fetch of doctors
        fetchUpcomingAppointments(); // Initial fetch of patient's upcoming appointments

        // Event listener for when a doctor's profile is updated (from DoctorProfile.tsx)
        const handleDoctorProfileUpdated = () => {
            console.log('Doctor profile updated. Re-fetching doctors and upcoming appointments...');
            fetchDoctors(); // Re-fetch doctors (updates dropdown)
            fetchUpcomingAppointments(); // Re-fetch upcoming appointments (updates list with new names)
        };

        // Add the event listener
        window.addEventListener('doctorProfileUpdated', handleDoctorProfileUpdated);

        // Cleanup the event listener when the component unmounts
        return () => {
            window.removeEventListener('doctorProfileUpdated', handleDoctorProfileUpdated);
        };
    }, [fetchDoctors, fetchUpcomingAppointments]); // Dependencies ensure latest memoized functions are used

    // Effect to fetch schedules when a doctor is selected
    useEffect(() => {
        if (!selectedDoctorId) {
            setSchedules([]); // Clear schedules if no doctor is selected
            return;
        }

        const fetchSchedules = async () => {
            const now = new Date().toISOString(); // Current time to filter out past slots
            const { data, error } = await supabase
                .from('doctor_schedules')
                .select('id, start_time, end_time')
                .eq('doctor_id', selectedDoctorId)
                .eq('is_available', true) // Ensure the schedule slot itself is available
                .gte('start_time', now) // Only get future or current slots
                .order('start_time', { ascending: true });

            if (error) {
                console.error('Failed to load schedules:', error.message);
                setSchedules([]); // Clear schedules on error
                return;
            }

            setSchedules(data);
            setSelectedSlot(null); // Reset selected slot when schedules change
        };

        fetchSchedules();
    }, [selectedDoctorId]); // Re-run when the selected doctor changes

    // Handler for booking an appointment
    const handleBookAppointment = async () => {
        if (!selectedDoctorId || !selectedSlot) {
            alert('❗ Please select a doctor and time slot.');
            return;
        }

        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            alert("❌ User not logged in. Please log in to book an appointment.");
            return;
        }

        const patientId = user.id;

        // Attempt to insert the new appointment
        const { error: insertError } = await supabase
            .from('appointments')
            .insert([
                {
                    patient_id: patientId,
                    doctor_id: selectedDoctorId,
                    start_time: selectedSlot.start_time,
                    end_time: selectedSlot.end_time,
                    status: 'pending', // Default status, adjust as per your workflow
                    appointment_type: 'video_consultation', // Or other types as needed
                }
            ]);

        if (insertError) {
            console.error('Error booking appointment:', insertError.message);
            // Provide more specific feedback for common errors (e.g., unique constraint violation)
            if (insertError.code === '23505') { // Example SQLSTATE for unique violation
                alert('❌ This time slot might have just been booked or is unavailable. Please choose another.');
            } else {
                alert('❌ Booking failed: ' + insertError.message);
            }
            return;
        }

        alert('✅ Appointment successfully booked!');
        setSelectedSlot(null); // Clear selected slot after booking
        fetchUpcomingAppointments(); // Refresh the upcoming appointments list to show the new booking
        // Optionally, re-fetch schedules for the selected doctor to reflect the booked slot
        // depending on how you manage schedule availability after booking.
    };

    // Handler for deleting an appointment
    const handleDeleteAppointment = async (appointmentIdToDelete: string) => {
        if (!window.confirm("Are you sure you want to cancel this appointment?")) {
            return;
        }

        const { error } = await supabase
            .from("appointments")
            .delete()
            .eq("id", appointmentIdToDelete);

        if (error) {
            console.error("Failed to cancel appointment:", error.message);
            alert("❌ Failed to cancel appointment.");
            return;
        }

        alert(`🗑️ Appointment cancelled successfully.`);
        fetchUpcomingAppointments(); // Re-fetch the list to update the UI
    };

    // Format current date and time for display
    const formattedDate = currentTime.toLocaleDateString('en-US', {
        day: '2-digit', month: 'long', year: 'numeric',
    });
    const formattedTime = currentTime.toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit', hour12: true,
    });

    return (
        <div className="main-content-area appointments-page-wrapper">
            {/* Page Title and Timestamp */}
            <div className="appointments-top-info-bar">
                <h1 className="appointments-page-title">Appointments Dashboard</h1>
                <span className="appointments-timestamp">{formattedTime} · {formattedDate}</span>
            </div>

            <div className="appointments-content-grid">
                {/* Book New Appointment Card */}
                <div className="card-base book-appointment-card">
                    <h3 className="card-title">Book New Appointment</h3>
                    <div className="appointment-form-section">
                        <div className="input-group">
                            <label htmlFor="doctor-select">Select Doctor:</label>
                            <select
                                id="doctor-select"
                                value={selectedDoctorId || ''}
                                onChange={(e) => setSelectedDoctorId(e.target.value)}
                                className="select-dropdown"
                                required
                            >
                                <option value="">-- Choose a Doctor --</option>
                                {doctors.length > 0 ? (
                                    doctors.map((doctor) => (
                                        <option key={doctor.user_id} value={doctor.user_id}>
                                            {doctor.full_name} ({doctor.specialization})
                                        </option>
                                    ))
                                ) : (
                                    <option value="" disabled>No doctors available</option>
                                )}
                            </select>
                        </div>

                        <div className="input-group">
                            <label htmlFor="schedule-slot-select">Select Time Slot:</label>
                            <select
                                id="schedule-slot-select"
                                value={selectedSlot ? selectedSlot.id : ''}
                                onChange={(e) => {
                                    const slotId = e.target.value;
                                    const slot = schedules.find(s => s.id === slotId) || null;
                                    setSelectedSlot(slot);
                                }}
                                className="select-dropdown"
                                disabled={!selectedDoctorId || schedules.length === 0}
                                required
                            >
                                <option value="">-- Choose a Time Slot --</option>
                                {schedules.length > 0 ? (
                                    schedules.map((slot) => (
                                        <option key={slot.id} value={slot.id}>
                                            {new Date(slot.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(slot.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} to {new Date(slot.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </option>
                                    ))
                                ) : (
                                    <option value="" disabled>No available slots for this doctor</option>
                                )}
                            </select>
                        </div>
                    </div>
                    <button
                        className="book-appointment-button"
                        onClick={handleBookAppointment}
                        disabled={!selectedDoctorId || !selectedSlot}
                    >
                        Book Appointment
                    </button>
                </div>

                {/* Upcoming Appointments Card */}
                <div className="card-base upcoming-appointments-card">
                    <h3 className="card-title">Your Upcoming Appointments</h3>
                    {upcomingAppointments.length === 0 ? (
                        <p>You have no upcoming appointments.</p>
                    ) : (
                        <ul className="appointment-list">
                            {upcomingAppointments.map((appointment) => (
                                <li key={appointment.id} className="appointment-item">
                                    <div className="appointment-info">
                                        <span className="appointment-details">Doctor: {appointment.doctor}</span>
                                        <span className="appointment-date">Date: {appointment.date}</span>
                                        <span className="appointment-time">Time: {appointment.time}</span>
                                    </div>
                                    <button
                                        className="delete-schedule-button" // Class for styling the trash icon
                                        onClick={() => handleDeleteAppointment(appointment.id)}
                                        title="Cancel Appointment"
                                    >
                                        🗑️
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AppointmentsPage;