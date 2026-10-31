import React from 'react';

interface PortalLoaderProps {
  message?: string;
  subMessage?: string;
  fullScreen?: boolean;
}

export const PortalLoader: React.FC<PortalLoaderProps> = ({
  message = 'CIVIL CONNECT',
  subMessage = 'Synchronizing real-time workspace...',
  fullScreen = true
}) => {
  return (
    <div className={`${fullScreen ? 'fixed inset-0 z-50 min-h-screen bg-slate-900/90 backdrop-blur-md' : 'py-8'} flex flex-col items-center justify-center select-none font-sans`}>
      <div className="relative flex flex-col items-center">
        {/* From Uiverse.io by Pradeepsaranbishnoi */}
        <div className="circ uiverse-circ shadow-2xl bg-slate-950/40 rounded-3xl border border-slate-800/80 p-2">
          <div className="load uiverse-load">Loading . . . </div>
          <div className="hands uiverse-hands"></div>
          <div className="body uiverse-body"></div>
          <div className="head uiverse-head">
            <div className="eye uiverse-eye"></div>
          </div>
        </div>

        <div className="mt-5 text-center">
          <h2 className="text-sm font-bold tracking-widest text-white uppercase font-sans">{message}</h2>
          {subMessage && (
            <p className="text-xs text-slate-400 mt-1 font-medium">{subMessage}</p>
          )}
        </div>
      </div>
    </div>
  );
};
