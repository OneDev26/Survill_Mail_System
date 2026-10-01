import { useSelector } from "react-redux";
const colors = {
  violet: "bg-violet-100 text-violet-600",
  blue: "bg-blue-100 text-blue-600",
  pink: "bg-pink-100 text-pink-600",
  slate: "bg-slate-100 text-slate-700",
  green: "bg-green-100 text-green-700",
  orange: "bg-orange-100 text-orange-600",
  teal: "bg-teal-100 text-teal-600",
};
export function Avatar({ initials, color = "violet", small = false, src }) {
  if (src)
    return (
      <img
        src={src}
        alt="Profile"
        className={`shrink-0 rounded-full object-cover ${small ? "size-8" : "size-10"}`}
      />
    );
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold ${small ? "size-8 text-[11px]" : "size-10 text-xs"} ${colors[color] || colors.violet}`}
    >
      {initials}
    </span>
  );
}
export function IconButton({ icon: Icon, label, className = "", ...props }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className={`inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-ink ${className}`}
      {...props}
    >
      <Icon size={17} strokeWidth={1.7} />
    </button>
  );
}
export function LabelBadge({ name }) {
  const labels = useSelector((state) => state.mail.labels);
  const label = labels.find((item) => item.name === name);
  return label ? (
    <span
      className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${label.badge}`}
    >
      {label.name}
    </span>
  ) : null;
}
