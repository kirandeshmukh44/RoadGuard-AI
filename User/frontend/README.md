# Frontend Guide

The frontend is the browser interface for RoadGuard AI. It is a React single-page app served by Vite during development and built into static files for deployment.

## Main folders

- `src/pages/` contains user pages. Admin pages are in `src/pages/admin/`.
- `src/components/` contains shared interface components such as the navigation bar.
- `src/api/` contains Axios helpers for REST requests and WebSocket connections.
- `src/context/` contains shared authentication and other app state.
- `src/assets/` contains imported visual assets; `public/` contains files served directly.

Tailwind CSS and DaisyUI provide styling. Framer Motion is used for transitions. React Router handles navigation, Leaflet renders maps, and Recharts renders analytics.

## Run from the project root

```bash
npm install --prefix frontend
npm run dev:frontend
```

To run frontend and backend together, use `npm run dev` from the root. The root launcher sets `VITE_API_URL` to the API address it selected, so API requests work even if the default backend port is busy.

## Build and lint

```bash
npm run build
npm run lint
```

Run these from the project root. The production frontend output is written to `frontend/dist/`.

See the root [PROJECT_GUIDE.md](../PROJECT_GUIDE.md) for the full application architecture and data flow.
