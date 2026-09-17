import { createCheckout } from "../../../lib/stripe";

export async function POST() {
  return createCheckout();
}
