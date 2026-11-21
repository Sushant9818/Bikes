import { NextResponse } from 'next/server'

export async function GET() {
  const stores = [
    {
      id: 1,
      name: 'Kathmandu Store',
      address: 'Thamel, Kathmandu',
      phone: '+977-1-4242424',
    },
    {
      id: 2,
      name: 'Pokhara Store',
      address: 'Lakeside, Pokhara',
      phone: '+977-61-414141',
    },
  ]
  return NextResponse.json({ stores })
}
