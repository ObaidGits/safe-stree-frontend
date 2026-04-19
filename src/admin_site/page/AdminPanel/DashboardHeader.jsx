import React from 'react';
import { adminLogout } from '../../../services/Apis';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { Activity, Building2, LogOut, ShieldCheck } from 'lucide-react';

const DashboardHeader = ({ activeTab, setActiveTab, alertCount, currentAdmin, totalAlertCount }) => {
  const navigate = useNavigate();

  const adminLogoutFunction = async () => {
    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true,
      };

      const res = await adminLogout(config);
      if (res.status === 200) {
        toast.success(`${res.data.message}! Redirecting to login...`);
        navigate('/admin/login', { replace: true });
      } else {
        toast.error(res.data?.message || 'Logout failed');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Logout failed. Please try again.');
    }
  };

  return (
    <header className="dashboard-header">
      <div className="dashboard-brand-wrap">
        <div className="logo">
          <span className="logo-dot" aria-hidden="true"></span>
          SafeStree Admin
        </div>
        <p>Emergency coordination and field dispatch console</p>
      </div>

      <div className="alert-count-wrap">
        <div className="alert-indicator danger">
          <Activity size={15} />
          <span className="alert-count">{alertCount}</span>
          Active Alerts
        </div>
        <div className="alert-indicator total">
          <ShieldCheck size={15} />
          <span className="alert-count">{totalAlertCount}</span>
          Total Alerts
        </div>
      </div>

      <nav className="tabs">
        <button
          className={activeTab === 'dashboard' ? 'active' : ''}
          onClick={() => setActiveTab('dashboard')}
        >
          Dashboard
        </button>
        <button
          className={activeTab === 'history' ? 'active' : ''}
          onClick={() => setActiveTab('history')}
        >
          History
        </button>
        <button
          className={activeTab === 'management' ? 'active' : ''}
          onClick={() => setActiveTab('management')}
        >
          Management
        </button>
      </nav>

      <div className="header-admin-meta">
        <div className="admin-identity">
          <span>
            <Building2 size={14} /> {currentAdmin?.policeStation || 'Kolkata Head'}
          </span>
          <span>
            <ShieldCheck size={14} /> {currentAdmin?.officerName || 'On-duty Officer'}
          </span>
        </div>
        <button className="logout-btn" onClick={adminLogoutFunction}>
          <LogOut size={15} /> Logout
        </button>
      </div>
    </header>
  );
};

export default DashboardHeader;