import { createRootRoute, Link, Outlet } from '@tanstack/react-router'

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: () => <p>Page not found.</p>,
})

function RootLayout() {
  return (
    <main>
      <nav>
        <Link to="/" activeProps={{ className: 'active' }} activeOptions={{ exact: true }}>
          Home
        </Link>
        <Link to="/about" activeProps={{ className: 'active' }}>
          About
        </Link>
      </nav>
      <Outlet />
    </main>
  )
}
