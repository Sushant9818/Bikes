import api from './api.js'

/**
 * Register: creates user as PENDING_PHONE_VERIFICATION and sends OTP.
 * @param {Object} payload - { username, email, password, phoneNumber }
 * @returns {Promise<{ message?: string, phoneNumberMasked?: string }>}
 */
export function register(payload) {
  return api.post('/auth/register', payload).then((r) => r.data)
}

/**
 * Login. Use after phone is verified.
 * @param {Object} payload - { username, password }
 */
export function login(payload) {
  return api.post('/auth/login', payload).then((r) => r.data)
}

export function sendOtp(phoneNumber) {
  return api.post('/auth/send-otp', { phoneNumber }).then((r) => r.data)
}

export function verifyOtp(phoneNumber, code) {
  return api.post('/auth/verify-otp', { phoneNumber, code }).then((r) => r.data)
}

export function verifyEmail(token) {
  return api.get('/auth/verify-email', { params: { token } }).then((r) => r.data)
}

export function forgotPassword(email) {
  return api.post('/auth/forgot-password', { email }).then((r) => r.data)
}

export function resetPassword(token, newPassword) {
  return api.post('/auth/reset-password', { token, newPassword }).then((r) => r.data)
}
