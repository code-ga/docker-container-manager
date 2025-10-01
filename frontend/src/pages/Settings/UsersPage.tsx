import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const UsersPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to admin page with users tab
    navigate('/settings/admin?tab=users', { replace: true });
  }, [navigate]);

  return null;
};

export default UsersPage;