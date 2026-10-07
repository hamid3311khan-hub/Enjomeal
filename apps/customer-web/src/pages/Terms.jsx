import PublicInfoLayout from "../components/PublicInfoLayout";

function Terms() {
  return (
    <PublicInfoLayout>
      <div className="info-page">
        <h1>Terms & Conditions</h1>

        <p className="info-lead">
          Please read these terms before using EnjoMeal.
        </p>

        <h2>1. About EnjoMeal</h2>
        <p>
          EnjoMeal is a food delivery platform that connects
          customers with local home chefs and food partners.
          Food is prepared by our partner kitchens and delivered
          to customers through our delivery service.
        </p>

        <h2>2. Orders & Pricing</h2>
        <ul>
          <li>Food prices and availability may change from time to time.</li>
          <li>
            An order is confirmed only after successful order
            placement and acceptance by the food partner.
          </li>
          <li>
            Customers are responsible for providing a correct
            delivery address and reachable phone number.
          </li>
        </ul>

        <h2>3. Customer Responsibility</h2>
        <p>
          Customers must provide accurate information while
          placing an order. Fake orders, misuse of the platform,
          abusive behaviour or fraudulent activity may result
          in order cancellation or account restrictions.
        </p>

        <h2>4. Food Allergies</h2>
        <p>
          If you have any food allergy or dietary restriction,
          please check the ingredients or contact the food partner
          before placing your order. EnjoMeal cannot guarantee
          that food will be completely free from a particular
          allergen.
        </p>

        <h2>5. Acceptance</h2>
        <p>
          By using EnjoMeal and placing an order, you agree to
          these Terms & Conditions.
        </p>
      </div>
    </PublicInfoLayout>
  );
}

export default Terms;
