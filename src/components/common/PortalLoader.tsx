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
    <div className={`${fullScreen ? 'fixed inset-0 z-50 min-h-screen' : 'py-8'} flex flex-col items-center justify-center select-none font-sans transition-all duration-300 relative overflow-hidden`}>
      {fullScreen && (
        <>
          {/* Responsive Website Background during Loading (PC view on desktop, Phone view on mobile) */}
          <div className="portal-loader-bg" aria-hidden="true" />
          <div className="fixed inset-0 bg-white/20 backdrop-blur-2xs z-0 pointer-events-none" aria-hidden="true" />
        </>
      )}

      <div className="relative z-10 flex flex-col items-center bg-white/90 backdrop-blur-md p-7 sm:p-9 rounded-3xl border border-slate-200/80 shadow-2xl max-w-sm mx-4">
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
