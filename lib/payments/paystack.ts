const PAYSTACK_API_URL = "https://api.paystack.co";

function getPaystackSecretKey(): string {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;

  if (!secretKey) {
    throw new Error("PAYSTACK_SECRET_KEY is not configured.");
  }

  return secretKey;
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
      ...options.headers,
    },
    cache: "no-store",
  });

  const result = (await response.json()) as {
    status: boolean;
    message: string;
    data: T;
  };

  if (!response.ok || !result.status) {
    throw new Error(result.message || "Paystack request failed.");
  }

  return result.data;
}

export type PaystackInitialization = {
  authorization_url: string;
  access_code: string;
  reference: string;
};

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

export async function initializePaystackTransaction(input: {
  email: string;
  amountInKobo: number;
  currency: string;
  reference: string;
  callbackUrl: string;
}): Promise<PaystackInitialization> {
  if (!Number.isSafeInteger(input.amountInKobo) || input.amountInKobo <= 0) {
    throw new Error("Payment amount must be a positive integer in kobo.");
  }

  return paystackRequest<PaystackInitialization>("/transaction/initialize", {
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

export async function verifyPaystackTransaction(
  reference: string,
): Promise<PaystackVerification> {
  if (!reference || reference.length > 100) {
    throw new Error("A valid payment reference is required.");
  }

  return paystackRequest<PaystackVerification>(
    `/transaction/verify/${encodeURIComponent(reference)}`,
    { method: "GET" },
  );
}
