import PublicInfoLayout from "../components/PublicInfoLayout";

function AboutUs() {
  return (
    <PublicInfoLayout>
      <div className="info-page">
        <h1>About EnjoMeal</h1>

        <p className="info-lead">
          Ghar Jaisa Khana, Anytime. ❤️
        </p>

        <p>
          EnjoMeal is a home-cooked food delivery platform
          from Patna, Bihar. We connect you with local home
          chefs and small restaurants who cook fresh,
          hygienic and tasty food just like home.
        </p>

        <h2>Our Mission</h2>

        <p>
          We started EnjoMeal with a simple mission —
          to give you Ghar Jaisa Khana, anytime.
        </p>

        <h2>What We Offer</h2>

        <ul>
          <li>Freshly prepared food</li>
          <li>Home-style meals</li>
          <li>Local home chefs and food partners</li>
          <li>Convenient doorstep delivery</li>
          <li>A variety of tasty meals</li>
        </ul>

        <p>
          Thank you for choosing EnjoMeal and supporting
          local home chefs and food businesses.
        </p>
      </div>
    </PublicInfoLayout>
  );
}

export default AboutUs;
