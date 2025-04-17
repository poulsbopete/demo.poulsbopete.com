# OpenTelemetry Load Test Demo

A static web application to generate continuous OpenTelemetry trace data simulating mobile agents, web browsers, and backend APIs.
Run entirely in the browser; no build step required.

## Usage
1. Serve the application over HTTP/HTTPS (required for ES module loading). For example:
   ```bash
   cd path/to/demo.poulsbopete.com
   python3 -m http.server 8000
   ```
2. In your browser, navigate to `http://localhost:8000` (or your chosen host) to load the app.
3. Paste your OpenTelemetry configuration into the textarea:
   - You can use a simple JSON snippet (with `serviceName`, `exporter`, `url`, etc.).
   - Or paste a full Collector YAML. The app will extract the first trace pipeline's exporter endpoint and headers automatically.
4. Click **Start** to begin generating OpenTelemetry spans continuously.
   - Note: the browser-based OTLP HTTP simulation requires the target endpoint to support CORS for POST requests. Many managed OTLP endpoints (e.g. Elastic Cloud ingest) may not allow direct browser access.
     If you see network or CORS errors, run a Collector or proxy locally (for example on `http://localhost:4318`) and point the exporter URL to that.
5. Use **Step** to generate a single OpenTelemetry span on demand.
6. Click **Stop** to end the OpenTelemetry simulation.
7. Alternatively, click **Init APM** to load and initialize the Elastic APM RUM agent using the JSON configuration. This will expose the agent API as `window.apm` in the browser console.
8. View simulation logs in the “Log” section below the controls. For exporter output or JS errors, open your browser’s developer console (F12).

## Files
- `index.html` — main page UI
- `app.js` — simulation logic
- `style.css` — basic styles

## License
MIT