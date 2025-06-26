import { useState, useRef, useEffect } from 'react';

// Import the new CSS file for Reviews
import './Reviews.css';

const Reviews = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const loginRef = useRef<HTMLDivElement>(null);

  const toggleLogin = () => setShowLogin(prev => !prev);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Ensure we don't close the popup if clicking the toggle button itself
      if (
        loginRef.current &&
        !loginRef.current.contains(event.target as Node) &&
        !(event.target as HTMLElement).closest('.login-toggle') // Keep this part
      ) {
        setShowLogin(false);
      }
    };
    // Add/remove event listener based on showLogin state
    if (showLogin) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showLogin]); // Dependency array includes showLogin

  // Helper for rendering stars based on a rating
  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      if (i < rating) {
        stars.push(<span key={i} className="star filled">&#9733;</span>); // Filled star
      } else {
        stars.push(<span key={i} className="star">&#9734;</span>); // Empty star
      }
    }
    return <div className="rating-stars">{stars}</div>;
  };

  return (
    // This is the outer-most container for the page content, consistent with other pages
    <div className="reviews-page-container"> {/* Consistent naming: reviews-page-container */}

      {/* This is the main flex container that holds all scrollable content and the footer */}
      <div className="main-content-and-footer-wrapper">
        {/* Main Page Content Wrapper - This div ensures content sits below fixed navbar */}
        <div className="reviews-content-wrapper">
          <h1 className="reviews-page-title">Website Reviews</h1>

          <div className="review-note">
            <span className="note-label">Note:</span> You must
            <span className="note-link" onClick={toggleLogin} style={{ cursor: 'pointer' }}> login </span>
            to leave a review. Below are public reviews from our users.
          </div>

          <h2 className="what-users-saying">What Users Are Saying</h2>

          <div className="reviews-list"> {/* New wrapper for review cards for better centering/layout */}
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
            {/* Add more review cards as needed */}
          </div> {/* End reviews-list */}

        </div> {/* End reviews-content-wrapper */}
      </div> {/* End main-content-and-footer-wrapper */}
    </div> // End reviews-page-container
  );
};

export default Reviews;