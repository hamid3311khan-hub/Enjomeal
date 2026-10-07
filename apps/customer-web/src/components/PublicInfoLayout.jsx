import Footer from "./Footer";

function PublicInfoLayout({ children }) {
  return (
    <>
      <main className="public-info-main">
        {children}
      </main>

      <Footer />
    </>
  );
}

export default PublicInfoLayout;
