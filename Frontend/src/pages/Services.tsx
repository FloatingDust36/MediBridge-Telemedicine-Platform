import { useLocation } from 'react-router-dom';


import './Services.css';

import Service1 from '../assets/pictures/Service1.jpg';
import Service2 from '../assets/pictures/Service2.jpg';
import Service3 from '../assets/pictures/Service3.jpg';
import Service4 from '../assets/pictures/Service4.jpg';

const Services = () => {
  const location = useLocation();

  return (
    <div className="services-page-container">

      <div className="main-content-and-footer-wrapper">

        <div className="services-content-wrapper">
          <div className="services-grid">
            <div className="service-block">
              <div className="service-image-container">
                <img src={Service1} alt="Secure video consultations" className="service-image" />
                <div className="service-text">Secure video consultations between patients and licensed doctors</div>
              </div>
            </div>

            <div className="service-block">
              <div className="service-image-container">
                <img src={Service2} alt="Symptom checker powered by AI" className="service-image" />
                <div className="service-text">Symptom checker powered by AI</div>
              </div>
            </div>

            <div className="service-block">
              <div className="service-image-container">
                <img src={Service3} alt="Appointment booking and medical history tracking" className="service-image" />
                <div className="service-text">Appointment booking and medical history tracking</div>
              </div>
            </div>

            <div className="service-block">
              <div className="service-image-container">
                <img src={Service4} alt="Role-based portals for doctors, patients, and admins" className="service-image" />
                <div className="service-text">Role-based portals for doctors, patients, and admins</div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Services;