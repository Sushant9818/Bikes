import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

const vehicleTabs = [
  { value: 'BIKE', label: 'Suzuki Motorcycles' },
  { value: 'SCOOTER', label: 'Suzuki Scooters' },
]

const partTabs = [
  { value: 'BIKE_PART', label: 'Suzuki Bike Parts' },
  { value: 'SCOOTER_PART', label: 'Suzuki Scooter Parts' },
]

export function VehicleCategoryTabs({ value, onValueChange }) {
  return (
    <Tabs value={value} onValueChange={onValueChange} className="w-full">
      <TabsList className="bg-zinc-100 p-1 rounded-xl w-full sm:w-auto">
        {vehicleTabs.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className="rounded-lg data-[state=active]:bg-[#E60012] data-[state=active]:text-white"
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}

export function PartCategoryTabs({ value, onValueChange }) {
  return (
    <Tabs value={value} onValueChange={onValueChange} className="w-full">
      <TabsList className="bg-zinc-100 p-1 rounded-xl w-full sm:w-auto">
        {partTabs.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className="rounded-lg data-[state=active]:bg-[#E60012] data-[state=active]:text-white"
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
