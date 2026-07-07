// Replica EXACTAMENTE el esquema de verificación del backend:
//
//   clave = dispositivo.hmac_key.encode("utf-8")
//   payload_str = json.dumps([r.model_dump(mode="json") for r in registros],
//                             default=str, sort_keys=True).encode("utf-8")
//   firma = hmac.new(clave, payload_str, hashlib.sha256).hexdigest()
//
// Puntos clave replicados:
// - Se firma SOLO el array de registros (sin envolver con device_id).
// - json.dumps con sort_keys=True ordena las claves alfabéticamente en
//   todo nivel de anidamiento (incluyendo dentro de "datos").
// - Sin `separators` explícito, json.dumps usa los separadores por
//   default CON espacio (", " y ": "), no JSON compacto — hay que
//   replicar esto exacto o el hash no coincide byte a byte.
// - La clave se usa tal cual, codificada UTF-8 (no se decodifica de
//   base64/hex).
//
// ÚNICO RIESGO NO CONFIRMADO: si el campo timestamp_local del modelo
// Pydantic es tz-aware, Pydantic lo reserializaría con sufijo "+00:00" y
// esta firma no va a coincidir. Acá se asume naive (sin timezone) por el
// nombre del campo ("local"). Si el backend rechaza la firma, esto es lo
// primero a revisar.

function pythonJsonStringify(value: unknown): string {
  if (value === null || value === undefined) return 'null'
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (typeof value === 'number') return JSON.stringify(value)
  if (typeof value === 'string') return JSON.stringify(value)
  if (Array.isArray(value)) {
    return `[${value.map(pythonJsonStringify).join(', ')}]`
  }
  const obj = value as Record<string, unknown>
  const keys = Object.keys(obj).sort()
  const entries = keys.map((k) => `${JSON.stringify(k)}: ${pythonJsonStringify(obj[k])}`)
  return `{${entries.join(', ')}}`
}

// Timestamp naive tipo Python isoformat(): YYYY-MM-DDTHH:mm:ss.ffffff
// (6 dígitos de microsegundos; JS solo tiene precisión de milisegundos,
// así que los últimos 3 dígitos quedan en 0). Sin sufijo de zona horaria.
export function formatTimestampLocal(date: Date): string {
  const pad = (n: number, len = 2) => String(n).padStart(len, '0')
  const micros = pad(date.getMilliseconds() * 1000, 6)
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${micros}`
  )
}

export async function firmarRegistros(hmacKey: string, registros: unknown[]): Promise<string> {
  const payloadString = pythonJsonStringify(registros)
  const enc = new TextEncoder()
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(hmacKey),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(payloadString))
  return Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}