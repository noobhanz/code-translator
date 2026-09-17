import Stripe from "stripe";

const stripe = new Stripe("sk_test_fixture");

export async function createCheckout() {
  return stripe.checkout.sessions.create({ mode: "payment", line_items: [] });
}

export async function handleStripeWebhook() {
  return { received: true };
}
