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
      astigmatismoMaximo: 2.00,
      /* Condiciones exactas proporcionadas por el propietario (chat de trabajo, 2026-11-09). */
      condiciones: [
        'Dos pares completos por $2,499.',
        'Vigencia: del 13 al 17 de noviembre de 2026.',
        'Primer par con armazón de marca participante y antirreflejante.',
        'Segundo par de línea con micas monofocales sencillas sin tratamientos.',
        'Astigmatismo hasta 2.00 D.',
        'Modelos sujetos a disponibilidad.',
        'No aplica en bifocales ni progresivos.',
        'Graduaciones especiales sujetas a valoración.',
        'No se combina con la promoción de $980.'
      ]
    }
  },
  /* Recargo por graduación — SOLO monofocales. Se aplica un único escalón (nunca se acumulan) y es
     independiente de los materiales Hi-Index / Super Hi-Index. No aplica a bifocales ni progresivos.
     Si no se conoce la graduación, el precio queda sujeto a validación. */
  recargosGraduacion: {
    aplicaA: ['monofocal'],
    criterio: 'Graduación más alta en valor absoluto (esfera) de cualquiera de los dos ojos.',
    escalones: [
      { id: 'g0', etiqueta: 'Hasta ±2.00 D',      recargo: 0 },
      { id: 'g1', etiqueta: '±2.25 a ±4.00 D',    recargo: 350 },
      { id: 'g2', etiqueta: '±4.25 a ±6.00 D',    recargo: 550 },
      { id: 'g3', etiqueta: '±6.25 a ±8.00 D',    recargo: 750 },
      { id: 'g4', etiqueta: '±8.25 a ±10.00 D',   recargo: 1100 },
      { id: 'g5', etiqueta: 'Desde ±10.25 D',     recargo: 1550 }
    ]
  }
});
