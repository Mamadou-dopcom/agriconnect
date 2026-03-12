import { NextResponse } from 'next/server'
import { config } from '@/lib/config'

export async function GET() {
  return NextResponse.json({
    deliveryFee: config.deliveryFee,
    platformCommissionPercent: config.platformCommissionPercent,
  })
}
