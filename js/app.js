import { solicitud, actualizarDato, irAPaso, reiniciarSolicitud } from './estado.js';
import { importeNumerico } from './cotizador.js';
import { bloqueValido, validarCampo, erroresDe } from './validaciones.js';
import { simularPago, generarPoliza } from './pago.js';
import { configurarPlanes, render, renderBotones, renderResumen, obtenerPlan } from './render.js';

const formularios = [
  { id: 'form-cotizacion', bloque: 'equipo' },
  { id: 'form-personales', bloque: 'titular' },
  { id: 'form-pago', bloque: 'pago' },
];
const tocados = new Set();
let pagoEnProceso = false;
let catalogoCargado = false;

function mostrarError(bloque, campo, error) {
  const nombre = bloque === 'pago' && campo === 'titular' ? 'titularPago' : campo;
  const grupo = document.querySelector(`[data-field="${nombre}"]`);
  if (!grupo) return;
  const mensaje = document.getElementById(`${nombre}-error`);
  grupo.toggleAttribute('data-invalid', Boolean(error));
  if (mensaje) { mensaje.textContent = error || ''; mensaje.hidden = !error; }
  const controles = grupo.querySelectorAll('input, select');
  controles.forEach((control) => {
    if (error) control.setAttribute('aria-invalid', 'true');
    else control.removeAttribute('aria-invalid');
  });
}

function limpiarErrores() {
  tocados.clear();
  for (const grupo of document.querySelectorAll('[data-field]')) {
    grupo.removeAttribute('data-invalid');
    grupo.querySelectorAll('[aria-invalid]').forEach((input) => input.removeAttribute('aria-invalid'));
    const mensaje = grupo.querySelector('.field-error');
    if (mensaje) { mensaje.textContent = ''; mensaje.hidden = true; }
  }
}

function todosLosErrores(bloque) {
  const errores = erroresDe(bloque, solicitud[bloque]);
  for (const [campo, error] of Object.entries(errores)) {
    tocados.add(`${bloque}.${campo}`);
    mostrarError(bloque, campo, error);
  }
  const primerCampo = Object.keys(errores).find((campo) => errores[campo]);
  if (primerCampo) {
    const nombre = bloque === 'pago' && primerCampo === 'titular' ? 'titularPago' : primerCampo;
    document.querySelector(`[data-field="${nombre}"] input, [data-field="${nombre}"] select`)?.focus();
  }
  return !primerCampo;
}

function obtenerValorInput(input) {
  if (input.name === 'valor') return importeNumerico(input.value);
  if (input.type === 'checkbox') return input.checked;
  if (input.name === 'tarjeta') {
    const limpio = input.value.replace(/\D/g, '').slice(0, 16);
    input.value = limpio.replace(/(.{4})/g, '$1 ').trim();
    return input.value;
  }
  if (input.name === 'vencimiento') {
    const limpio = input.value.replace(/\D/g, '').slice(0, 4);
    input.value = limpio.length > 2 ? `${limpio.slice(0, 2)}/${limpio.slice(2)}` : limpio;
    return input.value;
  }
  if (['dni', 'cvv'].includes(input.name)) {
    input.value = input.value.replace(/\D/g, '');
    return input.value;
  }
  return input.value;
}

function manejarCambio(evento, bloque) {
  const input = evento.target;
  if (!(input instanceof HTMLInputElement || input instanceof HTMLSelectElement) || !input.name) return;
  if ((input.type === 'radio' || input.type === 'checkbox') && input.type === 'radio' && !input.checked) return;
  const campo = bloque === 'pago' && input.name === 'titularPago' ? 'titular' : input.name;
  if (!(campo in solicitud[bloque])) return;
  const valor = obtenerValorInput(input);
  actualizarDato(bloque, campo, valor);
  if (tocados.has(`${bloque}.${campo}`) && campo !== 'metodo') {
    mostrarError(bloque, campo, validarCampo(bloque, campo, valor));
  }
  renderBotones(pagoEnProceso);
  renderResumen();
}

function configurarEventosDeFormulario() {
  for (const { id, bloque } of formularios) {
    const form = document.getElementById(id);
    for (const tipo of ['input', 'change']) form.addEventListener(tipo, (ev) => manejarCambio(ev, bloque));
    form.addEventListener('focusout', (ev) => {
      const input = ev.target;
      if (!('name' in input)) return;
      const campo = bloque === 'pago' && input.name === 'titularPago' ? 'titular' : input.name;
      if (!(campo in solicitud[bloque]) || campo === 'metodo') return;
      tocados.add(`${bloque}.${campo}`);
      mostrarError(bloque, campo, validarCampo(bloque, campo, solicitud[bloque][campo]));
      if (campo === 'valor' && solicitud.equipo.valor) {
        input.value = new Intl.NumberFormat('es-AR').format(solicitud.equipo.valor);
      }
    });
  }
}

function navegar(paso) {
  irAPaso(paso);
  render();
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function reiniciar() {
  reiniciarSolicitud();
  limpiarErrores();
  navegar(0);
}

function prepararPago(procesando) {
  pagoEnProceso = procesando;
  const form = document.querySelector('#form-pago');
  form.querySelectorAll('input').forEach((input) => { input.disabled = procesando; });
  document.querySelector('#pay-label').textContent = procesando ? 'Procesando…' : 'Pagar';
  document.querySelector('#pay-amount').hidden = procesando;
  document.querySelector('#pay-button [aria-hidden]').hidden = procesando;
  renderBotones(procesando);
}

async function completarPago() {
  if (pagoEnProceso || !todosLosErrores('pago')) return;
  // Capturamos el número al iniciar para que no cambie durante los 1.500 ms.
  const tarjeta = solicitud.pago.tarjeta;
  prepararPago(true);
  try {
    const resultado = await simularPago(tarjeta);
    if (resultado.ok) {
      solicitud.poliza = generarPoliza();
      navegar(5);
    } else {
      document.querySelector('#payment-error-reason').textContent = `${resultado.motivo}. Probá con la tarjeta de prueba aprobada o cambiá el medio de pago.`;
      navegar(6);
    }
  } catch (error) {
    document.querySelector('#payment-error-reason').textContent = 'No fue posible completar la simulación. Volvé a intentar.';
    navegar(6);
  } finally {
    prepararPago(false);
  }
}

function mostrarErrorDeCarga(mensaje) {
  const contenedor = document.querySelector('#app-alert');
  contenedor.hidden = false;
  contenedor.textContent = mensaje;
}

async function iniciar() {
  configurarEventosDeFormulario();
  const comenzarCotizacion = () => {
    if (catalogoCargado) navegar(1);
    else mostrarErrorDeCarga('No se pudieron cargar los planes. Iniciá un servidor local y recargá la página.');
  };
  for (const id of ['start-cellular', 'start-cellular-mobile', 'catalog-cell']) document.querySelector(`#${id}`).addEventListener('click', comenzarCotizacion);
  document.querySelector('#header-back').addEventListener('click', () => { if (!pagoEnProceso && solicitud.paso >= 1 && solicitud.paso <= 4) navegar(solicitud.paso - 1); });
  document.querySelector('#success-details-toggle').addEventListener('click', (ev) => { const area = document.querySelector('#success-details'); area.hidden = !area.hidden; ev.currentTarget.setAttribute('aria-expanded', String(!area.hidden)); ev.currentTarget.textContent = area.hidden ? 'Ver detalles' : 'Ocultar detalles'; });
  document.querySelector('#brand-home').addEventListener('click', (e) => { e.preventDefault(); reiniciar(); });
  document.querySelector('#success-home').addEventListener('click', reiniciar);
  document.querySelectorAll('[data-back]').forEach((boton) => boton.addEventListener('click', () => {
    if (!pagoEnProceso) navegar(Number(boton.dataset.back));
  }));
  document.querySelector('#form-cotizacion').addEventListener('submit', (ev) => {
    ev.preventDefault();
    if (todosLosErrores('equipo')) navegar(2);
  });
  document.querySelector('#plans-next').addEventListener('click', () => {
    if (obtenerPlan() && bloqueValido('equipo', solicitud.equipo)) navegar(3);
  });
  document.querySelector('#plans-list').addEventListener('change', (ev) => {
    if (ev.target.matches('input[name="plan"]') && ev.target.checked) {
      solicitud.plan = ev.target.value;
      renderPlanes();
      renderResumen();
      renderBotones();
    }
  });
  document.querySelector('#form-personales').addEventListener('submit', (ev) => {
    ev.preventDefault();
    if (todosLosErrores('titular')) navegar(4);
  });
  document.querySelector('#form-pago').addEventListener('submit', (ev) => {
    ev.preventDefault();
    void completarPago();
  });
  document.querySelector('#retry-payment').addEventListener('click', () => { navegar(4); document.querySelector('#tarjeta').focus(); });
  document.querySelector('#change-payment').addEventListener('click', () => { navegar(4); document.querySelector('input[name="metodo"]:checked').focus(); });
  render();
  window.addEventListener('resize', () => { const debeEstarEnPago = window.innerWidth < 1024 && solicitud.paso === 4; const ubicadoEnPago = document.querySelector('#summary-aside').parentElement === document.querySelector('#form-pago'); if (debeEstarEnPago !== ubicadoEnPago) render(); });

  try {
    const respuesta = await fetch(new URL('../data/planes.json', import.meta.url));
    if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);
    const planes = await respuesta.json();
    if (!Array.isArray(planes) || planes.length !== 3 || !planes.every((p) => typeof p.tasaAnual === 'number' && Array.isArray(p.coberturas))) {
      throw new Error('Formato de planes.json inválido');
    }
    configurarPlanes(planes);
    catalogoCargado = true;
    render();
  } catch (error) {
    mostrarErrorDeCarga('No se pudo cargar data/planes.json. Abrí el proyecto con Live Server, npx serve o python -m http.server (no usando file://).');
    console.error('Error al cargar los planes:', error);
  }
}

void iniciar();
