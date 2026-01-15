import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import Stripe from 'stripe';
import { STRIPE_SECRET_KEY } from '$env/static/private';

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia'
});

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { amount, currency = 'eur' } = await request.json();
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // Amount in cents
      currency: currency,
    });
    
    return json({ 
      clientSecret: paymentIntent.client_secret 
    });
  } catch (error: any) {
    return json({ error: error.message }, { status: 500 });
  }
};