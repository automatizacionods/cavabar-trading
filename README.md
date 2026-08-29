# CavaBar-Trading

CavaBar TradingContexto del proyecto

Quiero crear una aplicación web moderna llamada CavaBar Trading, orientada a bares, gastrobares y discotecas. La experiencia visual debe parecer una plataforma de trading o bolsa de valores, donde los precios de las bebidas cambian dinámicamente y los clientes puedan ver una pantalla llamativa en tiempo real.

La aplicación tendrá dos vistas principales:

Panel Administrador

Pantalla Pública / Trading Board para Clientes

Rol

Actúa como un Senior Product Designer + Full Stack Engineer especializado en aplicaciones SaaS modernas con estética fintech/trading.

Diseña una aplicación visualmente impactante, responsive y lista para desplegar como PWA.

Objetivo principal

Crear una plataforma donde el administrador pueda:

Registrar productos del bar.

Configurar precios mínimos y máximos.

Activar promociones temporales.

Definir duración de ofertas con cuenta regresiva.

Mostrar los productos en un dashboard público estilo mercado bursátil en tiempo real.

Requisitos funcionales

1. Autenticación

Login seguro para administrador.

Recuperación de contraseña.

Sesión persistente.

2. Gestión de productos

El administrador debe poder:

Crear, editar y eliminar productos.

Cargar:

Nombre

Categoría (cervezas, cócteles, licores, shots, promociones, etc.)

Imagen del producto

Descripción corta

Precio base

Precio mínimo permitido

Precio máximo permitido

Stock disponible

Estado activo/inactivo

3. Configuración de promociones

Debe existir un módulo llamado Promociones Inteligentes con:

Selector de productos.

Tipo de promoción:

Descuento fijo

Descuento porcentual

Happy Hour

Flash Sale

Configuración de duración:

5 min

10 min

15 min

30 min

1 hora

Personalizado

Botón Activar Oferta.

Posibilidad de detener la promoción manualmente.

4. Cuenta regresiva visual

Cuando una promoción esté activa, en la pantalla pública debe mostrarse:

Un cronómetro circular animado.

Tiempo restante grande y visible.

Efectos visuales:

Pulsación

Glow neón

Cambio de color cuando falten menos de 60 segundos.

Ejemplo:

🔥 FLASH SALE

MOJITO

$14.900

⏱️ 02:14

5. Trading Board para clientes

Esta es la parte más importante.

Debe verse como una mezcla entre:

TradingView

Binance

Robinhood

Pantallas LED de bolsa de valores

Características visuales

Fondo oscuro elegante.

Colores neón:

Verde para subidas.

Rojo para bajadas.

Amarillo/naranja para promociones.

Tarjetas animadas.

Efecto glassmorphism.

Sombras suaves y reflejos.

Animaciones fluidas al cambiar precios.

Cada producto debe mostrar

Imagen.

Nombre.

Precio actual grande.

Variación porcentual.

Flecha ↑ o ↓.

Mini gráfica tipo sparkline.

Indicador:

HOT 🔥

TRENDING 🚀

SALE ⚡

Ejemplo visual deseado

CORONA EXTRA

$9.200

↑ +12.5%

📈 ▂▃▅▆▇█

TRENDING 🚀

6. Modo Pantalla TV

Agregar un modo especial para televisores del bar:

Fullscreen automático.

Rotación automática de productos destacados.

Transiciones cinematográficas.

Tipografía grande visible a distancia.

Compatible con resolución 1920x1080.

7. Dashboard del administrador

Crear un dashboard moderno con:

KPIs superiores

Ventas del día

Producto más vendido

Promoción activa

Tiempo restante de oferta

Variación promedio de precios

Gráficas

Ventas por hora

Productos más consultados

Historial de promociones

Productos con mayor incremento de precio

Requisitos técnicos

Frontend

Usar:

React

TypeScript

Vite

TailwindCSS

shadcn/ui

Framer Motion

Recharts para gráficas

Lucide Icons

Backend

Usar:

Supabase

Auth

PostgreSQL

Realtime

Storage para imágenes

Tiempo real

Implementar Supabase Realtime para que:

Los cambios de precios aparezcan instantáneamente.

Las promociones se reflejen sin recargar.

El cronómetro se sincronice entre administrador y clientes.

Diseño visual deseado

Estilo general

Futurista + Fintech + Nightlife Premium

Inspiración:

Binance

TradingView

Stripe Dashboard

Apple VisionOS glassmorphism

Cyberpunk elegante (sin exagerar)

Paleta sugerida

Fondo principal: #0B1020

Paneles: #121826

Verde subida: #00E676

Rojo bajada: #FF5252

Amarillo promo: #FFC107

Azul acento: #3B82F6

Texto principal: #F8FAFC

Tipografía

Inter

Manrope

Space Grotesk para números grandes

Experiencia de usuario

Cliente

Debe sentir que está viendo un mercado en vivo y que los precios pueden cambiar en cualquier momento.

Administrador

Debe poder configurar promociones en menos de 10 segundos.

Estructura de páginas

Públicas

/trading

/tv

/promociones

Administrador

/admin/login

/admin/dashboard

/admin/productos

/admin/promociones

/admin/estadisticas

/admin/configuracion

Datos de ejemplo iniciales

Productos

Mojito

Base: 18.000

Min: 14.000

Max: 24.000

Corona Extra

Base: 8.000

Min: 6.500

Max: 10.500

Jack Daniel’s

Base: 22.000

Min: 20.000

Max: 30.000

Criterios de calidad

La aplicación debe cumplir:

Diseño premium y moderno.

Responsive para móvil, tablet y TV.

Animaciones fluidas a 60fps.

Componentes reutilizables.

Código limpio y escalable.

Preparada para convertirse en un SaaS comercial para bares.

Resultado esperado

Genera una aplicación completa con:

Arquitectura de carpetas.

Componentes React.

Layout del administrador.

Trading Board animado.

Cronómetro de promociones.

Tablas SQL para Supabase.

Hooks de tiempo real.

Datos mock iniciales.

Estilo visual totalmente funcional desde el primer render.

El resultado debe verse como un producto comercial listo para impresionar a un dueño de bar o discoteca, con una estética comparable a una aplicación de trading profesional mezclada con una experiencia nocturna premium.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/4feaa1b7-97ef-4702-aaa9-6b72e7deac83).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
