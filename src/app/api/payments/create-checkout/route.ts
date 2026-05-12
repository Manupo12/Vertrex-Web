import { NextRequest, NextResponse } from "next/server";
import { getPortalSession } from "@/lib/auth/portal";

export async function POST(request: NextRequest) {
  try {
    const portalSession = await getPortalSession();
    if (!portalSession) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ url: "https://buy.stripe.com/test_sample" });
    }

    const body = await request.json();
    const { priceId, successUrl, cancelUrl } = body;

    const stripe = await import("stripe");
    const stripeClient = new stripe.Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-03-31.basil" as any,
    });

    const checkoutSession = await stripeClient.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: portalSession.clientId,
      success_url: successUrl || `${process.env.PUBLIC_APP_URL || "http://localhost:3000"}/portal/${portalSession.slug}/pago/exito`,
      cancel_url: cancelUrl || `${process.env.PUBLIC_APP_URL || "http://localhost:3000"}/portal/${portalSession.slug}/pago/cancelado`,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
