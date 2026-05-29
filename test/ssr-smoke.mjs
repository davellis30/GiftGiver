import { createServer } from 'vite'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom/server.js'

const vite = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'error',
})

const routes = [
  '/coordinator/outreach',
  '/coordinator/patients',
  '/coordinator/patients/P-0001',
  '/coordinator/schedule',
  '/supervisor',
  '/supervisor/states',
  '/supervisor/coordinator/CC-01',
  '/unknown-route',
]

let failed = false
try {
  const { default: App } = await vite.ssrLoadModule('/src/App.jsx')
  for (const loc of routes) {
    try {
      const html = renderToString(
        React.createElement(StaticRouter, { location: loc }, React.createElement(App)),
      )
      console.log(`OK   ${loc}  (${html.length} bytes)`)
    } catch (err) {
      failed = true
      console.error(`FAIL ${loc}`)
      console.error('   ', err.message)
    }
  }
} catch (err) {
  failed = true
  console.error('Module load failed:', err.message)
} finally {
  await vite.close()
}

process.exit(failed ? 1 : 0)
