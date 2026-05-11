import { NextRequest, NextResponse } from "next/server";
import { getPortalSession } from "@/lib/auth/portal";

async function createStripeCheckout(priceId: string, clientId: string, slug: string) {
  // @ts-expect-error - stripe is optional, guarded by STRIPE_SECRET_KEY check
  const { default: Stripe } = await import("stripe");
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  return stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.PUBLIC_APP_URL || ""}/portal/${slug}/account?payment=success`,
    cancel_url: `${process.env.PUBLIC_APP_URL || ""}/portal/${slug}/account?payment=cancelled`,
    metadata: { clientId },
  });
}

export async function POST(request: NextRequest) {
  try {
    const session = await getPortalSession();
    if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const body = await request.json();
    const { priceId } = body;

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ url: "https://buy.stripe.com/test_sample" });
    }

    const checkout = await createStripeCheckout(priceId, session.clientId, session.slug || session.clientId);

    return NextResponse.json({ url: checkout.url });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
