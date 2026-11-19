/**
 * High-fidelity SVG visual renderer for laboratory vacutainer tubes and specimen containers.
 * Accurately replicates clinical blood collection tubes (rubber stopper, safety rim,
 * glass barrel, gel barrier, barcode label) and urine specimen cups.
 */

export default function TubeGraphic({
  tubeDef,
  className = "w-14 h-40",
}) {
  if (!tubeDef) return null;

  // Render Urine / Stool Specimen Cup Container
  if (tubeDef.isCup) {
    return (
      <svg
        viewBox="0 0 100 130"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        <defs>
          {/* Blue screw cap gradient */}
          <linearGradient id="cupCapGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={tubeDef.capAccent || "#0284c7"} />
            <stop offset="35%" stopColor={tubeDef.capColor || "#38bdf8"} />
            <stop offset="70%" stopColor={tubeDef.capAccent || "#0284c7"} />
            <stop offset="100%" stopColor="#082f49" />
          </linearGradient>

          {/* Translucent cup wall gradient */}
          <linearGradient id="cupGlassGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
            <stop offset="25%" stopColor="#f8fafc" stopOpacity="0.5" />
            <stop offset="80%" stopColor="#e2e8f0" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#cbd5e1" stopOpacity="0.85" />
          </linearGradient>

          {/* Specimen liquid gradient (Matches tube head color) */}
          <linearGradient id="cupLiquidGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={tubeDef.capAccent || tubeDef.capColor || "#0284c7"} stopOpacity="0.75" />
            <stop offset="50%" stopColor={tubeDef.capColor || "#38bdf8"} stopOpacity="0.85" />
            <stop offset="100%" stopColor={tubeDef.capAccent || "#0369a1"} stopOpacity="0.8" />
          </linearGradient>
        </defs>

        {/* Cup Shadow */}
        <ellipse cx="50" cy="124" rx="36" ry="5" fill="#000000" fillOpacity="0.12" />

        {/* Cup Body (Translucent Plastic) */}
        <path
          d="M 18 36 L 24 116 C 24 122 76 122 76 116 L 82 36 Z"
          fill="url(#cupGlassGrad)"
          stroke="#94a3b8"
          strokeWidth="1.2"
        />

        {/* Specimen Liquid Inside Cup */}
        <path
          d="M 21.5 75 L 24 115 C 24 121 76 121 76 115 L 78.5 75 Z"
          fill="url(#cupLiquidGrad)"
        />
        <ellipse cx="50" cy="75" rx="28.5" ry="3.5" fill={tubeDef.capColor || "#0284c7"} fillOpacity="0.9" />

        {/* Measurement Graduation Lines on Cup */}
        <line x1="28" y1="52" x2="42" y2="52" stroke="#64748b" strokeWidth="1" strokeDasharray="2 1" />
        <text x="45" y="54" fontSize="6" fill="#64748b" fontFamily="sans-serif">80ml</text>

        <line x1="29" y1="72" x2="42" y2="72" stroke="#64748b" strokeWidth="1" strokeDasharray="2 1" />
        <text x="45" y="74" fontSize="6" fill="#64748b" fontFamily="sans-serif">50ml</text>

        <line x1="30" y1="92" x2="42" y2="92" stroke="#64748b" strokeWidth="1" strokeDasharray="2 1" />
        <text x="45" y="94" fontSize="6" fill="#64748b" fontFamily="sans-serif">20ml</text>

        {/* White Label on Cup */}
        <rect x="52" y="55" width="23" height="38" rx="2" fill="#ffffff" fillOpacity="0.92" stroke="#cbd5e1" strokeWidth="0.8" />
        <line x1="55" y1="62" x2="72" y2="62" stroke="#94a3b8" strokeWidth="0.8" />
        <line x1="55" y1="68" x2="72" y2="68" stroke="#94a3b8" strokeWidth="0.8" />
        <line x1="55" y1="74" x2="68" y2="74" stroke="#94a3b8" strokeWidth="0.8" />

        {/* Screw Cap Thread Ring */}
        <rect x="14" y="30" width="72" height="7" rx="2" fill="url(#cupCapGrad)" stroke="#0369a1" strokeWidth="1" />

        {/* Main Screw Cap with Vertical Ribbed Texture */}
        <rect x="12" y="10" width="76" height="22" rx="3" fill="url(#cupCapGrad)" stroke="#0369a1" strokeWidth="1.2" />

        {/* Screw Cap Ridges */}
        {[18, 26, 34, 42, 50, 58, 66, 74, 82].map((x) => (
          <line
            key={x}
            x1={x}
            y1="12"
            x2={x}
            y2="30"
            stroke="#ffffff"
            strokeWidth="1"
            strokeOpacity="0.35"
          />
        ))}

        {/* Cap Top Highlight */}
        <rect x="16" y="12" width="68" height="3" rx="1.5" fill="#ffffff" fillOpacity="0.4" />
      </svg>
    );
  }

  // Render Vacuum Blood Collection Tube (Vacutainer)
  const capColor = tubeDef.capColor || "#eab308";
  const capAccent = tubeDef.capAccent || "#ca8a04";
  const hasGel = tubeDef.hasGel;

  return (
    <svg
      viewBox="0 0 60 170"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Rubber Stopper Cap Gradient */}
        <linearGradient id={`capGrad-${tubeDef.id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={capAccent} />
          <stop offset="25%" stopColor={capColor} />
          <stop offset="45%" stopColor="#ffffff" stopOpacity="0.6" />
          <stop offset="60%" stopColor={capColor} />
          <stop offset="100%" stopColor={capAccent} />
        </linearGradient>

        {/* Glass Barrel Reflection Gradient */}
        <linearGradient id={`glassGrad-${tubeDef.id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="20%" stopColor="#f1f5f9" stopOpacity="0.4" />
          <stop offset="75%" stopColor="#e2e8f0" stopOpacity="0.25" />
          <stop offset="92%" stopColor="#cbd5e1" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#94a3b8" stopOpacity="0.9" />
        </linearGradient>

        {/* Specimen Liquid Gradient (Matches tube head / cap color) */}
        <linearGradient id={`liquidGrad-${tubeDef.id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={capAccent || capColor} stopOpacity="0.85" />
          <stop offset="35%" stopColor={capColor} stopOpacity="0.95" />
          <stop offset="100%" stopColor={capAccent || capColor} stopOpacity="0.9" />
        </linearGradient>

        {/* Polymer Gel Separator Gradient */}
        <linearGradient id="gelGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="50%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#fde047" />
        </linearGradient>
      </defs>

      {/* Tube Drop Shadow */}
      <ellipse cx="30" cy="165" rx="14" ry="3" fill="#000000" fillOpacity="0.14" />

      {/* Glass Body (Cylindrical with rounded bottom) */}
      <path
        d="M 18 36 L 18 144 C 18 155 42 155 42 144 L 42 36 Z"
        fill={`url(#glassGrad-${tubeDef.id})`}
        stroke="#94a3b8"
        strokeWidth="1.2"
      />

      {/* Polymer Gel Separator (for SST / Yellow tubes) */}
      {hasGel && (
        <path
          d="M 19 135 L 19 144 C 19 153 41 153 41 144 L 41 135 C 36 138 24 138 19 135 Z"
          fill="url(#gelGrad)"
          stroke="#fef08a"
          strokeWidth="0.5"
        />
      )}

      {/* Liquid Blood / Serum / Plasma Column */}
      <path
        d={
          hasGel
            ? "M 19 72 L 19 135 C 24 138 36 138 41 135 L 41 72 Z"
            : "M 19 72 L 19 144 C 19 153 41 153 41 144 L 41 72 Z"
        }
        fill={`url(#liquidGrad-${tubeDef.id})`}
      />

      {/* Liquid Meniscus Highlight */}
      <ellipse cx="30" cy="72" rx="11" ry="2.2" fill="#ffffff" fillOpacity="0.55" />

      {/* White Paper Label with Barcode & Graduation Lines */}
      <rect
        x="18"
        y="80"
        width="24"
        height="44"
        fill="#ffffff"
        fillOpacity="0.94"
        stroke="#cbd5e1"
        strokeWidth="0.8"
      />

      {/* Barcode Stripes on Label */}
      <g opacity="0.85">
        <rect x="21" y="86" width="1.5" height="18" fill="#0f172a" />
        <rect x="23.5" y="86" width="1" height="18" fill="#0f172a" />
        <rect x="25.5" y="86" width="2" height="18" fill="#0f172a" />
        <rect x="28.5" y="86" width="1.2" height="18" fill="#0f172a" />
        <rect x="31" y="86" width="2" height="18" fill="#0f172a" />
        <rect x="34" y="86" width="1" height="18" fill="#0f172a" />
        <rect x="36" y="86" width="2.5" height="18" fill="#0f172a" />
        <rect x="39.5" y="86" width="1" height="18" fill="#0f172a" />
      </g>

      {/* Label Text Lines */}
      <line x1="21" y1="110" x2="39" y2="110" stroke="#94a3b8" strokeWidth="0.8" />
      <line x1="21" y1="114" x2="36" y2="114" stroke="#94a3b8" strokeWidth="0.8" />
      <line x1="21" y1="118" x2="32" y2="118" stroke="#94a3b8" strokeWidth="0.8" />

      {/* Specimen Fill Line Mark */}
      <line x1="18" y1="62" x2="26" y2="62" stroke="#64748b" strokeWidth="1" />
      <text x="28" y="63" fontSize="4.5" fill="#64748b" fontFamily="sans-serif">3.0ml</text>

      {/* Glass Body Highlight (Vertical Glass Reflection along left side) */}
      <path
        d="M 21 37 L 21 142 C 21 148 24 148 24 142 L 24 37 Z"
        fill="#ffffff"
        fillOpacity="0.45"
      />

      {/* Safety Ring / Hemogard Rim Collar */}
      <rect
        x="16"
        y="32"
        width="28"
        height="6"
        rx="1.5"
        fill={`url(#capGrad-${tubeDef.id})`}
        stroke={capAccent}
        strokeWidth="1"
      />

      {/* Main Hemogard Safety Rubber Stopper Cap */}
      <rect
        x="17"
        y="12"
        width="26"
        height="22"
        rx="3"
        fill={`url(#capGrad-${tubeDef.id})`}
        stroke={capAccent}
        strokeWidth="1.2"
      />

      {/* Safety Cap Ridges */}
      <line x1="23" y1="14" x2="23" y2="30" stroke="#ffffff" strokeWidth="0.8" strokeOpacity="0.4" />
      <line x1="30" y1="14" x2="30" y2="30" stroke="#ffffff" strokeWidth="0.8" strokeOpacity="0.5" />
      <line x1="37" y1="14" x2="37" y2="30" stroke="#000000" strokeWidth="0.8" strokeOpacity="0.25" />

      {/* Cap Inset Ring (Top indent) */}
      <ellipse cx="30" cy="13" rx="10" ry="2.5" fill={capAccent} stroke="#ffffff" strokeWidth="0.5" strokeOpacity="0.5" />
      <ellipse cx="30" cy="13" rx="5" ry="1.2" fill="#0f172a" fillOpacity="0.3" />
    </svg>
  );
}
