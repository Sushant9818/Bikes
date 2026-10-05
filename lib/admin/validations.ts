// Re-export the consolidated schemas from the single source of truth
// (`lib/validations/bike.ts`) under the legacy admin-facing names.
export {
  bikeInputSchema as bikeSchema,
  scooterInputSchema as scooterSchema,
  partInputSchema as partSchema,
} from '@/lib/validations/bike'

export type {
  BikeInput as BikeFormData,
  ScooterInput as ScooterFormData,
  PartInput as PartFormData,
} from '@/lib/validations/bike'
