/* MX Óptica · Tabla pública de precios del cotizador (V5).
   REGLA: solo cambiar "autorizado" a true con aprobación expresa y por escrito de la dirección comercial.
   - precio: importe de venta al público en MXN (número) o null si no está definido.
   - Paquetes: precio base. Materiales y tratamientos: importe ADICIONAL al paquete.
   - Nunca usar 0 para representar "pendiente": usar null.
   Las referencias históricas documentadas en Drive (Monofocal Básico 550, Protección Digital 1125,
   Bifocal 1189, Progresivo 1470) NO están autorizadas y por eso no se publican aquí.
   Este archivo es público: nunca incluir costos internos, márgenes ni credenciales. */
window.MX_PRECIOS = Object.freeze({
  version: '2026-11-09',
  paquetes: {
    'monofocal-basico':   { precio: null, autorizado: false },
    'proteccion-digital': { precio: null, autorizado: false },
    'bifocal':            { precio: null, autorizado: false },
    'progresivo':         { precio: null, autorizado: false }
  },
  materiales: {
    'recomendacion': { precio: null, autorizado: false },
    'resina':        { precio: null, autorizado: false },
    'policarbonato': { precio: null, autorizado: false },
    'alto-indice':   { precio: null, autorizado: false }
  },
  tratamientos: {
    'no-se':           { precio: null, autorizado: false },
    'sin-tratamiento': { precio: 0,    autorizado: true  }, /* sin tratamiento = sin adicional */
    'antirreflejante': { precio: null, autorizado: false },
    'blue-ray':        { precio: null, autorizado: false },
    'fotocromatico':   { precio: null, autorizado: false },
    'ar-blue':         { precio: null, autorizado: false },
    'ar-foto':         { precio: null, autorizado: false },
    'blue-foto':       { precio: null, autorizado: false },
    'triple':          { precio: null, autorizado: false }
  }
});
