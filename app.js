import { WebTracerProvider } from 'https://esm.sh/@opentelemetry/sdk-trace-web';
import { ConsoleSpanExporter, SimpleSpanProcessor } from 'https://esm.sh/@opentelemetry/sdk-trace-base';
import { OTLPTraceExporter } from 'https://esm.sh/@opentelemetry/exporter-trace-otlp-http';
import { load } from 'https://esm.sh/js-yaml';

let tracer;
let intervalIds = [];
let running = false;

const configEl = document.getElementById('config');
const startBtn = document.getElementById('start');
const stepBtn = document.getElementById('step');
const stopBtn = document.getElementById('stop');
const statusEl = document.getElementById('status');
const logEl = document.getElementById('log');

function log(message) {
  const p = document.createElement('p');
  p.textContent = message;
  logEl.appendChild(p);
  logEl.scrollTop = logEl.scrollHeight;
}

function initTracer(config) {
  const provider = new WebTracerProvider();
  let exporterInstance;
  if (config.exporter === 'otlp') {
    exporterInstance = new OTLPTraceExporter({
      url: config.url,
      headers: config.headers || {},
    });
  } else {
    exporterInstance = new ConsoleSpanExporter();
  }
  provider.addSpanProcessor(new SimpleSpanProcessor(exporterInstance));
  provider.register();
  tracer = provider.getTracer(config.serviceName || 'demo');
}

function simulate(type) {
  const span = tracer.startSpan(`${type}-operation`);
  setTimeout(() => {
    span.end();
    log(`Span ended: ${type}`);
  }, Math.random() * 500);
}

function start() {
  const raw = configEl.value.trim();
  // Clear previous logs and indicate start
  logEl.innerHTML = '';
  log('Starting simulation…');
  log('Parsing configuration…');
  let cfg;
  let parsedAs = '';
  try {
    cfg = JSON.parse(raw);
    parsedAs = 'JSON';
    log('Configuration parsed as JSON');
  } catch (e1) {
    log('Configuration not valid JSON, trying YAML…');
    try {
      cfg = load(raw);
      parsedAs = 'YAML';
      log('Configuration parsed as YAML');
    } catch (e2) {
      const msg = 'Invalid JSON or YAML configuration';
      log(`ERROR: ${msg}`);
      alert(msg);
      return;
    }
  }
  let config;
  // Detect Collector config with service pipelines and exporters
  if (cfg.service && cfg.service.pipelines && cfg.exporters) {
    const collector = cfg;
    const serviceName = collector.service.serviceName || 'demo';
    const tracePipeline = collector.service.pipelines.traces;
    if (!tracePipeline || !Array.isArray(tracePipeline.exporters) || tracePipeline.exporters.length === 0) {
      alert('No trace pipeline/exporter found in Collector config');
      return;
    }
    const exporterKey = tracePipeline.exporters[0];
    const exporterCfg = collector.exporters[exporterKey] || {};
    // Determine endpoint URL
    let url = exporterCfg.endpoint || exporterCfg.url || '';
    if (url && !url.startsWith('http')) {
      url = 'http://' + url;
    }
    if (url && !url.includes('/v1/traces')) {
      url = url.replace(/\/$/, '') + '/v1/traces';
    }
    log(`Detected Collector config: using exporter "${exporterKey}"`);
    log(`Exporter endpoint: ${url}`);
    config = {
      serviceName,
      exporter: 'otlp',
      url,
      headers: exporterCfg.headers || {},
      interval: cfg.interval
    };
  } else {
    log('Using flat config (assumed JSON)');
    config = cfg;
  }
  log(`Initializing tracer: serviceName=${config.serviceName}, exporter=${config.exporter || 'console'}, url=${config.url || ''}`);
  initTracer(config);
  log('Tracer initialized');
  running = true;
  startBtn.disabled = true;
  stopBtn.disabled = false;
  stepBtn.disabled = false;
  statusEl.textContent = 'Running';
  const interval = config.interval || 1000;
  intervalIds.push(setInterval(() => simulate('web'), interval));
  intervalIds.push(setInterval(() => simulate('mobile'), interval * 1.2));
  intervalIds.push(setInterval(() => simulate('backend'), interval * 1.5));
}

function step() {
  if (!running) return;
  simulate('step');
}

function stop() {
  intervalIds.forEach(clearInterval);
  intervalIds = [];
  running = false;
  startBtn.disabled = false;
  stopBtn.disabled = true;
  stepBtn.disabled = true;
  statusEl.textContent = 'Stopped';
}

startBtn.addEventListener('click', start);
stepBtn.addEventListener('click', step);
stopBtn.addEventListener('click', stop);