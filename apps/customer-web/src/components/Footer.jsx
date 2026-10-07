import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">

        <div className="footer-brand">
          <div className="brand">
            <div className="brand-mark">🍴</div>

            <div>
              <div className="brand-name">
                EnjoMeal
              </div>

              <div className="brand-tag">
                Ghar Jaisa Khana, Anytime.
              </div>
            </div>
          </div>

          <p>
            Fresh, tasty and homely food delivered
            to your doorstep in Patna.
          </p>
        </div>

        <div className="footer-links">
          <Link to="/about-us">
            About Us
          </Link>

          <Link to="/contact">
            Contact Us
          </Link>

          <Link to="/terms">
            Terms & Conditions
          </Link>

          <Link to="/privacy-policy">
            Privacy Policy
          </Link>

          <Link to="/return-policy">
            Refund & Return
          </Link>

          <Link to="/delivery-policy">
            Delivery Policy
          </Link>

          <Link to="/cancellation-policy">
            Cancellation Policy
          </Link>
        </div>

      </div>

      <div className="footer-bottom">
        © {new Date().getFullYear()} EnjoMeal.
        All rights reserved.
      </div>
    </footer>
  );
}

export default Footer;
