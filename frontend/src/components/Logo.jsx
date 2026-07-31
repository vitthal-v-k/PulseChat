import React from 'react';

const Logo = ({ className = 'w-10 h-10', size }) => {
  const style = size ? { width: size, height: size } : {};

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      className={className}
      style={style}
    >
      <defs>
        <linearGradient id="cyanBlueGradReact" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#56c2ff" />
          <stop offset="50%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>

        <linearGradient id="magentaRedGradReact" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e11d48" />
          <stop offset="50%" stopColor="#be123c" />
          <stop offset="100%" stopColor="#881337" />
        </linearGradient>
      </defs>

      <g id="bottom-bubble">
        <path
          fill="url(#magentaRedGradReact)"
          d="
            M 315,175
            C 400,175 470,235 470,315
            C 470,395 400,455 315,455
            C 292,455 270,450 250,441
            C 240,452 222,468 185,480
            C 202,457 210,440 208,427
            C 178,399 160,359 160,315
            C 160,235 230,175 315,175 Z
          "
        />
        <circle cx="235" cy="335" r="26" fill="#ffffff" />
        <circle cx="315" cy="335" r="26" fill="#ffffff" />
        <circle cx="395" cy="335" r="26" fill="#ffffff" />
      </g>

      <g id="top-bubble">
        <path
          fill="url(#cyanBlueGradReact)"
          fillOpacity="0.85"
          d="
            M 195,35
            C 280,35 350,95 350,175
            C 350,255 280,315 195,315
            C 183,315 171,313 160,310
            C 142,323 115,342 72,350
            C 90,327 97,305 93,291
            C 61,263 40,222 40,175
            C 40,95 110,35 195,35 Z
          "
        />
        <circle cx="115" cy="155" r="26" fill="#ffffff" />
        <circle cx="195" cy="155" r="26" fill="#ffffff" />
        <circle cx="275" cy="155" r="26" fill="#ffffff" />
      </g>
    </svg>
  );
};

export default Logo;
