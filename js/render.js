import { solicitud } from './estado.js';
import { calcularCuota, pesos } from './cotizador.js';
import { bloqueValido } from './validaciones.js';

const etiquetasPaso = ['Cotizá', 'Plan', 'Datos', 'Pago'];
const edadEquipo = { menos1: 'Menos de 1 año', '1a2': '1 a 2 años', mas2: 'Más de 2 años' };
let catalogoPlanes = [];

export function configurarPlanes(planes) { catalogoPlanes = planes; }
export function obtenerPlan() { return catalogoPlanes.find((p) => p.id === solicitud.plan); }
export function obtenerCuota() {
  const plan = obtenerPlan();
  return plan ? calcularCuota(solicitud.equipo.valor, plan.tasaAnual, solicitud.equipo.antiguedad) : 0;
}

function seguro(texto) {
  return String(texto ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

export function renderStepper() {
  const paso = solicitud.paso;
  const actual = paso >= 5 ? 4 : paso;
  document.querySelector('#stepper-list').innerHTML = etiquetasPaso.map((texto, indice) => {
    const num = indice + 1;
    const completado = num < actual;
    const activo = num === actual;
    return `<li class="stepper-item ${completado ? 'is-complete' : activo ? 'is-active' : ''}" ${activo ? 'aria-current="step"' : ''}>
      <span class="stepper-circle">${completado ? '✓' : num}</span><span>${texto}</span></li>`;
  }).join('');
}

export function renderPlanes() {
  const contenedor = document.querySelector('#plans-list');
  contenedor.innerHTML = catalogoPlanes.map((plan) => {
    const cuota = calcularCuota(solicitud.equipo.valor, plan.tasaAnual, solicitud.equipo.antiguedad);
    return `<label class="plan-choice">
      <input type="radio" name="plan" value="${seguro(plan.id)}" ${solicitud.plan === plan.id ? 'checked' : ''}>
      <span class="plan-card card">
        <span class="plan-head"><span class="plan-name-wrap"><strong class="plan-title">${seguro(plan.nombre)}</strong>${plan.recomendado ? '<span class="badge plan-badge">Recomendado</span>' : ''}</span><span class="plan-check" aria-hidden="true"></span></span>
        <span class="plan-price-row"><span class="plan-price">${seguro(pesos.format(cuota))}</span><span class="plan-period">/ mes</span></span>
        <span class="plan-coverages">${plan.coberturas.map((c) => `<span class="plan-coverage"><span aria-hidden="true">✓</span><span>${seguro(c)}</span></span>`).join('')}</span>
      </span>
    </label>`;
  }).join('');
}

export function renderResumen() {
  const plan = obtenerPlan();
  const cuota = obtenerCuota();
  const equipo = solicitud.equipo;
  const titular = solicitud.titular;
  const equipoNombre = [equipo.marca, equipo.modelo.trim()].filter(Boolean).join(' ');
  const titularNombre = [titular.nombre.trim(), titular.apellido.trim()].filter(Boolean).join(' ');
  const filas = [
    ['Seguro', 'Celular'],
    ['Equipo', equipoNombre || '—'],
    ...(solicitud.paso === 1 ? [['Valor', equipo.valor ? pesos.format(equipo.valor) : '—']] : [['Plan', plan?.nombre || '—']]),
    ...(solicitud.paso >= 4 ? [['Titular', titularNombre || '—']] : []),
  ];
  const importe = cuota && solicitud.paso >= 2 ? pesos.format(cuota) : '—';
  document.querySelector('#summary').innerHTML = `
    <h2 class="summary-heading">${solicitud.paso === 4 ? 'Resumen de tu solicitud' : 'Resumen'}</h2>
    <div class="summary-body">${filas.map(([k,v]) => `<div class="summary-line"><span>${seguro(k)}</span><strong>${seguro(v)}</strong></div>`).join('')}
      <div class="summary-divider"></div><div class="summary-total"><span>Total mensual</span><strong>${seguro(importe)}</strong></div>
      <p class="summary-trust">✓ &nbsp;Contratación 100% online · cancelás cuando quieras</p>
    </div>
    <div class="summary-mobile"><span>Plan ${seguro(plan?.nombre || 'Plus')} · ${seguro(equipo.modelo || 'tu celular')}</span><strong>${seguro(importe)}/mes</strong></div>`;
}

function rellenarFormulario() {
  for (const [campo, valor] of Object.entries(solicitud.equipo)) {
    const control = document.getElementById(campo);
    if (campo === 'antiguedad') document.querySelectorAll('input[name="antiguedad"]').forEach((r) => { r.checked = r.value === valor; });
    else if (control) control.value = campo === 'valor' ? (valor ? new Intl.NumberFormat('es-AR').format(valor) : '') : valor;
  }
  for (const [campo, valor] of Object.entries(solicitud.titular)) {
    const control = document.getElementById(campo);
    if (control) { if (campo === 'terminos') control.checked = valor; else control.value = valor; }
  }
  for (const [campo, valor] of Object.entries(solicitud.pago)) {
    if (campo === 'metodo') document.querySelectorAll('input[name="metodo"]').forEach((r) => { r.checked = r.value === valor; });
    else {
      const control = document.getElementById(campo === 'titular' ? 'titularPago' : campo);
      if (control) control.value = valor;
    }
  }
}

export function renderBotones(procesando = false) {
  const cotizacionOK = bloqueValido('equipo', solicitud.equipo);
  const datosOK = bloqueValido('titular', solicitud.titular);
  const pagoOK = bloqueValido('pago', solicitud.pago);
  document.querySelector('#quote-next').disabled = !cotizacionOK;
  document.querySelector('#person-next').disabled = !datosOK;
  document.querySelector('#pay-button').disabled = !pagoOK || procesando;
  document.querySelector('#payment-back').disabled = procesando;
  document.querySelector('#quote-hint').textContent = cotizacionOK ? '' : 'Completá los datos para continuar';
  document.querySelector('#person-hint').textContent = datosOK ? '' : 'Completá los datos obligatorios';
  document.querySelector('#payment-hint').textContent = pagoOK ? '' : 'Completá los datos de prueba';
  document.querySelector('#pay-amount').textContent = pesos.format(obtenerCuota());
}

function renderResultado() {
  if (solicitud.paso !== 5) return;
  const t = solicitud.titular;
  const equipo = solicitud.equipo;
  const fecha = new Date().toLocaleDateString('es-AR');
  document.querySelector('#success-title').textContent = `¡Listo, ${t.nombre}! Tu celular ya está protegido`;
  document.querySelector('[data-paso="5"] .result-lead').textContent = `Te enviamos la póliza a ${t.email}`;
  document.querySelector('#policy-number').textContent = solicitud.poliza ?? '';
  const detalles = [
    ['Plan', obtenerPlan()?.nombre ?? ''],
    ['Equipo', `${equipo.marca} ${equipo.modelo}`],
    ['Vigencia desde', fecha],
    ['Cuota mensual', pesos.format(obtenerCuota())],
  ];
  document.querySelector('#success-details').innerHTML = detalles.map(([k, v]) => `<div class="result-detail"><span>${seguro(k)}</span><strong>${seguro(v)}</strong></div>`).join('');
}

export function render() {
  const paso = solicitud.paso;
  document.body.dataset.step = String(paso);
  for (const seccion of document.querySelectorAll('section[data-paso]')) seccion.hidden = Number(seccion.dataset.paso) !== paso;
  const resumen = document.querySelector('#summary-aside');
  // Es el MISMO nodo de resumen: se mueve al inicio del pago en mobile, sin duplicar HTML ni cálculos.
  if (window.innerWidth < 1024 && paso === 4) {
    const formularioPago = document.querySelector('#form-pago');
    formularioPago.insertBefore(resumen, formularioPago.firstChild);
  } else if (resumen.parentElement !== document.querySelector('#checkout-layout')) {
    document.querySelector('#checkout-layout').append(resumen);
  }
  document.querySelector('#checkout-layout').hidden = paso === 0;
  document.querySelector('#stepper').hidden = paso === 0 || paso >= 5;
  document.querySelector('#desktop-heading').hidden = paso === 0 || paso >= 5;
  document.querySelector('#checkout-layout').classList.toggle('result-layout', paso >= 5);
  resumen.hidden = paso === 0 || paso >= 5 || (window.innerWidth < 1024 && (paso === 1 || paso === 3));
  const h1 = document.querySelector(`section[data-paso="${paso}"] .screen-heading h1`);
  if (h1) document.querySelector('#desktop-heading-title').textContent = h1.textContent;
  document.querySelector('#mobile-step-title').textContent = ['', 'Cotizá tu seguro', 'Elegí tu plan', 'Tus datos', 'Pago'][paso] || '';
  document.querySelector('#mobile-step-title').hidden = paso === 0 || paso >= 5;
  document.querySelector('#header-back').hidden = paso === 0 || paso >= 5;
  renderStepper();
  rellenarFormulario();
  renderPlanes();
  renderResumen();
  renderBotones();
  renderResultado();
  document.querySelector('#footer-year').textContent = String(new Date().getFullYear());
}
