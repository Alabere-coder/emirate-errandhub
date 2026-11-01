const PAYSTACK_API_URL = "https://api.paystack.co";

function getPaystackSecretKey(): string {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;

  if (!secretKey) {
    throw new Error("PAYSTACK_SECRET_KEY is not configured.");
  }

  if (!secretKey.startsWith("sk_test_")) {
    throw new Error("The configured Paystack key is not a test secret key.");
  }

  return secretKey;
}

import { createHmac, timingSafeEqual } from "node:crypto";

export function verifyPaystackWebhookSignature(
  rawBody: string,
  signature: string | null,
): boolean {
  if (!signature || !/^[a-fA-F0-9]{128}$/.test(signature)) {
    return false;
  }

  const expectedSignature = createHmac("sha512", getPaystackSecretKey())
    .update(rawBody)
    .digest("hex");

  const received = Buffer.from(signature, "hex");
  const expected = Buffer.from(expectedSignature, "hex");

  return timingSafeEqual(received, expected);
}

async function paystackRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${PAYSTACK_API_URL}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${getPaystackSecretKey()}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...options.headers,
    },
    cache: "no-store",
  });

  const responseText = await response.text();

  let result: unknown;

  try {
    result = JSON.parse(responseText);
  } catch {
    console.error("Paystack returned a non-JSON response:", {
      endpoint,
      status: response.status,
    });

    throw new Error(
      "Paystack returned an invalid response. Please try again later.",
    );
  }

  if (
    typeof result !== "object" ||
    result === null ||
    !("status" in result) ||
    typeof result.status !== "boolean"
  ) {
    throw new Error("Paystack returned an unexpected response format.");
  }

  if (!response.ok || !result.status) {
    const message =
      "message" in result && typeof result.message === "string"
        ? result.message
        : "Paystack request failed.";

    console.error("Paystack API request failed:", {
      endpoint,
      status: response.status,
      message,
    });

    throw new Error("Paystack request failed. Please try again later.");
  }

  if (!("data" in result) || result.data == null) {
    throw new Error("Paystack returned an empty response.");
  }

  return result.data as T;
}

export type PaystackInitialization = {
  authorization_url: string;
  access_code: string;
  reference: string;
};

function isPaystackInitialization(
  value: unknown,
): value is PaystackInitialization {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const initialization = value as Record<string, unknown>;

  return (
    typeof initialization.authorization_url === "string" &&
    (() => {
      try {
        return (
          new URL(initialization.authorization_url).protocol === "https:" &&
          new URL(initialization.authorization_url).hostname ===
            "checkout.paystack.com"
        );
      } catch {
        return false;
      }
    })() &&
    typeof initialization.access_code === "string" &&
    initialization.access_code.length > 0 &&
    typeof initialization.reference === "string" &&
    initialization.reference.length > 0
  );
}

async function paystackInitializationRequest(
  endpoint: string,
  options: RequestInit = {},
): Promise<PaystackInitialization> {
  const data = await paystackRequest<unknown>(endpoint, options);

  if (!isPaystackInitialization(data)) {
    console.error("Paystack returned an invalid initialization response:", {
      endpoint,
    });

    throw new Error(
      "Paystack returned an invalid payment initialization response. Please try again.",
    );
  }

  return data;
}

export async function initializePaystackTransaction(input: {
  email: string;
  amountInKobo: number;
  currency: string;
  reference: string;
  callbackUrl: string;
}): Promise<PaystackInitialization> {
  if (!input.email || !input.email.includes("@")) {
    throw new Error("A valid customer email is required.");
  }

  if (!Number.isSafeInteger(input.amountInKobo) || input.amountInKobo <= 0) {
    throw new Error("Payment amount must be a positive integer in kobo.");
  }

  if (!input.reference || input.reference.length > 100) {
    throw new Error("A valid payment reference is required.");
  }

  let callbackUrl: URL;

  try {
    callbackUrl = new URL(input.callbackUrl);
  } catch {
    throw new Error("A valid payment callback URL is required.");
  }

  if (
    callbackUrl.protocol !== "https:" &&
    callbackUrl.hostname !== "localhost"
  ) {
    throw new Error("The payment callback URL must use HTTPS.");
  }

  return paystackInitializationRequest("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email: input.email,
      amount: input.amountInKobo,
      currency: input.currency,
      reference: input.reference,
      callback_url: input.callbackUrl,
    }),
  });
}

export type PaystackVerification = {
  id: number;
  status: string;
  reference: string;
  amount: number;
  currency: string;
  paid_at: string | null;
  channel: string;
  gateway_response: string;
};

function isPaystackVerification(value: unknown): value is PaystackVerification {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const transaction = value as Record<string, unknown>;

  return (
    typeof transaction.id === "number" &&
    Number.isSafeInteger(transaction.id) &&
    transaction.id > 0 &&
    typeof transaction.status === "string" &&
    typeof transaction.reference === "string" &&
    transaction.reference.length > 0 &&
    typeof transaction.amount === "number" &&
    Number.isSafeInteger(transaction.amount) &&
    transaction.amount > 0 &&
    typeof transaction.currency === "string" &&
    (transaction.paid_at === null || typeof transaction.paid_at === "string") &&
    typeof transaction.channel === "string" &&
    typeof transaction.gateway_response === "string"
  );
}

async function paystackVerificationRequest(
  endpoint: string,
  options: RequestInit = {},
): Promise<PaystackVerification> {
  const data = await paystackRequest<unknown>(endpoint, options);

  if (!isPaystackVerification(data)) {
    console.error("Paystack returned an invalid transaction response:", {
      endpoint,
    });

    throw new Error(
      "Paystack returned an invalid transaction response. Please try again later.",
    );
  }

  return data;
}

export async function verifyPaystackTransaction(
  reference: string,
): Promise<PaystackVerification> {
  if (!reference || reference.length > 100) {
    throw new Error("A valid payment reference is required.");
  }

  const transaction = await paystackVerificationRequest(
    `/transaction/verify/${encodeURIComponent(reference)}`,
    { method: "GET" },
  );

  if (transaction.reference !== reference) {
    console.error("Paystack transaction reference mismatch.");

    throw new Error(
      "Payment verification returned an unexpected transaction reference.",
    );
  }

  return transaction;
}

export type PaystackRefund = {
  id: number;
  integration: number;
  domain: string;
  transaction:
    | number
    | {
        id: number;
        reference?: string;
      };
  amount: number;
  currency: string;
  deducted_amount: number;
  status: string;
  refunded_at: string | null;
  expected_at: string | null;
  customer_note: string | null;
  merchant_note: string | null;
};

function isPaystackRefund(value: unknown): value is PaystackRefund {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const refund = value as Record<string, unknown>;

  const validTransaction =
    typeof refund.transaction === "number"
      ? Number.isSafeInteger(refund.transaction) && refund.transaction > 0
      : typeof refund.transaction === "object" &&
        refund.transaction !== null &&
        "id" in refund.transaction &&
        typeof refund.transaction.id === "number" &&
        Number.isSafeInteger(refund.transaction.id) &&
        refund.transaction.id > 0 &&
        (!("reference" in refund.transaction) ||
          (typeof refund.transaction.reference === "string" &&
            refund.transaction.reference.length > 0));

  const isNullableString = (item: unknown) =>
    item === null || typeof item === "string";

  return (
    Number.isSafeInteger(refund.id) &&
    Number.isSafeInteger(refund.integration) &&
    typeof refund.domain === "string" &&
    validTransaction &&
    Number.isSafeInteger(refund.amount) &&
    typeof refund.currency === "string" &&
    Number.isSafeInteger(refund.deducted_amount) &&
    typeof refund.status === "string" &&
    isNullableString(refund.refunded_at) &&
    isNullableString(refund.expected_at) &&
    isNullableString(refund.customer_note) &&
    isNullableString(refund.merchant_note)
  );
}

async function paystackRefundRequest(
  endpoint: string,
  options: RequestInit = {},
): Promise<PaystackRefund> {
  const data = await paystackRequest<unknown>(endpoint, options);

  if (!isPaystackRefund(data)) {
    console.error("Paystack returned an invalid refund response:", {
      endpoint,
    });

    throw new Error(
      "Paystack returned an invalid refund response. Manual investigation may be required.",
    );
  }

  return data;
}

export async function initiatePaystackRefund(input: {
  transactionReference: string;
  amountInKobo: number;
  customerNote?: string;
  merchantNote?: string;
}): Promise<PaystackRefund> {
  if (!input.transactionReference || input.transactionReference.length > 100) {
    throw new Error("A valid original transaction reference is required.");
  }

  if (!Number.isSafeInteger(input.amountInKobo) || input.amountInKobo <= 0) {
    throw new Error("Refund amount must be a positive integer in kobo.");
  }

  return paystackRefundRequest("/refund", {
    method: "POST",
    body: JSON.stringify({
      transaction: input.transactionReference,
      amount: input.amountInKobo,
      customer_note: input.customerNote,
      merchant_note: input.merchantNote,
    }),
  });
}

export async function fetchPaystackRefund(
  refundId: string | number,
): Promise<PaystackRefund> {
  const id = Number(refundId);

  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error("A valid Paystack refund ID is required.");
  }

  return paystackRefundRequest(`/refund/${id}`, { method: "GET" });
}
