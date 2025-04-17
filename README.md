# OpenTelemetry Load Test Demo

A static web application to generate continuous OpenTelemetry trace data simulating mobile agents, web browsers, and backend APIs.
Run entirely in the browser; no build step required.

## Usage
1. Open `index.html` in a modern browser (or serve via a static host such as AWS S3).
2. Paste your OpenTelemetry configuration into the textarea:
   - You can use a simple JSON snippet (with `serviceName`, `exporter`, `url`, etc.).
   - Or paste a full Collector YAML. The app will extract the first trace pipeline's exporter endpoint and headers automatically.
3. Click **Start** to begin generating spans continuously.
4. Use **Step** to generate a single span on demand.
5. Click **Stop** to end the simulation.

## Files
- `index.html` — main page UI
- `app.js` — simulation logic
- `style.css` — basic styles

## License
MIT