# Manual API checks

These are interactive development diagnostics, not an automated test suite. Run them only against a local development server. Set `API_BASE_URL` when the root launcher selected a non-default port, for example `API_BASE_URL=http://127.0.0.1:8004`.

Some checks register users, alter a user's admin role, update pothole state, upload media, or generate a report. They can change the active SQLite database and should not be run against production data.
