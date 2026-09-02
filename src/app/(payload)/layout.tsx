import type { ServerFunctionClient } from 'payload'
import '@payloadcms/next/css'
import { handleServerFunctions, RootLayout } from '@payloadcms/next/layouts'
import React from 'react'
import config from '../../../payload.config'
import { importMap } from './payload-admin/importMap.js'
import './custom.css'

type Args = { children: React.ReactNode }

const serverFunction: ServerFunctionClient = async (args) => {
  'use server'
  return handleServerFunctions({ ...args, config, importMap })
}

// Isolated from the rest of the app's layout tree — this only wraps
// Payload's own /payload-admin + /payload-api routes.
const Layout = ({ children }: Args) => (
  <RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
    {children}
  </RootLayout>
)

export default Layout
