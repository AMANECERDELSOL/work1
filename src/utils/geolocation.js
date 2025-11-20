import { supabase } from '../lib/supabase'

/**
 * Get user's current location using browser Geolocation API
 * @returns {Promise<{latitude: number, longitude: number}>}
 */
export const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocalización no soportada por este navegador'))
            return
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                })
            },
            (error) => {
                let errorMessage = 'Error al obtener ubicación'
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = 'Permiso de ubicación denegado'
                        break
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = 'Información de ubicación no disponible'
                        break
                    case error.TIMEOUT:
                        errorMessage = 'Tiempo de espera agotado'
                        break
                }
                reject(new Error(errorMessage))
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        )
    })
}

/**
 * Convert coordinates to address using OpenStreetMap Nominatim
 * @param {number} latitude
 * @param {number} longitude
 * @returns {Promise<string>} Address string
 */
export const reverseGeocode = async (latitude, longitude) => {
    try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'FSM-Platform/1.0'
            }
        })

        if (!response.ok) {
            throw new Error('Error en geocodificación inversa')
        }

        const data = await response.json()

        return data.display_name || `${latitude}, ${longitude}`
    } catch (error) {
        console.error('Reverse geocoding error:', error)
        return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
    }
}

/**
 * Get both location and address
 * @returns {Promise<{latitude: number, longitude: number, address: string}>}
 */
export const getLocationWithAddress = async () => {
    try {
        const coords = await getCurrentLocation()
        const address = await reverseGeocode(coords.latitude, coords.longitude)

        return {
            ...coords,
            address
        }
    } catch (error) {
        throw error
    }
}
