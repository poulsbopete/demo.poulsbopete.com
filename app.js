import { WebTracerProvider } from 'https://esm.sh/@opentelemetry/sdk-trace-web';
import { ConsoleSpanExporter, SimpleSpanProcessor, BasicTracerProvider } from 'https://esm.sh/@opentelemetry/sdk-trace-base';
import { OTLPTraceExporter } from 'https://esm.sh/@opentelemetry/exporter-trace-otlp-http';
// YAML parsing will be loaded dynamically when needed

let tracer;
let intervalIds = [];
let running = false;

const configEl = document.getElementById('config');
const startBtn = document.getElementById('start');
const stepBtn = document.getElementById('step');
const stopBtn = document.getElementById('stop');
const statusEl = document.getElementById('status');
const logEl = document.getElementById('log');
const initApmBtn = document.getElementById('initApm');

function log(message) {
  const p = document.createElement('p');
  p.textContent = message;
  logEl.appendChild(p);
  logEl.scrollTop = logEl.scrollHeight;
}

function initTracer(config) {
  // Initialize tracer provider: try WebTracerProvider, fallback to BasicTracerProvider
  let provider;
  try {
    provider = new WebTracerProvider();
    if (typeof provider.addSpanProcessor !== 'function') {
      throw new Error('addSpanProcessor not available');
    }
  } catch (err) {
    log(`WARN: WebTracerProvider unavailable (${err.message}), falling back to BasicTracerProvider`);
    provider = new BasicTracerProvider();
  }
  // Set up exporter instance
  const exporterInstance =
    config.exporter === 'otlp'
      ? new OTLPTraceExporter({ url: config.url, headers: config.headers || {} })
      : new ConsoleSpanExporter();
  // Attach span processor and register provider
  provider.addSpanProcessor(new SimpleSpanProcessor(exporterInstance));
  provider.register();
  // Obtain the tracer
  tracer = provider.getTracer(config.serviceName || 'demo');
}

function simulate(type) {
  const span = tracer.startSpan(`${type}-operation`);
  setTimeout(() => {
    span.end();
    log(`Span ended: ${type}`);
  }, Math.random() * 500);
}

async function start() {
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
    let yamlModule;
    try {
      yamlModule = await import('https://esm.sh/js-yaml');
      log('YAML parser module loaded');
      // Support named or default export
      if (typeof yamlModule.load !== 'function' && yamlModule.default && typeof yamlModule.default.load === 'function') {
        yamlModule = yamlModule.default;
      }
      if (typeof yamlModule.load !== 'function') {
        throw new Error('YAML parser does not have a load() function');
      }
      cfg = yamlModule.load(raw);
      parsedAs = 'YAML';
      log('Configuration parsed as YAML');
    } catch (e2) {
      const msg = 'Invalid JSON or YAML configuration';
      log(`ERROR: ${msg}`);
      console.error(e2);
      alert(msg);
      return;
    }
  }
  let config;
  // Unwrap top-level Collector wrapper if present
  if (cfg.config && typeof cfg.config === 'object') {
    log('Detected top-level config block, using inner config');
    cfg = cfg.config;
  } else if (Object.keys(cfg).length === 1) {
    const rootKey = Object.keys(cfg)[0];
    const rootVal = cfg[rootKey];
    if (rootVal && typeof rootVal === 'object' && rootVal.config && typeof rootVal.config === 'object') {
      log(`Detected wrapper "${rootKey}", using its .config block`);
      cfg = rootVal.config;
    }
  }
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

// Hook start with async error handling
startBtn.addEventListener('click', () => {
  start().catch(err => {
    log(`ERROR: ${err.message}`);
    console.error(err);
  });
});
// Initialize Elastic APM RUM agent on demand
initApmBtn.addEventListener('click', async () => {
  log('Loading APM agent module…');
  let raw;
  try {
    raw = configEl.value.trim();
  } catch (e) {
    log('ERROR: Unable to read configuration');
    return;
  }
  let apmConfig;
  // Try JSON parse first, then YAML
  try {
    apmConfig = JSON.parse(raw);
    log('APM configuration parsed as JSON');
  } catch (e) {
    log('APM config not valid JSON, trying YAML…');
    try {
      let yamlModule = await import('https://esm.sh/js-yaml');
      if (typeof yamlModule.load !== 'function' && yamlModule.default && typeof yamlModule.default.load === 'function') {
        yamlModule = yamlModule.default;
      }
      if (typeof yamlModule.load !== 'function') {
        throw new Error('YAML parser missing load()');
      }
      apmConfig = yamlModule.load(raw);
      log('APM configuration parsed as YAML');
    } catch (e2) {
      const msg = 'Invalid configuration for APM agent (not JSON or YAML)';
      log(`ERROR: ${msg}`);
      alert(msg);
      return;
    }
  }
  try {
    const mod = await import('https://esm.sh/@elastic/apm-rum');
    const agentModule = mod.init ? mod : (mod.default || {});
    const apmInit = agentModule.init;
    if (typeof apmInit !== 'function') {
      throw new Error('init() function not found in APM module');
    }
    const apm = apmInit(apmConfig);
    window.apm = apm;
    log('APM agent initialized');
  } catch (err) {
    log(`ERROR loading APM agent: ${err.message}`);
    console.error(err);
  }
});
stepBtn.addEventListener('click', step);
stopBtn.addEventListener('click', stop);