interface IllustrationProps {
  className?: string;
}

export const CatMotif = ({ className }: IllustrationProps) => {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height="48"
      viewBox="0 0 48 48"
      width="48"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* body */}
      <ellipse
        cx="24"
        cy="33"
        fill="#FFFEF7"
        rx="11"
        ry="9"
        stroke="#1A1A1A"
        strokeWidth="1.5"
      />
      {/* head */}
      <circle
        cx="24"
        cy="20"
        fill="#FFFEF7"
        r="9"
        stroke="#1A1A1A"
        strokeWidth="1.5"
      />
      {/* left ear */}
      <path
        d="M16 14 L13 8 L19 12 Z"
        fill="#F7C5D0"
        stroke="#1A1A1A"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      {/* right ear */}
      <path
        d="M32 14 L35 8 L29 12 Z"
        fill="#F7C5D0"
        stroke="#1A1A1A"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      {/* eyes */}
      <ellipse cx="20.5" cy="20" fill="#1A1A1A" rx="1.5" ry="1.8" />
      <ellipse cx="27.5" cy="20" fill="#1A1A1A" rx="1.5" ry="1.8" />
      {/* nose */}
      <path d="M23 23 L24 22 L25 23 L24 24 Z" fill="#F7C5D0" />
      {/* whiskers left */}
      <line stroke="#1A1A1A" strokeWidth="1" x1="14" x2="21" y1="22" y2="23" />
      <line stroke="#1A1A1A" strokeWidth="1" x1="14" x2="21" y1="24" y2="24" />
      {/* whiskers right */}
      <line stroke="#1A1A1A" strokeWidth="1" x1="27" x2="34" y1="23" y2="22" />
      <line stroke="#1A1A1A" strokeWidth="1" x1="27" x2="34" y1="24" y2="24" />
      {/* tail */}
      <path
        d="M35 38 Q42 34 40 28 Q38 24 35 27"
        fill="none"
        stroke="#1A1A1A"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
    </svg>
  );
};

export const PlantMotif = ({ className }: IllustrationProps) => {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height="120"
      viewBox="0 0 100 120"
      width="100"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* pot */}
      <path
        d="M34 108 L38 88 L62 88 L66 108 Z"
        fill="#F7C5D0"
        stroke="#1A1A1A"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <rect fill="#1A1A1A" height="4" rx="2" width="32" x="34" y="84" />
      {/* main stem */}
      <path
        d="M50 84 Q50 68 50 52"
        fill="none"
        stroke="#1A1A1A"
        strokeLinecap="round"
        strokeWidth="2"
      />
      {/* large monstera leaf left */}
      <path
        d="M50 64 Q30 55 18 38 Q28 36 36 46 Q32 30 38 20 Q46 30 44 46 Q48 36 56 30 Q56 46 50 52"
        fill="#C9EB8A"
        stroke="#1A1A1A"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      {/* monstera splits left leaf */}
      <path
        d="M30 44 Q28 50 30 56"
        fill="none"
        stroke="#1A1A1A"
        strokeLinecap="round"
        strokeWidth="1"
      />
      <path
        d="M36 36 Q34 42 36 48"
        fill="none"
        stroke="#1A1A1A"
        strokeLinecap="round"
        strokeWidth="1"
      />
      {/* large leaf right */}
      <path
        d="M50 58 Q68 48 82 34 Q72 30 64 40 Q70 24 62 16 Q56 28 58 44 Q52 36 44 32 Q46 46 50 52"
        fill="#B6EDE6"
        stroke="#1A1A1A"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      {/* monstera splits right leaf */}
      <path
        d="M70 36 Q72 42 70 48"
        fill="none"
        stroke="#1A1A1A"
        strokeLinecap="round"
        strokeWidth="1"
      />
      {/* small anthurium bloom */}
      <path
        d="M50 52 Q40 42 42 30 Q50 36 52 46 Q58 34 62 30 Q62 42 50 52"
        fill="#F7C5D0"
        stroke="#1A1A1A"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      {/* spadix */}
      <path
        d="M50 48 Q53 40 54 34"
        fill="none"
        stroke="#5A8A6A"
        strokeLinecap="round"
        strokeWidth="2"
      />
      {/* small trailing ivy left — overflowing */}
      <path
        d="M38 88 Q26 92 18 104 Q22 96 20 108"
        fill="none"
        stroke="#1A1A1A"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
      <ellipse
        cx="22"
        cy="100"
        fill="#C9EB8A"
        rx="5"
        ry="4"
        stroke="#1A1A1A"
        strokeWidth="1"
        transform="rotate(-20 22 100)"
      />
      <ellipse
        cx="18"
        cy="108"
        fill="#C9EB8A"
        rx="4"
        ry="3"
        stroke="#1A1A1A"
        strokeWidth="1"
        transform="rotate(-40 18 108)"
      />
      {/* small trailing ivy right */}
      <path
        d="M62 88 Q74 90 80 102"
        fill="none"
        stroke="#1A1A1A"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
      <ellipse
        cx="74"
        cy="96"
        fill="#B6EDE6"
        rx="5"
        ry="4"
        stroke="#1A1A1A"
        strokeWidth="1"
        transform="rotate(15 74 96)"
      />
    </svg>
  );
};
