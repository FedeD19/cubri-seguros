// Las funciones son puras: valor -> string de error o null.
import { importeNumerico } from './cotizador.js';

export function validarMarca(valor) { return String(valor).trim() ? null : 'Elegí una marca'; }
export function validarModelo(valor) { return String(valor).trim().length >= 2 && String(valor).trim().length <= 40 ? null : 'Ingresá el modelo del equipo'; }
export function validarValor(valor) {
  const n = typeof valor === 'number' ? valor : importeNumerico(valor);
  return n >= 100000 && n <= 2500000 ? null : 'El valor debe estar entre $100.000 y $2.500.000';
}
export function validarAntiguedad(valor) { return ['menos1', '1a2', 'mas2'].includes(valor) ? null : 'Indicá la antigüedad'; }
export function validarNombre(valor) { return /^[\p{L}]{2,}(?:[ '\-][\p{L}]+)*$/u.test(String(valor).trim()) ? null : 'Ingresá tu nombre'; }
export function validarApellido(valor) { return /^[\p{L}]{2,}(?:[ '\-][\p{L}]+)*$/u.test(String(valor).trim()) ? null : 'Ingresá tu apellido'; }
export function validarDni(valor) { return /^\d{7,8}$/.test(String(valor).trim()) ? null : 'El DNI debe tener 7 u 8 números'; }
export function validarNacimiento(valor) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(valor))) return 'Tenés que ser mayor de edad';
  const fecha = new Date(`${valor}T12:00:00`);
  if (Number.isNaN(fecha.getTime()) || fecha.toISOString().slice(0, 10) !== valor) return 'Tenés que ser mayor de edad';
  const hoy = new Date();
  if (fecha > hoy) return 'Tenés que ser mayor de edad';
  let edad = hoy.getFullYear() - fecha.getFullYear();
  if (hoy.getMonth() < fecha.getMonth() || (hoy.getMonth() === fecha.getMonth() && hoy.getDate() < fecha.getDate())) edad--;
  return edad >= 18 ? null : 'Tenés que ser mayor de edad';
}
export function validarEmail(valor) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(valor).trim()) ? null : 'Ingresá un email válido'; }
export function validarCelular(valor) {
  const n = String(valor).replace(/[\s-]/g, '');
  return /^\d{10}$/.test(n) && !n.startsWith('0') && !n.startsWith('15') ? null : 'Ej.: 11 5555-1234';
}
export function validarTerminos(valor) { return valor === true ? null : 'Tenés que aceptar los términos'; }
export function validarTarjeta(valor) { return /^\d{16}$/.test(String(valor).replace(/\s/g, '')) ? null : 'Número de tarjeta inválido'; }
export function validarVencimiento(valor) {
  const match = /^(\d{2})\/(\d{2})$/.exec(String(valor));
  if (!match) return 'Vencimiento inválido';
  const mes = Number(match[1]);
  const anio = 2000 + Number(match[2]);
  const hoy = new Date();
  return mes >= 1 && mes <= 12 && (anio > hoy.getFullYear() || (anio === hoy.getFullYear() && mes >= hoy.getMonth() + 1)) ? null : 'Vencimiento inválido';
}
export function validarCvv(valor) { return /^\d{3}$/.test(String(valor).trim()) ? null : 'CVV inválido'; }
export function validarTitularPago(valor) { return String(valor).trim().length ? null : 'Ingresá el nombre del titular'; }

const porBloque = {
  equipo: { marca: validarMarca, modelo: validarModelo, valor: validarValor, antiguedad: validarAntiguedad },
  titular: { nombre: validarNombre, apellido: validarApellido, dni: validarDni, nacimiento: validarNacimiento, email: validarEmail, celular: validarCelular, terminos: validarTerminos },
  pago: { tarjeta: validarTarjeta, vencimiento: validarVencimiento, cvv: validarCvv, titular: validarTitularPago }
};

export function validarCampo(bloque, campo, valor) {
  const fn = porBloque[bloque]?.[campo];
  if (!fn) throw new Error(`Validador desconocido: ${bloque}.${campo}`);
  return fn(valor);
}

export function erroresDe(bloque, datos) {
  return Object.fromEntries(Object.entries(porBloque[bloque]).map(([campo, fn]) => [campo, fn(datos[campo])]));
}

export function bloqueValido(bloque, datos) {
  return Object.values(erroresDe(bloque, datos)).every((error) => error === null);
}
