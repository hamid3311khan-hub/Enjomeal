import PublicInfoLayout from "../components/PublicInfoLayout";

function ReturnPolicy() {
  return (
    <PublicInfoLayout>
      <div className="info-page">
        <h1>Refund & Return Policy</h1>

        <p className="info-lead">
          Because food is perishable, returns are generally not
          possible.
        </p>

        <h2>1. No Food Returns</h2>
        <p>
          Food items are prepared specifically for each order and
          are perishable. Therefore, food items cannot normally be
          returned after delivery.
        </p>

        <h2>2. Cancellation After Preparation</h2>
        <p>
          Once an order has been accepted by the food partner and
          preparation has started, it generally cannot be cancelled
          or refunded.
        </p>

        <h2>3. Wrong, Damaged or Spoiled Food</h2>
        <p>
          If you receive the wrong item, damaged food, or food that
          appears spoiled or unsafe, please contact EnjoMeal
          support within 30 minutes of delivery.
        </p>

        <p>
          Please provide clear photos or videos of the issue when
          reporting the problem. After verification, we may provide
          a replacement or refund as appropriate.
        </p>

        <h2>4. Taste Preferences</h2>
        <p>
          Refunds are generally not provided for personal taste
          preferences or dissatisfaction with the taste of food.
        </p>

        <h2>5. Refund Processing</h2>
        <p>
          If a refund is approved, it will be processed through the
          applicable payment method or payment provider, subject to
          their processing timelines.
        </p>
      </div>
    </PublicInfoLayout>
  );
}

export default ReturnPolicy;
