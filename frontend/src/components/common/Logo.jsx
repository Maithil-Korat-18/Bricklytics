import React, { useState } from 'react';
import { BRICKLYTICS_LOGO_SRC, DEFAULT_LOGO_ALT } from '../../constants/logo';

export default function Logo({ className = '', imgClassName = 'w-8 h-8 object-contain', showText = true, showAccent = true, textClassName = 'text-xl font-bold text-[#14171F] tracking-tight' }) {
  const [imgError, setImgError] = useState(false);

  return (
    <div className={`flex items-center space-x-2.5 select-none ${className}`}>
      {!imgError ? (
        <img
          src={BRICKLYTICS_LOGO_SRC}
          alt={DEFAULT_LOGO_ALT}
          onError={() => setImgError(true)}
          className={imgClassName}
        />
      ) : (
        <div className="w-8 h-8 rounded-xl bg-[#3E6FE0] flex items-center justify-center text-white font-extrabold text-lg shadow-sm shadow-[#3E6FE0]/30">
          B
        </div>
      )}
      
      {showText && (
        <span className={textClassName}>
          Bricklytics{showAccent && <span className="text-[#3E6FE0] font-extrabold">.</span>}
        </span>
      )}
    </div>
  );
}
