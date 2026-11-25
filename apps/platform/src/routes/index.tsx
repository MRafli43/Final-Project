import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  loader: async () => {
    const response = await fetch('/api/hello?name=Kerja%20Woy')
    if (!response.ok) throw new Error('API request failed')
    return response.json() as Promise<{ message: string }>
  },
  pendingComponent: () => <p>Connecting to the API…</p>,
  errorComponent: () => <p>Could not reach the API. Make sure it is running on port 3000.</p>,
  component: HomePage,
})

function HomePage() {
  const { message } = Route.useLoaderData()

  return (
    <section>
      <h1>Kerja Woy</h1>
      <p>React + Vite + TanStack Router</p>
      <p className="message">{message}</p>
      <p>Edit <code>src/routes/index.tsx</code> to get started.</p>
    </section>
  )
}
