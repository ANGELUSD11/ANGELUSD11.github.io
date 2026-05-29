# AGENTS.md

Guía para integrar componentes de **21st.dev** (y shadcn) en este proyecto **Astro**.

## Stack

- **Astro 5** + **@astrojs/react** (React 19)
- **Tailwind 4** vía `@tailwindcss/vite` (config CSS-first, sin `tailwind.config.js`)
- **TypeScript** con alias `@/* → src/*`
- Estructura shadcn: `src/components/ui/`, `src/lib/utils.ts` (`cn`), `components.json`
- El **resto del sitio** (home, blog) usa **Bootstrap + CSS propio** (NO Tailwind). No los mezcles.

## Flujo rápido para probar un componente de 21st.dev

La página **`src/pages/test.astro`** es un playground autónomo (solo Tailwind, aislado del home Bootstrap). Para probar cualquier componente:

1. **Pegá el `.tsx` tal cual** en `src/components/ui/<nombre>.tsx`.
2. **Pegá el CSS** que dé 21st.dev (los `@keyframes`/animaciones) al **final** de `src/styles/global.css`.
3. En `src/pages/test.astro`, cambiá **solo la línea de import** y el nombre del componente:
   ```tsx
   import { Component } from "@/components/ui/<nombre>";
   ```
4. Abrí **http://localhost:4321/test**.

> **No modifiques el home (`src/pages/index.astro`) ni el `Layout`** salvo que el usuario lo pida explícitamente. Experimentá siempre en `/test`.

## Reglas de implementación

### Nombre del export
21st.dev exporta de formas distintas. Mirá el `.tsx` y ajustá el import:
- `export const Component` → `import { Component } from "..."`
- `export default` → `import Component from "..."`
- `export const Hero` → `import { Hero } from "..."`

### Client directive
- Componente con **interactividad** (hooks, `useState`, `onClick`): `<Component client:load />`
- Componente **solo CSS/visual** (sin estado): renderízalo **sin** directiva → HTML estático, **0 JS**. Si dudás, usá `client:load` (siempre funciona).

### Dependencias
- Iconos → **`lucide-react`** (ya instalado). Otros: `clsx`, `tailwind-merge`, `class-variance-authority` ya están.
- Si el componente importa algo nuevo: `npm install <paquete>`.
- Imágenes: usá URLs de Unsplash que existan, o `/public` para assets locales.

### Tailwind 4 (importante)
- NO hay `tailwind.config.js`. La config y los tokens viven en `src/styles/global.css` (`@theme inline`, `:root`, `.dark`).
- Si el componente usa clases tipo `bg-background`, `text-foreground`, etc., ya están mapeadas. Activá modo oscuro con `class="dark"` en un ancestro (el playground ya lo trae).
- Animaciones custom (`@keyframes`) van a `global.css`, no a un config.

### Aislamiento / colisiones
- El sitio usa la clase `.hero-section` y clases de Bootstrap. **No definas CSS global** que pise esos nombres. En `/test` (HTML propio) no hay riesgo.
- Para meter un componente en el home como fondo, usá un **componente `.astro` con `<style>` scoped** y clases únicas (ej. `src/components/CelestialOrrery.astro`), no Tailwind global (su Preflight rompe Bootstrap).

## Comandos

```bash
npm run dev      # http://localhost:4321  (el watcher usa polling — ver abajo)
npm run build    # verificá SIEMPRE que compile antes de cerrar
npm run preview
```

## Gotcha conocido: `EMFILE: too many open files` en `astro dev`

No es el componente. El sistema tiene `fs.inotify.max_user_instances=128` y ya está saturado por VS Code/Discord. **Fix ya aplicado** en `astro.config.mjs`: el watcher usa `usePolling: true` (no usa inotify). No lo quites salvo que se suba el límite del sistema:

```bash
echo 'fs.inotify.max_user_instances=1024' | sudo tee /etc/sysctl.d/99-inotify.conf && sudo sysctl --system
```

## Checklist antes de dar por hecho algo

- [ ] El componente está en `src/components/ui/`.
- [ ] El CSS/animaciones están en `src/styles/global.css`.
- [ ] El import en `/test` usa el nombre de export correcto.
- [ ] `npm run build` pasa sin errores.
- [ ] No se tocó el home ni el Layout (a menos que se haya pedido).
