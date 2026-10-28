// Fuente única de verdad. No se guardan datos en localStorage ni en servidores.
function nuevaSolicitud() {
  return {
    paso: 0, // 0 = catálogo, 1..4 = contratación, 5 = éxito, 6 = pago rechazado
    equipo: { marca: '', modelo: '', valor: 0, antiguedad: '' },
    plan: 'plus',
    titular: { nombre: '', apellido: '', dni: '', nacimiento: '', email: '', celular: '', terminos: false },
    pago: { metodo: 'credito', tarjeta: '', vencimiento: '', cvv: '', titular: '' },
    poliza: null
  };
}

export const solicitud = nuevaSolicitud();

export function actualizarDato(bloque, campo, valor) {
  if (!['equipo', 'titular', 'pago'].includes(bloque) || !(campo in solicitud[bloque])) {
    throw new Error(`Campo de estado desconocido: ${bloque}.${campo}`);
  }
  solicitud[bloque][campo] = valor;
}

export function irAPaso(paso) {
  if (!Number.isInteger(paso) || paso < 0 || paso > 6) throw new Error('Paso fuera de rango');
  solicitud.paso = paso;
}

export function reiniciarSolicitud() {
  // Conservamos la referencia exportada (un único objeto durante todo el flujo).
  const inicial = nuevaSolicitud();
  for (const clave of Object.keys(solicitud)) solicitud[clave] = inicial[clave];
}
