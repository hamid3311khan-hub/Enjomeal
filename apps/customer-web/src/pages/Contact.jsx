import PublicInfoLayout from "../components/PublicInfoLayout";

function Contact() {
  return (
    <PublicInfoLayout>
      <div className="info-page">
        <h1>Contact Us</h1>

        <p className="info-lead">
          We’re here to help you with your EnjoMeal experience.
        </p>

        <h2>EnjoMeal</h2>

        <p>
          Mumbai, Maharashtra, India
        </p>

        <h2>Customer Support</h2>

        <p>
          Email:{" "}
          <a href="mailto: hamid3311khan@gmail.com">
            hamid3311khan@gmail.com
          </a>
        </p>

        <p>
          Phone: []
        </p>

        <p>
          Support Hours: 11:00 AM – 11:00 PM
        </p>

        <h2>Need Help With Your Order?</h2>

        <p>
          Please keep your order ID ready when contacting our
          support team. This helps us resolve your issue faster.
        </p>
      </div>
    </PublicInfoLayout>
  );
}

export default Contact;
