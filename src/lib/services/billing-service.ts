// ============================================
// Billing Service — Stripe integration for subscription management
// Plans: Free ($0), Starter ($29/mo, 7-day trial), Pro ($79/mo)
// ============================================

import Stripe from "stripe";
import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

let _stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
    _stripe = new Stripe(key);
  }
  return _stripe;
}

function getWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
  return secret;
}

export interface PlanConfig {
  code: string;
  name: string;
  priceMonthly: number;
  stripePriceId: string | null;
  trialDays: number;
  limits: {
    scansPerMonth: number;
    keywordsPerScan: number;
    painPointsPerScan: number;
    ideasPerPainPoint: number;
    exports: boolean;
  };
}

export const PLANS: Record<string, PlanConfig> = {
  free: {
    code: "free",
    name: "Free",
    priceMonthly: 0,
    stripePriceId: null,
    trialDays: 0,
    limits: {
      scansPerMonth: 1,
      keywordsPerScan: 3,
      painPointsPerScan: 10,
      ideasPerPainPoint: 0,
      exports: false,
    },
  },
  starter: {
    code: "starter",
    name: "Starter",
    priceMonthly: 29,
    stripePriceId: process.env.STRIPE_STARTER_PRICE_ID || null,
    trialDays: 7,
    limits: {
      scansPerMonth: 5,
      keywordsPerScan: 10,
      painPointsPerScan: 50,
      ideasPerPainPoint: 3,
      exports: true,
    },
  },
  pro: {
    code: "pro",
    name: "Pro",
    priceMonthly: 79,
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID || null,
    trialDays: 0,
    limits: {
      scansPerMonth: 20,
      keywordsPerScan: 25,
      painPointsPerScan: 200,
      ideasPerPainPoint: 5,
      exports: true,
    },
  },
};

/** Grace period (in days) after payment failure before revoking access. */
const PAST_DUE_GRACE_DAYS = 7;

/**
 * Get a user's current plan config with limits.
 * Enforces subscription validity: canceled, past_due (after grace), expired trials,
 * and expired billing periods all revert to the free plan.
 */
export async function getUserPlan(userId: string): Promise<PlanConfig & { subscription: typeof subscriptions.$inferSelect | null }> {
  const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId));
  const FREE = { ...PLANS.free, subscription: sub || null };

  if (!sub) return FREE;

  // Canceled subscriptions always revert to free
  if (sub.status === "canceled") return FREE;

  const now = new Date();

  // Past-due: allow a grace period, then revert to free
  if (sub.status === "past_due") {
    const graceDeadline = new Date(sub.updatedAt.getTime() + PAST_DUE_GRACE_DAYS * 24 * 60 * 60 * 1000);
    if (now > graceDeadline) return FREE;
  }

  // Trial expired: if status is still "trialing" but trial end has passed, revert to free
  if (sub.status === "trialing" && sub.trialEndsAt && now > sub.trialEndsAt) {
    // Auto-downgrade in DB so we don't check this every request forever
    await db.update(subscriptions).set({
      status: "canceled",
      planCode: "free",
      updatedAt: now,
    }).where(eq(subscriptions.id, sub.id));
    return FREE;
  }

  // Billing period expired: if currentPeriodEnd has passed and status isn't free, revert
  if (sub.planCode !== "free" && sub.currentPeriodEnd && now > sub.currentPeriodEnd) {
    // Give a 3-day buffer for Stripe webhook delays before hard-revoking
    const periodBuffer = new Date(sub.currentPeriodEnd.getTime() + 3 * 24 * 60 * 60 * 1000);
    if (now > periodBuffer) {
      await db.update(subscriptions).set({
        status: "canceled",
        planCode: "free",
        stripeSubscriptionId: null,
        updatedAt: now,
      }).where(eq(subscriptions.id, sub.id));
      return FREE;
    }
  }

  const plan = PLANS[sub.planCode] || PLANS.free;
  return { ...plan, subscription: sub };
}

/**
 * Create a Stripe Checkout session for upgrading to a paid plan.
 */
export async function createCheckoutSession(input: {
  userId: string;
  email: string;
  planCode: "starter" | "pro";
  successUrl: string;
  cancelUrl: string;
}): Promise<{ url: string } | { error: string }> {
  const plan = PLANS[input.planCode];
  if (!plan || !plan.stripePriceId) {
    return { error: `Plan '${input.planCode}' is not available for checkout` };
  }

  // Get or create Stripe customer
  const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.userId, input.userId));
  let customerId = sub?.stripeCustomerId;

  if (!customerId) {
    const customer = await getStripe().customers.create({
      email: input.email,
      metadata: { userId: input.userId },
    });
    customerId = customer.id;

    if (sub) {
      await db.update(subscriptions).set({ stripeCustomerId: customerId, updatedAt: new Date() }).where(eq(subscriptions.userId, input.userId));
    }
  }

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: plan.stripePriceId, quantity: 1 }],
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    metadata: { userId: input.userId, planCode: input.planCode },
  };

  // Add trial for Starter plan
  if (plan.trialDays > 0) {
    sessionParams.subscription_data = {
      trial_period_days: plan.trialDays,
    };
  }

  const session = await getStripe().checkout.sessions.create(sessionParams);

  if (!session.url) {
    return { error: "Failed to create checkout session" };
  }

  return { url: session.url };
}

/**
 * Get subscription details for a user.
 */
export async function getSubscription(userId: string) {
  const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId));
  if (!sub) return null;

  const plan = PLANS[sub.planCode] || PLANS.free;
  return {
    id: sub.id,
    planCode: sub.planCode,
    planName: plan.name,
    status: sub.status,
    priceMonthly: plan.priceMonthly,
    limits: plan.limits,
    trialEndsAt: sub.trialEndsAt,
    currentPeriodEnd: sub.currentPeriodEnd,
    createdAt: sub.createdAt,
  };
}

/**
 * Cancel a subscription. Cancels at period end (not immediately).
 */
export async function cancelSubscription(userId: string): Promise<{ success: boolean; error?: string }> {
  const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId));
  if (!sub) return { success: false, error: "No subscription found" };
  if (sub.planCode === "free") return { success: false, error: "Cannot cancel free plan" };

  if (sub.stripeSubscriptionId) {
    await getStripe().subscriptions.update(sub.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });
  }

  await db.update(subscriptions).set({
    status: "canceled",
    updatedAt: new Date(),
  }).where(eq(subscriptions.userId, userId));

  return { success: true };
}

/**
 * Extract subscription ID from a Stripe Invoice's parent field (Stripe v20 / clover API).
 */
function getSubscriptionIdFromInvoice(invoice: Stripe.Invoice): string | null {
  const subDetails = invoice.parent?.subscription_details;
  if (!subDetails) return null;
  return typeof subDetails.subscription === "string"
    ? subDetails.subscription
    : subDetails.subscription?.id ?? null;
}

/**
 * Handle Stripe webhook events (idempotent).
 */
export async function handleWebhookEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      const planCode = session.metadata?.planCode;
      if (!userId || !planCode) break;

      const stripeSubscriptionId = typeof session.subscription === "string"
        ? session.subscription
        : session.subscription?.id;

      await db.update(subscriptions).set({
        planCode,
        status: PLANS[planCode]?.trialDays > 0 ? "trialing" : "active",
        stripeCustomerId: typeof session.customer === "string" ? session.customer : session.customer?.id,
        stripeSubscriptionId: stripeSubscriptionId || null,
        trialEndsAt: PLANS[planCode]?.trialDays > 0
          ? new Date(Date.now() + PLANS[planCode].trialDays * 24 * 60 * 60 * 1000)
          : null,
        updatedAt: new Date(),
      }).where(eq(subscriptions.userId, userId));
      break;
    }

    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      const stripeSubId = getSubscriptionIdFromInvoice(invoice);
      if (!stripeSubId) break;

      const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.stripeSubscriptionId, stripeSubId));
      if (!sub) break;

      // Use the invoice's period_end as the billing period end
      await db.update(subscriptions).set({
        status: "active",
        currentPeriodEnd: new Date(invoice.period_end * 1000),
        updatedAt: new Date(),
      }).where(eq(subscriptions.id, sub.id));
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const stripeSubId = getSubscriptionIdFromInvoice(invoice);
      if (!stripeSubId) break;

      await db.update(subscriptions).set({
        status: "past_due",
        updatedAt: new Date(),
      }).where(eq(subscriptions.stripeSubscriptionId, stripeSubId));
      break;
    }

    case "customer.subscription.deleted": {
      const stripeSub = event.data.object as Stripe.Subscription;

      await db.update(subscriptions).set({
        status: "canceled",
        planCode: "free",
        stripeSubscriptionId: null,
        updatedAt: new Date(),
      }).where(eq(subscriptions.stripeSubscriptionId, stripeSub.id));
      break;
    }
  }
}

/**
 * Verify Stripe webhook signature.
 */
export function constructEvent(payload: string | Buffer, signature: string): Stripe.Event {
  return getStripe().webhooks.constructEvent(payload, signature, getWebhookSecret());
}
