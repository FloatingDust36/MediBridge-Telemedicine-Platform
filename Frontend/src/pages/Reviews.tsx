import { useState, useRef, useEffect } from 'react';
import './Reviews.css';

const Reviews = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const loginRef = useRef<HTMLDivElement>(null);

  const toggleLogin = () => setShowLogin(prev => !prev);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        loginRef.current &&
        !loginRef.current.contains(event.target as Node) &&
        !(event.target as HTMLElement).closest('.login-toggle')
      ) {
        setShowLogin(false);
      }
    };
    if (showLogin) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showLogin]);

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      if (i < rating) {
        stars.push(<span key={i} className="star filled">&#9733;</span>);
      } else {
        stars.push(<span key={i} className="star">&#9734;</span>);
      }
    }
    return <div className="rating-stars">{stars}</div>;
  };

  return (
    <div className="reviews-page-container">

      <div className="main-content-and-footer-wrapper">
        <div className="reviews-content-wrapper">
          <h1 className="reviews-page-title">Website Reviews</h1>

          <div className="review-note">
            <span className="note-label">Note:</span> You must
            <span className="note-link" onClick={toggleLogin} style={{ cursor: 'pointer' }}> login </span>
            to leave a review. Below are public reviews from our users.
          </div>

          <h2 className="what-users-saying">What Users Are Saying</h2>

          <div className="reviews-list">
            <div className="review-card">
              <div className="reviewer-info">
                <span className="reviewer-name">Juan Dela Cruz</span>
                {renderStars(4)}
              </div>
              <p className="review-text">
                The MediBridge website made it super easy to consult with a doctor even from my province. Great service!
              </p>
            </div>

            <div className="review-card">
              <div className="reviewer-info">
                <span className="reviewer-name">Maria Santos</span>
                {renderStars(3)}
              </div>
              <p className="review-text">
                Very helpful during the pandemic! The emergency map and hotline features are life-saving.
              </p>
            </div>

            <div className="review-card">
              <div className="reviewer-info">
                <span className="reviewer-name">Carlos Mendoza</span>
                {renderStars(2)}
              </div>
              <p className="review-text">
                Decent platform, but I wish there were more doctors available during off-hours.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Reviews;