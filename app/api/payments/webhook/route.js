'use strict'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  checkPaymentStatus,
  extractNormalizedStatus,
  extractPaymentReference,
  extractProvider,
  inferProviderFromHeaders,
  verifyWebhookSignature,
} from '@/lib/payments'

function toDbPaymentStatus(status) {
  if (status === 'completed') return 'PAID'
  if (status === 'failed') return 'FAILED'
  return 'PENDING'
}

async function resolvePaymentContext(reference) {
  const order = await prisma.order.findFirst({
    where: { paymentReference: reference },
    include: { payment: true }
  })

  if (order) return { order, payment: order.payment }

  const payment = await prisma.payment.findFirst({
    where: { providerReference: reference },
    include: { order: true }
  })

  if (!payment) return null
  return { order: payment.order, payment }
}

export async function POST(request) {
  try {
    const rawBody = await request.text()

    let payload
    try {
      payload = JSON.parse(rawBody)
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const headerProvider = inferProviderFromHeaders(request.headers)
    const hasPayloadProviderHint = Boolean(
      payload?.provider || payload?.metadata?.provider || payload?.payment_method || payload?.method
    )
    const payloadProvider = hasPayloadProviderHint ? extractProvider(payload) : null

    const providerCandidates = headerProvider
      ? [headerProvider]
      : payloadProvider
        ? [payloadProvider]
        : ['orange', 'wave']

    const providersWithSecrets = providerCandidates.filter(provider => {
      if (provider === 'orange') return Boolean(process.env.ORANGE_WEBHOOK_SECRET)
      return Boolean(process.env.WAVE_WEBHOOK_SECRET)
    })

    if (providersWithSecrets.length > 0) {
      const hasValidSignature = providersWithSecrets.some(provider => verifyWebhookSignature({
        headers: request.headers,
        rawBody,
        provider,
      }))

      if (!hasValidSignature) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    const reference = extractPaymentReference(payload)
    if (!reference) {
      return NextResponse.json({ error: 'Payment reference required' }, { status: 400 })
    }

    const normalizedStatus = extractNormalizedStatus(payload)
    const context = await resolvePaymentContext(reference)
    if (!context) {
      return NextResponse.json({ error: 'Payment or order not found' }, { status: 404 })
    }

    const { order, payment } = context
    const dbPaymentStatus = toDbPaymentStatus(normalizedStatus)

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: {
          paymentReference: reference,
          paymentStatus: dbPaymentStatus,
          status: normalizedStatus === 'completed' && order.status === 'PENDING'
            ? 'CONFIRMED'
            : order.status,
        }
      })

      if (payment) {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: dbPaymentStatus,
            providerReference: reference,
          }
        })
      }
    })

    return NextResponse.json({ success: true, reference, status: normalizedStatus })
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
    const context = await resolvePaymentContext(reference)
    if (!context) {
      return NextResponse.json({ error: 'Payment or order not found' }, { status: 404 })
    }

    const { order, payment } = context
    const providerStatus = await checkPaymentStatus(reference, provider)

    if (providerStatus.success) {
      const normalizedStatus = providerStatus.status
      const dbPaymentStatus = toDbPaymentStatus(normalizedStatus)

      await prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: order.id },
          data: {
            paymentReference: reference,
            paymentStatus: dbPaymentStatus,
            status: normalizedStatus === 'completed' && order.status === 'PENDING'
              ? 'CONFIRMED'
              : order.status,
          }
        })

        if (payment) {
          await tx.payment.update({
            where: { id: payment.id },
            data: {
              status: dbPaymentStatus,
              providerReference: reference,
            }
          })
        }
      })

      return NextResponse.json({
        reference,
        provider: providerStatus.provider,
        status: normalizedStatus,
        paymentStatus: dbPaymentStatus,
      })
    }

    return NextResponse.json({
      reference,
      provider,
      status: String(order.paymentStatus || 'PENDING').toLowerCase(),
      paymentStatus: order.paymentStatus,
    })
  } catch (err) {
    console.error('Payment status check error:', err)
    return NextResponse.json({ error: 'Failed to check payment status' }, { status: 500 })
  }
}
