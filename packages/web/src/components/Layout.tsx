import { NavLink, Outlet } from 'react-router-dom';

const navLinks = [
    { to: '/', label: 'Dashboard' },
    { to: '/jobs', label: 'Jobs' },
    { to: '/profiles', label: 'Search Profiles' },
    { to: '/settings', label: 'Settings' }
];

export function Layout() {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <h1 className="text-xl font-bold text-gray-900">
                                Job Screener
                            </h1>
                        </div>
                        <nav className="flex items-center space-x-1">
                            {navLinks.map((link) => (
                                <NavLink
                                    key={link.to}
                                    to={link.to}
                                    className={({ isActive }) =>
                                        `px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                            isActive
                                                ? 'bg-blue-100 text-blue-700'
                                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                        }`
                                    }
                                >
                                    {link.label}
                                </NavLink>
                            ))}
                        </nav>
                    </div>
                </div>
            </header>

            {/* Main content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Outlet />
            </main>
        </div>
    );
}
