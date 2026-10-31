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
    <div className={`${fullScreen ? 'fixed inset-0 z-50 min-h-screen bg-white/80 backdrop-blur-md' : 'py-8'} flex flex-col items-center justify-center select-none font-sans transition-all duration-300`}>
      <div className="relative flex flex-col items-center">
        {/* From Uiverse.io by Pradeepsaranbishnoi - Standalone Doll (No dark container) */}
        <div className="circ uiverse-circ">
          <div className="load uiverse-load">Loading . . . </div>
          <div className="hands uiverse-hands"></div>
          <div className="body uiverse-body"></div>
          <div className="head uiverse-head">
            <div className="eye uiverse-eye"></div>
          </div>
        </div>

        <div className="mt-4 text-center">
          <h2 className="text-sm font-extrabold tracking-widest text-slate-900 uppercase font-sans">
            {message}
          </h2>
          {subMessage && (
            <p className="text-xs text-slate-600 mt-1 font-medium tracking-wide">
              {subMessage}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
