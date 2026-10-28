export const FACTORES_ANTIGUEDAD = Object.freeze({ menos1: 1, '1a2': 1.10, mas2: 1.25 });

export function calcularCuota(valor, tasaAnual, antiguedad) {
  const factor = FACTORES_ANTIGUEDAD[antiguedad];
  if (!Number.isFinite(valor) || !Number.isFinite(tasaAnual) || !factor) return 0;
  return Math.round(valor * tasaAnual / 12 * factor);
}

export function importeNumerico(valor) {
  return Number(String(valor ?? '').replace(/\D/g, '')) || 0;
}

export const pesos = new Intl.NumberFormat('es-AR', {
  style: 'currency', currency: 'ARS', maximumFractionDigits: 0
});
