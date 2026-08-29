/* eslint-disable */
// @ts-nocheck

import { createRootRoute, createRoute } from '@tanstack/react-router'
import { Outlet } from '@tanstack/react-router'

// Importar rutas
import { Route as RootRoute } from './__root'
import { Route as AppRoute } from './app'
import { Route as IndexRoute } from './-route-backup'
import { Route as AppIndexRoute } from './app/index'
import { Route as AppPromocionesRoute } from './app/promociones'
import { Route as AppTradingRoute } from './app/trading'

// Crear árbol de rutas
export const routeTree = RootRoute._addFileChildren([
  AppRoute._addFileChildren([
    AppIndexRoute,
    AppPromocionesRoute,
    AppTradingRoute,
  ]),
  IndexRoute,
])