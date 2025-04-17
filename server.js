#!/usr/bin/env node
// CORS proxy for use with the demo app
// Allows the browser to POST OTLP data to endpoints without CORS headers
const corsAnywhere = require('cors-anywhere');

const host = process.env.HOST || '0.0.0.0';
const port = process.env.PORT || 8080;

corsAnywhere.createServer({
  originWhitelist: [],       // Allow all origins
  requireHeaders: [],        // Do not require any special headers
  removeHeaders: ['cookie', 'cookie2']
}).listen(port, host, () => {
  console.log(`CORS proxy running at http://${host}:${port}`);
  console.log('Usage: configure your demo with "corsProxy": "http://'+host+':'+port+'"');
});