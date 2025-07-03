import React from "react";

const ChangeEmail: React.FC = () => {
  return (
    <div style={{ marginBottom: 32 }}>
      <h3 style={{ color: '#f472b6', fontWeight: 700, marginBottom: 18, fontSize: 20, textAlign: 'left' }}>Change Email</h3>
      <form
        onSubmit={e => {
          e.preventDefault();
          // TODO: Implement change email logic
          // alert('Change email submitted!');
          alert("This feature is not implemented yet!");
        }}
        style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
      >
        <input
          type="email"
          placeholder="New Email"
          required
          style={{
            padding: '10px 16px',
            borderRadius: 10,
            border: '1px solid #a78bfa',
            fontSize: 15,
            background: '#231942',
            color: '#fff',
            outline: 'none',
          }}
        />
        <input
          type="password"
          placeholder="Current Password"
          required
          style={{
            padding: '10px 16px',
            borderRadius: 10,
            border: '1px solid #a78bfa',
            fontSize: 15,
            background: '#231942',
            color: '#fff',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          style={{
            background: 'linear-gradient(90deg, #a78bfa 0%, #f472b6 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: 12,
            fontWeight: 700,
            padding: '0.7rem 1.2rem',
            fontSize: 16,
            cursor: 'pointer',
            boxShadow: '0 2px 8px 0 rgba(168, 139, 250, 0.15)',
            letterSpacing: 1,
            marginTop: 4,
          }}
        >
          Change Email
        </button>
      </form>
    </div>
  );
};

export default ChangeEmail;
