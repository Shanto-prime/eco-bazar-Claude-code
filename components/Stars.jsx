// components/Stars.jsx — 5-star row, filled vs empty
export default function Stars({ value = 4, className = "text-xs" }) {
  const filled = "★".repeat(value);
  const empty  = "★".repeat(5 - value);
  return (
    <div className={`text-yellow-400 ${className}`}>
      {filled}<span className="text-gray-300">{empty}</span>
    </div>
  );
}
