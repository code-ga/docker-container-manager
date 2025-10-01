import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const RolesPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to admin page with roles tab
    navigate('/settings/admin?tab=roles', { replace: true });
  }, [navigate]);

  return null;
};

export default RolesPage;