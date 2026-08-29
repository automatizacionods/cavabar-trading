/* eslint-disable */
// @ts-nocheck

import { createRootRoute, createRoute } from '@tanstack/react-router'
import { Outlet } from '@tanstack/react-router'

// Importar rutas
import { Route as RootRoute } from './__root'
import { Route as AppRoute } from './_app'
import { Route as IndexRoute } from './index'
import { Route as AppIndexRoute } from './_app/index'
import { Route as AppPromocionesRoute } from './_app/promociones'
import { Route as AppTradingRoute } from './_app/trading'

// Crear árbol de rutas
export const routeTree = RootRoute._addFileChildren([
  AppRoute._addFileChildren([
    AppIndexRoute,
    AppPromocionesRoute,
    AppTradingRoute,
  ]),
  IndexRoute,
])