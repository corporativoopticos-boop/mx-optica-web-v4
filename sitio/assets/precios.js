/* MX Óptica · Tabla pública de precios (V5.1) — ÚNICA fuente de verdad del sitio y del cotizador.
   Fuente: información comercial proporcionada por el propietario en el chat de trabajo del 2026-11-09.
   Reglas:
   - Todos los importes son «DESDE» (MXN) y se validan según graduación.
   - precio:null = «precio por confirmar». Nunca usar 0 para representar «pendiente».
   - «incluye»: tratamientos ya incluidos en el paquete; el cotizador nunca los cobra dos veces.
   - Materiales Hi-Index / Super Hi-Index: mutuamente excluyentes (un solo escalón) y solo en monofocales;
     en bifocales y progresivos se cotizan en sucursal.
   - La promoción de $980 no incluye antirreflejante y no se acumula con otras promociones.
   - Este archivo es público: nunca incluir costos internos, márgenes ni credenciales. */
window.MX_PRECIOS = Object.freeze({
  version: '2026-11-09 · V5.1',
  paquetes: {
    'mono-br-promo': { nombre: 'Monofocal Blue Ray · Promoción', tipo: 'monofocal', precio: 980,  autorizado: true, incluye: ['blue-ray'], promocion: true, admiteAdicionales: false,
                       nota: 'Promoción. No incluye antirreflejante. No acumulable con otras promociones.' },
    'mono-br':       { nombre: 'Monofocal Blue Ray',                  tipo: 'monofocal', precio: 1125, autorizado: true, incluye: ['blue-ray'] },
    'mono-br-ar':    { nombre: 'Monofocal Blue Ray + Antirreflejante', tipo: 'monofocal', precio: 1415, autorizado: true, incluye: ['blue-ray', 'antirreflejante'] },
    'mono-basico':   { nombre: 'Monofocal Básico',                    tipo: 'monofocal', precio: null, autorizado: false, incluye: [] },
    'foto-completo': { nombre: 'Fotocromático completo',              tipo: null,        precio: null, autorizado: false, incluye: ['fotocromatico'] },
    'bifocal':       { nombre: 'Bifocal Básico',                      tipo: 'bifocal',   precio: 899,  autorizado: true, incluye: [] },
    'bifocal-ar':    { nombre: 'Bifocal Antirreflejante',             tipo: 'bifocal',   precio: 1189, autorizado: true, incluye: ['antirreflejante'] },
    'progresivo':    { nombre: 'Progresivo Básico',                   tipo: 'progresivo', precio: 1470, autorizado: true, incluye: [] },
    'progresivo-ar': { nombre: 'Progresivo Antirreflejante',          tipo: 'progresivo', precio: 1760, autorizado: true, incluye: ['antirreflejante'] }
  },
  tratamientos: {
    'antirreflejante': { nombre: 'Antirreflejante', precio: 290, autorizado: true },
    'blue-ray':        { nombre: 'Blue Ray',        precio: 575, autorizado: true },
    'fotocromatico':   { nombre: 'Fotocromático',   precio: 675, autorizado: true }
  },
  materiales: {
    'estandar':       { nombre: 'Estándar',       precio: 0,    autorizado: true },
    'hi-index':       { nombre: 'Hi-Index',       precio: 400,  autorizado: true, soloTipos: ['monofocal'] },
    'super-hi-index': { nombre: 'Super Hi-Index', precio: 1090, autorizado: true, soloTipos: ['monofocal'] }
  },
  promociones: {
    'buen-fin-2026': {
      nombre: 'Buen Fin: 2 pares completos', precio: 2499, autorizado: true,
      inicio: '2026-11-13T00:00:00-06:00',   /* hora del centro de México */
      fin:    '2026-11-17T23:59:59-06:00',
      combinable: false,                      /* no se mezcla con la promoción de $980 */
      condiciones: null                       /* PENDIENTE: texto exacto del propietario. null = «Condiciones por confirmar en sucursal». */
    }
  }
});
