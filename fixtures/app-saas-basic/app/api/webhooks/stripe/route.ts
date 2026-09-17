import { handleStripeWebhook } from "../../../../lib/stripe";

export async function POST() {
  return handleStripeWebhook();
}
