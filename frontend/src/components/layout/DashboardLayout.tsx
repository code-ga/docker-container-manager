import Navbar from "./Navbar";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div
      className="flex flex-col font-anime shadow-anime"
      style={{
        background: "linear-gradient(135deg, #18122B 0%, #393053 100%)",
      }}
    >
      <Navbar />
      <main
        className="flex-1 p-4"
        style={{
          // maxWidth: 1200,
          width: "100%",
          margin: "0 auto",
          background: "rgba(24, 18, 43, 0.85)",
          boxShadow: "0 6px 32px 0 rgba(168,139,250,0.18)",
          padding: "2rem 2.5rem",
          // marginTop: 32,
        }}
      >
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
