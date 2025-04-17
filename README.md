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
4. Click **Start** to begin generating spans continuously.
5. Use **Step** to generate a single span on demand.
6. Click **Stop** to end the simulation.
7. View simulation logs in the “Log” section below the controls. For exporter output or JS errors, open your browser’s developer console (F12).

## Files
- `index.html` — main page UI
- `app.js` — simulation logic
- `style.css` — basic styles

## License
MIT