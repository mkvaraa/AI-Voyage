import { NavLink } from 'react-router';

export default function Navbar() {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive
        ? 'bg-primary text-primary-foreground'
        : 'text-foreground hover:bg-accent hover:text-accent-foreground'
    }`;

  return (
    <nav className="border-b bg-background">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-2 px-4">
        <span className="mr-4 text-lg font-semibold">AI-Voyage</span>
        <NavLink to="/" end className={linkClass}>
          Home
        </NavLink>
        <NavLink to="/plan" className={linkClass}>
          Plan
        </NavLink>
      </div>
    </nav>
  );
}
