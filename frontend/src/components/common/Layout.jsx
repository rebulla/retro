import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import BurnoutOverlay from './BurnoutOverlay';
import './Layout.css';

const Layout = () => {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="content-wrapper animate-fade-in">
          <Outlet />
        </div>
      </main>
      <BurnoutOverlay />
    </div>
  );
};

export default Layout;
