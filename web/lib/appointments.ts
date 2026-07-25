import type { Appointment, AppointmentService, ServiceType } from '@prisma/client'

export type AppointmentWithServices = Appointment & { services: AppointmentService[] }

export interface AppointmentDto extends Omit<Appointment, never> {
  services: ServiceType[]
}

export function toAppointmentDto(appointment: AppointmentWithServices): AppointmentDto {
  return { ...appointment, services: appointment.services.map((s) => s.service) }
}
