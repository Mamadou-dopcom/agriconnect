'use strict'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkPaymentStatus } from '@/lib/payments'

export async function POST(request) {
  try {
    const body = await request.json()
    const { event, reference, status, metadata } = body

    if (!reference) {
      return NextResponse.json({ error: 'Payment reference required' }, { status: 400 })
    }

    const provider = metadata?.provider || 'wave'

    if (event === 'payment.initiated') {
      return NextResponse.json({ received: true })
    }

    if (event === 'payment.completed' || status === 'completed') {
      const payment = await prisma.payment.findUnique({
        where: { reference }
      })

      if (!payment) {
        return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
      }

      if (payment.status === 'completed') {
        return NextResponse.json({ message: 'Payment already processed' })
      }

      await prisma.payment.update({
        where: { reference },
        data: { status: 'completed' }
      })

      const order = await prisma.order.findUnique({
        where: { id: payment.orderId }
      })

      if (order && order.status === 'pending') {
        await prisma.order.update({
          where: { id: order.id },
          data: { status: 'confirmed' }
        })
      }

      return NextResponse.json({ success: true, message: 'Payment confirmed' })
    }

    if (event === 'payment.failed' || status === 'failed') {
      await prisma.payment.update({
        where: { reference },
        data: { status: 'failed' }
      })

      return NextResponse.json({ success: true, message: 'Payment failed recorded' })
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('Webhook error:', err)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const reference = searchParams.get('reference')
  const provider = searchParams.get('provider') || 'wave'

  if (!reference) {
    return NextResponse.json({ error: 'Reference required' }, { status: 400 })
  }

  try {
    const payment = await prisma.payment.findUnique({
      where: { reference }
    })

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    if (payment.status === 'pending') {
      const providerStatus = await checkPaymentStatus(reference, provider)
      
      if (providerStatus.success && providerStatus.status === 'completed') {
        await prisma.payment.update({
          where: { reference },
          data: { status: 'completed' }
        })

        await prisma.order.update({
          where: { id: payment.orderId },
          data: { status: 'confirmed' }
        })

        payment.status = 'completed'
      }
    }

    return NextResponse.json({
      reference: payment.reference,
      status: payment.status,
      amount: payment.amount,
      provider: payment.provider
    })
  } catch (err) {
    console.error('Payment status check error:', err)
    return NextResponse.json({ error: 'Failed to check payment status' }, { status: 500 })
  }
}
