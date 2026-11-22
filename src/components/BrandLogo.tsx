import { motion, useReducedMotion, type Variants } from "framer-motion";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  className?: string;
}

export default function BrandLogo({
  size = "md",
  showText = true,
  className = "",
}: BrandLogoProps) {
  const reduceMotion = useReducedMotion();

  const dimensions = {
    sm: { box: 28, text: "text-lg", sub: "text-[10px]" },
    md: { box: 36, text: "text-xl", sub: "text-xs" },
    lg: { box: 48, text: "text-2xl", sub: "text-sm" },
    xl: { box: 64, text: "text-3xl", sub: "text-base" },
  }[size];

  const iconVariants: Variants = {
    hidden: { scale: 0.85, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: { duration: 0.5 },
    },
  };

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <motion.svg
        width={dimensions.box}
        height={dimensions.box}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        initial={reduceMotion ? false : "hidden"}
        animate="visible"
        variants={iconVariants}
        className="shrink-0"
        aria-hidden="true"
      >
        {/* Soft protective background shield */}
        <rect
          width="48"
          height="48"
          rx="12"
          fill="#193D32"
          className="transition-colors"
        />

        {/* Nanu's signature caring arcs: Left parent arc, Right child arc converging */}
        <path
          d="M14 34C14 23 21 16 30 16"
          stroke="#B9C9B5"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M34 34C34 25.5 28.5 20 20 20"
          stroke="#F7F5EF"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="1 1"
        />
        <path
          d="M16 28C22 28 26 24 28 18"
          stroke="#B9C9B5"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Muted coral center heartbeat representing living care & connection */}
        <circle
          cx="30"
          cy="16"
          r="4.5"
          fill="#E58D78"
        />
      </motion.svg>

      {showText && (
        <div className="flex flex-col leading-tight">
          <span className={`font-serif font-bold text-forest tracking-tight ${dimensions.text}`}>
            Nanu&apos;s AI
          </span>
          <span className={`text-charcoal/70 italic font-sans font-normal ${dimensions.sub}`}>
            Care is love, made visible.
          </span>
        </div>
      )}
    </div>
  );
}
