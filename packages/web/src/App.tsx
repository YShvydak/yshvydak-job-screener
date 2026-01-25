import {createBrowserRouter, RouterProvider} from 'react-router-dom'
import {Layout} from './components/Layout'
import {Dashboard} from './pages/Dashboard'
import {Jobs} from './pages/Jobs'
import {Profiles} from './pages/Profiles'
import {Settings} from './pages/Settings'

const router = createBrowserRouter([
    {
        path: '/',
        element: <Layout />,
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
