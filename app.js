import { WebTracerProvider } from 'https://esm.sh/@opentelemetry/sdk-trace-web';
import { ConsoleSpanExporter, SimpleSpanProcessor } from 'https://esm.sh/@opentelemetry/sdk-trace-base';
import { OTLPTraceExporter } from 'https://esm.sh/@opentelemetry/exporter-trace-otlp-http';

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
  let config;
  try {
    config = JSON.parse(configEl.value);
  } catch (e) {
    alert('Invalid JSON configuration');
    return;
  }
  initTracer(config);
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