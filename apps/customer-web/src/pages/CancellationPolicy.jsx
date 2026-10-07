import PublicInfoLayout from "../components/PublicInfoLayout";

function CancellationPolicy() {
  return (
    <PublicInfoLayout>
      <div className="info-page">
        <h1>Cancellation Policy</h1>

        <p className="info-lead">
          Cancellation is allowed only within a short time after
          placing the order.
        </p>

        <h2>1. Cancellation Window</h2>
        <p>
          Customers may request cancellation within 2 minutes of
          placing an order, provided the restaurant or food partner
          has not already accepted the order.
        </p>

        <h2>2. After Order Acceptance</h2>
        <p>
          Once the food partner has accepted the order or started
          preparing the food, cancellation is generally not allowed.
        </p>

        <h2>3. Refund on Cancellation</h2>
        <p>
          If an eligible cancellation is approved and payment has
          already been made, the applicable refund will be processed
          through the relevant payment method or payment provider.
        </p>

        <h2>4. Contact Support</h2>
        <p>
          If you experience an issue with an order cancellation,
          please contact EnjoMeal support as soon as possible.
        </p>
      </div>
    </PublicInfoLayout>
  );
}

export default CancellationPolicy;
