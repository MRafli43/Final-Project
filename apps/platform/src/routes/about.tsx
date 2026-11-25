import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/about')({
  component: () => (
    <section>
      <h1>About</h1>
      <p>A pnpm workspace with a Hono API, a React platform, and a shared logger.</p>
      <p>
        Add files under <code>src/routes/</code> to create new routes.
      </p>
    </section>
  ),
})
