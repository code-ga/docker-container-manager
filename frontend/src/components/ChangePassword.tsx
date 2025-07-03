import React from "react";

const ChangePassword: React.FC = () => {
  const [formValue, setFormValue] = React.useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormValue({
      ...formValue,
      [e.target.name]: e.target.value,
    });
  };
  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // TODO: Implement change password logic
    alert("This feature is not implemented yet!");
  }
  return (
    <div
      style={{
        background: "rgba(39, 30, 60, 0.92)",
        boxShadow: "0 2px 16px 0 rgba(168,139,250,0.15)",
        borderRadius: 16,
        padding: 32,
        minWidth: 320,
        maxWidth: 420,
        flex: 1,
        alignSelf: "start",
        margin: "0 auto",
      }}
    >
      <h3
        style={{
          color: "#a78bfa",
          fontWeight: 700,
          marginBottom: 18,
          fontSize: 20,
          textAlign: "center",
        }}
      >
        Change Password
      </h3>
      <form
        onSubmit={handleFormSubmit}
        style={{ display: "flex", flexDirection: "column", gap: 14 }}
      >
        <input
          type="password"
          placeholder="Current Password"
          required
          style={{
            padding: "10px 16px",
            borderRadius: 10,
            border: "1px solid #a78bfa",
            fontSize: 15,
            background: "#231942",
            color: "#fff",
            outline: "none",
          }}
          name="currentPassword"
          onChange={handleChange}
          value={formValue.currentPassword}
        />
        <input
          type="password"
          placeholder="New Password"
          required
          style={{
            padding: "10px 16px",
            borderRadius: 10,
            border: "1px solid #a78bfa",
            fontSize: 15,
            background: "#231942",
            color: "#fff",
            outline: "none",
          }}
          name="newPassword"
          onChange={handleChange}
          value={formValue.newPassword}
        />
        <input
          type="password"
          placeholder="Confirm New Password"
          required
          style={{
            padding: "10px 16px",
            borderRadius: 10,
            border: "1px solid #a78bfa",
            fontSize: 15,
            background: "#231942",
            color: "#fff",
            outline: "none",
          }}
          name="confirmPassword"
          onChange={handleChange}
          value={formValue.confirmPassword}
        />
        {/* Form Error Message */}
        {formValue.newPassword !== formValue.confirmPassword && (
          <p style={{ color: "#f472b6", fontSize: 12, textAlign: "right" }}>
            Passwords do not match
          </p>
        )}
        <button
          type="submit"
          style={{
            background: "linear-gradient(90deg, #a78bfa 0%, #f472b6 100%)",
            color: "#fff",
            border: "none",
            borderRadius: 12,
            fontWeight: 700,
            padding: "0.7rem 1.2rem",
            fontSize: 16,
            cursor: "pointer",
            boxShadow: "0 2px 8px 0 rgba(168, 139, 250, 0.15)",
            letterSpacing: 1,
            marginTop: 4,
          }}
        >
          Change Password
        </button>
      </form>
    </div>
  );
};

export default ChangePassword;
