import DashboardLayout from "./DashboardLayout";

const SettingLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <DashboardLayout>
      <div
        className="font-anime"
        style={{ margin: "0 auto", padding: "2rem 0" }}
      >
        <h1
          style={{
            fontSize: "2.2rem",
            marginBottom: "1.5rem",
            fontWeight: 800,
            background: "linear-gradient(90deg, #a78bfa 0%, #f472b6 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            letterSpacing: 1,
            textShadow: "0 2px 12px #a78bfa99, 0 1px 0 #fff2",
          }}
        >
          Settings
        </h1>
        <div>{children}</div>
      </div>
    </DashboardLayout>
  );
};

export default SettingLayout;
