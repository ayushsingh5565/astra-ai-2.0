import React from 'react';

interface LogoProps {
  className?: string;
  isHackerMode?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = "w-10 h-10", isHackerMode = false }) => {
  const [error, setError] = React.useState(false);

  return (
    <div className={`${className} relative flex items-center justify-center`}>
      {!error ? (
        <img 
          src="https://storage.googleapis.com/content-storage-upload-test/64/1741533708/1741533708.png" 
          alt="ASTRA Logo" 
          className={`w-full h-full object-contain ${isHackerMode ? 'hue-rotate-[140deg] brightness-125' : ''}`}
          referrerPolicy="no-referrer"
          onError={() => setError(true)}
        />
      ) : (
        <svg 
          viewBox="0 0 100 100" 
          className="w-full h-full overflow-visible" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="fallbackGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00F0FF" />
              <stop offset="100%" stopColor="#0077FF" />
            </linearGradient>
          </defs>
          <path 
            d="M50 20 L50 80 M50 20 L40 35 M50 20 L60 35 M30 40 Q30 25 45 35 M70 40 Q70 25 55 35 M30 40 L30 55 Q30 70 50 70 Q70 70 70 55 L70 40" 
            stroke={isHackerMode ? "#FF0000" : "url(#fallbackGradient)"} 
            strokeWidth="4" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      )}
      {!isHackerMode && (
        <div className="absolute inset-0 bg-astra-blue/20 blur-xl rounded-full -z-10 animate-pulse"></div>
      )}
    </div>
  );
};