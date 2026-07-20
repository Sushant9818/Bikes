import http from './http.js'

export const SERVICE_TYPES = [
  { value: 'OIL_CHANGE', label: 'Oil Change' },
  { value: 'ENGINE_REPAIR', label: 'Engine Repair' },
  { value: 'TIRE_REPLACEMENT', label: 'Tire Replacement' },
  { value: 'BRAKE_SERVICE', label: 'Brake Service' },
  { value: 'BATTERY_REPLACEMENT', label: 'Battery Replacement' },
  { value: 'CHAIN_ADJUSTMENT', label: 'Chain Adjustment' },
  { value: 'CHAIN_REPLACEMENT', label: 'Chain Replacement' },
  { value: 'SUSPENSION_REPAIR', label: 'Suspension Repair' },
  { value: 'ELECTRICAL_REPAIR', label: 'Electrical Repair' },
  { value: 'GENERAL_INSPECTION', label: 'General Inspection' },
  { value: 'FULL_SERVICE', label: 'Full Service' },
  { value: 'CLUTCH_REPAIR', label: 'Clutch Repair' },
  { value: 'GEAR_REPAIR', label: 'Gear Repair' },
  { value: 'COOLING_SYSTEM_REPAIR', label: 'Cooling System Repair' },
  { value: 'FUEL_SYSTEM_CLEANING', label: 'Fuel System Cleaning' },
  { value: 'AIR_FILTER_REPLACEMENT', label: 'Air Filter Replacement' },
  { value: 'SPARK_PLUG_REPLACEMENT', label: 'Spark Plug Replacement' },
  { value: 'WHEEL_ALIGNMENT', label: 'Wheel Alignment' },
  { value: 'WASHING_DETAILING', label: 'Washing & Detailing' },
  { value: 'OTHER', label: 'Other (specify below)' },
]

export const TIME_SLOTS = [
  '09:00 AM', '10:00 AM', '11:00 AM',
  '12:00 PM', '01:00 PM', '02:00 PM',
  '03:00 PM', '04:00 PM', '05:00 PM',
]

export const STATUS_CONFIG = {
  PENDING:     { label: 'Pending',     color: 'bg-yellow-100 text-yellow-800' },
  APPROVED:    { label: 'Approved',    color: 'bg-blue-100 text-blue-800' },
  REJECTED:    { label: 'Rejected',    color: 'bg-red-100 text-red-800' },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-purple-100 text-purple-800' },
  COMPLETED:   { label: 'Completed',   color: 'bg-green-100 text-green-800' },
  CANCELLED:   { label: 'Cancelled',   color: 'bg-zinc-100 text-zinc-600' },
}

export function getServiceLabel(value) {
  return SERVICE_TYPES.find((s) => s.value === value)?.label ?? value
}

export function createAppointment(data) {
  return http.post('/appointments', data).then((r) => r.data)
}

export function getMyAppointments() {
  return http.get('/appointments/my').then((r) => r.data)
}

export function getAllAppointments(params = {}) {
  return http.get('/appointments', { params }).then((r) => r.data)
}

export function getAppointmentStats() {
  return http.get('/appointments/stats').then((r) => r.data)
}

export function getAppointmentById(id) {
  return http.get(`/appointments/${id}`).then((r) => r.data)
}

export function updateAppointmentStatus(id, data) {
  return http.put(`/appointments/${id}/status`, data).then((r) => r.data)
}

export function rescheduleAppointment(id, data) {
  return http.put(`/appointments/${id}/reschedule`, data).then((r) => r.data)
}

export function cancelAppointment(id) {
  return http.put(`/appointments/${id}/cancel`).then((r) => r.data)
}

export function deleteAppointment(id) {
  return http.delete(`/appointments/${id}`).then((r) => r.data)
}
