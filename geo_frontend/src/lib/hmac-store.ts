const PREFIX = 'geofield_hmac_key:'

// El servidor devuelve hmac_key UNA SOLA VEZ, en la respuesta del POST
// /dispositivos. Se guarda acá, en localStorage, indexada por device_id
// (un mismo navegador podría en teoría registrar más de un dispositivo).
//
// Aviso de seguridad: localStorage NO es una bóveda segura — cualquier
// script que corra en la página puede leerlo. Para este proyecto es un
// compromiso razonable, pero no serviría para un sistema en producción
// con datos realmente sensibles.
export function storeHmacKey(deviceId: string, hmacKey: string) {
  localStorage.setItem(PREFIX + deviceId, hmacKey)
}

export function getHmacKey(deviceId: string): string | null {
  return localStorage.getItem(PREFIX + deviceId)
}