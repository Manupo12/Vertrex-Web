import { NextRequest, NextResponse } from "next/server";
import { getPortalSession } from "@/lib/auth/portal";

export async function POST(request: NextRequest) {
  try {
    const session = await getPortalSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    void session; // used when Stripe is integrated

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ url: "https://buy.stripe.com/test_sample" });
    }

    // Stripe integration placeholder for V3.0
    // Install: npm install stripe
    // Then implement the checkout session creation here

    return NextResponse.json({ url: "https://buy.stripe.com/test_sample" });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
