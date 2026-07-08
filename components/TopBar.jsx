// components/TopBar.jsx — site-wide top utility bar.
// On small screens, hide the location & lang/currency selectors to save space.
import Link from "next/link";

export default function TopBar() {
  return (
    <div className="topbar">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 flex items-center justify-between">
        <div className="hidden sm:flex items-center gap-2">
          <i className="fa-solid fa-location-dot text-eco-green" />
          <span className="truncate">Store Location: Lincoln-344, Illinois, Chicago, USA</span>
        </div>
        <div className="sm:hidden">
          <i className="fa-solid fa-location-dot text-eco-green mr-1" />
          <span>Chicago, USA</span>
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
          <select className="bg-transparent text-[12px] hidden sm:inline"><option>Eng</option></select>
          <select className="bg-transparent text-[12px] hidden sm:inline"><option>USD</option></select>
          <Link href="/login" className="hover:text-white">Log In</Link>
          <span>/</span>
          <Link href="/register" className="hover:text-white">Sign Up</Link>
          <span className="hidden sm:inline">/</span>
          <Link href="/dashboard" className="hidden sm:inline hover:text-white">Dashboard</Link>
        </div>
      </div>
    </div>
  );
}
