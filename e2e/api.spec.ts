import { expect, test } from '@playwright/test'

// Use the platform proxy so these checks exercise the same API path as the UI.
test('API health endpoint responds successfully', async ({ request }) => {
  const response = await request.get('/api/health')

  expect(response.status()).toBe(200)
  expect(await response.json()).toEqual({ status: 'ok' })
})

test('API returns a personalized greeting', async ({ request }) => {
  const response = await request.get('/api/hello', { params: { name: 'Playwright' } })

  expect(response.status()).toBe(200)
  expect(await response.json()).toEqual({ message: 'Hello, Playwright!' })
})

test('API rejects an empty name', async ({ request }) => {
  const response = await request.get('/api/hello', { params: { name: '' } })

  expect(response.status()).toBe(400)
})
