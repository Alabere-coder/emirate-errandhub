import { createHmac, timingSafeEqual } from "node:crypto";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

const secret = process.env.PAYSTACK_SECRET_KEY;

if (!secret || !secret.startsWith("sk_test_")) {
  throw new Error("A valid Paystack test secret key is required.");
}

function verifySignature(rawBody, signature) {
  if (!signature || !/^[a-fA-F0-9]{128}$/.test(signature)) {
    return false;
  }

  const expected = createHmac("sha512", secret)
    .update(rawBody)
    .digest();

  const received = Buffer.from(signature, "hex");

  return timingSafeEqual(received, expected);
}

const payload = JSON.stringify({
  event: "charge.success",
  data: {
    reference: "EH-webhook-test",
  },
});

const validSignature = createHmac("sha512", secret)
  .update(payload)
  .digest("hex");

console.log("Valid signature:", verifySignature(payload, validSignature));
console.log("Invalid signature:", verifySignature(payload, "invalid"));
console.log("Missing signature:", verifySignature(payload, null));
console.log(
  "Modified payload:",
  verifySignature(payload + " ", validSignature),
);