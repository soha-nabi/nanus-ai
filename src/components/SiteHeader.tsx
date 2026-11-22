import { Link } from "react-router-dom";

export default function SiteHeader() {
  return (
    <header className="border-b border-sage bg-ivory">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link
          to="/"
          className="flex min-h-12 items-center gap-2 font-serif text-xl text-forest"
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 28 28"
            aria-hidden="true"
            focusable="false"
          >
            <path
              d="M4 22 C4 10, 14 4, 24 4 C24 14, 18 24, 4 22 Z"
              fill="#193D32"
            />
            <path d="M4 22 L14 12" stroke="#B9C9B5" strokeWidth="1.5" fill="none" />
            <circle cx="21" cy="7" r="3" fill="#E58D78" />
          </svg>
          <span>Nanu&apos;s AI</span>
        </Link>

        <nav aria-label="Primary" className="flex flex-wrap items-center gap-1 text-sm text-charcoal">
          <Link to="/features" className="flex min-h-12 items-center px-3 hover:text-forest">
            Features
          </Link>
          <Link to="/about" className="flex min-h-12 items-center px-3 hover:text-forest">
            About
          </Link>
          <Link to="/login" className="flex min-h-12 items-center px-3 hover:text-forest">
            Log in
          </Link>
          <Link
            to="/signup"
            className="flex min-h-12 items-center rounded-md bg-forest px-4 text-ivory hover:bg-forest/90"
          >
            Sign up
          </Link>
        </nav>
      </div>
    </header>
  );
}
