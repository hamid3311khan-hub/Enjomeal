import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="site-footer" style={{ background: '#1a1a1a', color: '#fff', padding: '40px 20px 20px' }}>
      <div className="footer-inner" style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Brand Section */}
        <div className="footer-brand">
          <div className="brand" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div className="brand-mark" style={{ fontSize: '28px' }}>🍴</div>
            <div>
              <div className="brand-name" style={{ fontSize: '22px', fontWeight: '700', color: '#ffb400' }}>
                EnjoMeal
              </div>
              <div className="brand-tag" style={{ fontSize: '14px', color: '#ccc' }}>
                Ghar Jaisa Khana, Anytime.
              </div>
            </div>
          </div>
          <p style={{ color: '#aaa', fontSize: '14px', maxWidth: '320px', lineHeight: '1.6' }}>
            Fresh, tasty and homely food delivered to your doorstep.
          </p>
        </div>

        {/* Links Section - FIXED GAP */}
        <div className="footer-links" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px 20px', fontSize: '14px' }}>
          <Link to="/about-us" style={{ color: '#ddd', textDecoration: 'none' }}>About Us</Link>
          <span style={{ color: '#555' }}>|</span>
          <Link to="/contact" style={{ color: '#ddd', textDecoration: 'none' }}>Contact Us</Link>
          <span style={{ color: '#555' }}>|</span>
          <Link to="/terms" style={{ color: '#ddd', textDecoration: 'none' }}>Terms & Conditions</Link>
          <span style={{ color: '#555' }}>|</span>
          <Link to="/privacy-policy" style={{ color: '#ddd', textDecoration: 'none' }}>Privacy Policy</Link>
          <span style={{ color: '#555' }}>|</span>
          <Link to="/return-policy" style={{ color: '#ddd', textDecoration: 'none' }}>Refund & Return</Link>
          <span style={{ color: '#555' }}>|</span>
          <Link to="/delivery-policy" style={{ color: '#ddd', textDecoration: 'none' }}>Delivery Policy</Link>
          <span style={{ color: '#555' }}>|</span>
          <Link to="/cancellation-policy" style={{ color: '#ddd', textDecoration: 'none' }}>Cancellation Policy</Link>
        </div>

      </div>

      {/* Bottom Bar */}
      <div className="footer-bottom" style={{ borderTop: '1px solid #333', marginTop: '24px', paddingTop: '16px', textAlign: 'center', color: '#888', fontSize: '13px' }}>
        © {new Date().getFullYear()} EnjoMeal. All rights reserved.
      </div>
    </footer>
  );
}

export default Footer;
