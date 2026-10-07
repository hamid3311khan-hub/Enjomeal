import PublicInfoLayout from "../components/PublicInfoLayout";

function DeliveryPolicy() {
  return (
    <PublicInfoLayout>
      <div className="info-page">
        <h1>Delivery Policy</h1>

        <p className="info-lead">
          We aim to deliver your food fresh and on time.
        </p>

        <h2>1. Estimated Delivery Time</h2>
        <p>
          Our usual delivery time is approximately 45–60 minutes.
          Actual delivery time may vary depending on the restaurant,
          order volume, distance and other circumstances.
        </p>

        <h2>2. Delivery Charges</h2>
        <p>
          Delivery charges may vary depending on the delivery
          distance and other applicable factors. The applicable
          delivery fee will be shown before you place your order.
        </p>

        <h2>3. Correct Delivery Information</h2>
        <p>
          Customers are responsible for providing a correct and
          complete delivery address and a reachable phone number.
        </p>

        <h2>4. Unable to Reach Customer</h2>
        <p>
          If the delivery partner cannot reach the customer because
          of an incorrect address, unavailable customer, or inability
          to contact the customer, the order may be treated as
          undeliverable.
        </p>

        <h2>5. Delays</h2>
        <p>
          Delivery may be delayed due to traffic, heavy rain,
          road conditions, high order volume, restaurant delays,
          or other circumstances beyond our reasonable control.
        </p>
      </div>
    </PublicInfoLayout>
  );
}

export default DeliveryPolicy;
