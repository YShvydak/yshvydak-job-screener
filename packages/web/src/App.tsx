import {createBrowserRouter, RouterProvider, Navigate} from 'react-router-dom'
import {Layout} from './components/Layout'
import {Dashboard} from './pages/Dashboard'
import {Jobs} from './pages/Jobs'
import {Profiles} from './pages/Profiles'
import {Settings} from './pages/Settings'
import {LoginPage} from './pages/LoginPage'
import {RegisterPage} from './pages/RegisterPage'
import {isAuthenticated} from './utils/authFetch'

// Protected Route wrapper
function ProtectedRoute({children}: {children: React.ReactNode}) {
    if (!isAuthenticated()) {
        return <Navigate to="/login" replace />
    }
    return <>{children}</>
}

const router = createBrowserRouter([
    {
        path: '/login',
        element: <LoginPage />,
    },
    {
        path: '/register',
        element: <RegisterPage />,
    },
    {
        path: '/',
        element: (
            <ProtectedRoute>
                <Layout />
            </ProtectedRoute>
        ),
        children: [
            {
                index: true,
                element: <Dashboard />,
            },
            {
                path: 'jobs',
                element: <Jobs />,
            },
            {
                path: 'profiles',
                element: <Profiles />,
            },
            {
                path: 'settings',
                element: <Settings />,
            },
        ],
    },
])

export default function App() {
    return <RouterProvider router={router} />
}
