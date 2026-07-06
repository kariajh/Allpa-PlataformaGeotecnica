const DEVICE_ID_KEY = 'geofield_device_id'

// Identificador estable de este navegador/dispositivo. Se genera una sola
// vez y se persiste en localStorage (no en Dexie, porque tiene que
// sobrevivir incluso si algún día se limpia la base offline). El backend
// lo usa para trazabilidad y el módulo de Sync lo usa para saber qué
// dispositivo originó cada registro. Es requerido en los POST de varios
// módulos (confirmado en /proyectos, revisar el resto cuando lleguemos).
export function getDeviceId(): string {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY)
  if (!deviceId) {
    deviceId = crypto.randomUUID()
    localStorage.setItem(DEVICE_ID_KEY, deviceId)
  }
  return deviceId
}