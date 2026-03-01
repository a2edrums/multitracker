# Tech Stack & Build

## Core
- React 19 (Create React App / react-scripts 5)
- JavaScript (no TypeScript)
- Web Audio API for all audio processing
- IndexedDB via `idb` library for local persistence

## UI
- Bootstrap 5 + react-bootstrap for layout and components
- react-icons (Font Awesome set) for iconography
- Canvas API for waveform rendering, VU meters, and spectrum analysis
- Custom dark theme via CSS custom properties (`src/styles/theme.css`)

## Key Libraries
- `uuid` — track and project ID generation
- `idb` — Promise-based IndexedDB wrapper
- `react-bootstrap` — UI component library
- `react-icons` — icon set

## Commands
| Action | Command |
|--------|---------|
| Dev server | `npm start` |
| Production build | `npm run build` |
| Run tests | `npm test` |
| Lint | Uses built-in `react-app` ESLint config |

## Deployment
- Dockerfile builds a static Apache (httpd 2.4) image serving the `build/` output
- Kubernetes manifests in `cicd/config/k8s/` (deployment, service, ingress)
- Shell scripts in `cicd/` for Docker publish and k8s deploy/update/clean

## Testing
- Jest + React Testing Library (`@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`)
- Test files colocated with source: `*.test.js`
