import PublicInfoLayout from "../components/PublicInfoLayout";

function PrivacyPolicy() {
  return (
    <PublicInfoLayout>
      <div className="info-page">
        <h1>Privacy Policy</h1>

        <p className="info-lead">
          Your privacy is important to us.
        </p>

        <h2>1. Information We Collect</h2>
        <p>
          When you use EnjoMeal, we may collect the following
          information:
        </p>

        <ul>
          <li>Name</li>
          <li>Phone number</li>
          <li>Delivery address</li>
          <li>Order details</li>
        </ul>

        <h2>2. How We Use Your Information</h2>
        <p>
          Your information is used to process and deliver your
          orders, communicate with you about your orders, and
          provide customer support.
        </p>

        <h2>3. Sharing of Information</h2>
        <p>
          We may share necessary delivery information with the
          delivery partner or food partner involved in fulfilling
          your order.
        </p>

        <h2>4. Payment Information</h2>
        <p>
          EnjoMeal does not store your complete payment or card
          details. Payments may be processed securely through
          third-party payment providers such as Razorpay or
          PhonePe.
        </p>

        <h2>5. Data Security</h2>
        <p>
          We take reasonable measures to protect your personal
          information. However, no online service can guarantee
          complete security of information.
        </p>

        <h2>6. Contact Us</h2>
        <p>
          If you have any questions about this Privacy Policy,
          please contact EnjoMeal support.
        </p>
      </div>
    </PublicInfoLayout>
  );
}

export default PrivacyPolicy;
