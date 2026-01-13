/**
 * Legal Disclaimer Component
 * 
 * Observational Intelligence disclaimer for legal safe-harbor.
 * Must be displayed on all operational pages.
 */

import React from 'react';

export const LegalDisclaimer: React.FC = () => {
  return (
    <div className="mt-8 p-4 bg-[#0f172a] border border-[#334155] rounded-lg">
      <p className="text-xs text-[#64748b] font-mono leading-relaxed">
        <strong className="text-[#94a3b8]">Observational Intelligence:</strong>{' '}
        This view presents operational data for informational purposes only. 
        No recommendations, directives, or required actions are implied. 
        All operational and clinical decisions remain with authorized facility personnel. 
        This system does not provide medical advice or operational directives.
      </p>
    </div>
  );
};

