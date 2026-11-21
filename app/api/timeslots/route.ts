import { NextResponse } from 'next/server'

export async function GET() {
  const timeslots = [
    { id: 'today-3-5pm', label: 'Today 3:00 PM - 5:00 PM' },
    { id: 'today-5-7pm', label: 'Today 5:00 PM - 7:00 PM' },
    { id: 'tomorrow-10-12pm', label: 'Tomorrow 10:00 AM - 12:00 PM' },
    { id: 'tomorrow-2-4pm', label: 'Tomorrow 2:00 PM - 4:00 PM' },
  ]
  return NextResponse.json({ timeslots })
}
