import Stripe from 'stripe'

let _stripe: Stripe | null = null

function getStripeInstance(): Stripe {
  if (!_stripe) {
    const apiKey = process.env.STRIPE_SECRET_KEY
    if (!apiKey) {
      throw new Error('STRIPE_SECRET_KEY is not set')
    }
    _stripe = new Stripe(apiKey)
  }
  return _stripe
}

// Create a lazy-loading proxy that only initializes Stripe when methods are called
export const stripe = new Proxy({}, {
  get: (_target, prop) => {
    return Reflect.get(getStripeInstance(), prop)
  },
}) as Stripe
