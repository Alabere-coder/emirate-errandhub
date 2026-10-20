"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/require-role";

type PaystackBank = {
  name: string;
  code: string;
  active?: boolean;
};

export async function saveWorkerPayoutAccount(formData: FormData) {
  const { user, supabase } = await requireRole(["worker"]);

  const accountId = String(formData.get("account_id") ?? "").trim();
  const bankCode = String(formData.get("bank_code") ?? "").trim();
  const accountNumber = String(formData.get("account_number") ?? "").trim();

  const fail = (message: string): never => {
    redirect(
      `/dashboard/worker/payout-account?error=${encodeURIComponent(message)}`,
    );
  };

  if (!bankCode || !/^\d{10}$/.test(accountNumber)) {
    fail("Select a bank and enter a valid 10-digit account number.");
  }

  if (
    accountId &&
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      accountId,
    )
  ) {
    fail("Invalid account record.");
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY;

  if (!secretKey) {
    console.error("PAYSTACK_SECRET_KEY is not configured.");
    fail("Bank verification is temporarily unavailable.");
  }

  try {
    // Fetch available Nigerian banks from Paystack.
    const banksResponse = await fetch(
      "https://api.paystack.co/bank?country=nigeria&perPage=100",
      {
        headers: {
          Authorization: `Bearer ${secretKey}`,
        },
        cache: "no-store",
      },
    );

    const banksResult = await banksResponse.json();

    if (
      !banksResponse.ok ||
      !banksResult.status ||
      !Array.isArray(banksResult.data)
    ) {
      fail("Unable to verify the selected bank. Please try again.");
    }

    const banks = banksResult.data as PaystackBank[];

    const selectedBank = banks.find(
      (bank) =>
        bank.code === bankCode &&
        bank.active !== false &&
        typeof bank.name === "string",
    );

    if (selectedBank === undefined) {
      redirect(
        `/dashboard/worker/payout-account?error=${encodeURIComponent(
          "The selected bank is not available. Please select it again.",
        )}`,
      );
    }

    // The direct redirect above ensures selectedBank is defined here.
    const verifiedBank = selectedBank;

    // Resolve the account with Paystack.
    const resolveUrl = new URL("https://api.paystack.co/bank/resolve");

    resolveUrl.searchParams.set("account_number", accountNumber);
    resolveUrl.searchParams.set("bank_code", verifiedBank.code);

    const resolveResponse = await fetch(resolveUrl, {
      headers: {
        Authorization: `Bearer ${secretKey}`,
      },
      cache: "no-store",
    });

    const resolveResult = await resolveResponse.json();

    const verifiedAccountName = resolveResult.data?.account_name;
    const verifiedAccountNumber = resolveResult.data?.account_number;

    if (
      !resolveResponse.ok ||
      !resolveResult.status ||
      typeof verifiedAccountName !== "string" ||
      !verifiedAccountName.trim() ||
      String(verifiedAccountNumber) !== accountNumber
    ) {
      fail("Account verification failed. Check the bank and account number.");
    }

    // Save only the bank and account details verified by Paystack.
    const { error } = await supabase.rpc("save_worker_payout_account", {
      p_bank_name: verifiedBank.name,
      p_bank_code: verifiedBank.code,
      p_account_name: verifiedAccountName.trim(),
      p_account_number: accountNumber,
      ...(accountId ? { p_account_id: accountId } : {}),
    });

    if (error) {
      console.error("Failed to save worker payout account:", error.message);

      fail("Unable to save the verified bank account.");
    }
  } catch (error) {
    // Next.js redirect() throws internally. Allow it to propagate.
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      typeof error.digest === "string" &&
      error.digest.startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }

    console.error("Payout account verification failed:", error);

    fail("Bank verification is temporarily unavailable. Please try again.");
  }

  revalidatePath("/dashboard/worker/payout-account");
  revalidatePath("/dashboard/worker/earnings");

  redirect("/dashboard/worker/payout-account?saved=1");
}
