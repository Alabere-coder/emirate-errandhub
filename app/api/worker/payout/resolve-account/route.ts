import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: worker } = await supabase
    .from("worker_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!worker) {
    return NextResponse.json(
      { error: "Worker profile not found" },
      { status: 403 },
    );
  }

  let body: { accountNumber?: unknown; bankCode?: unknown };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const accountNumber =
    typeof body.accountNumber === "string" ? body.accountNumber.trim() : "";
  const bankCode =
    typeof body.bankCode === "string" ? body.bankCode.trim() : "";

  if (
    !/^\d{10}$/.test(accountNumber) ||
    !/^[a-zA-Z0-9_-]{1,20}$/.test(bankCode)
  ) {
    return NextResponse.json(
      { error: "Select a bank and enter a valid 10-digit account number" },
      { status: 400 },
    );
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY;

  if (!secretKey) {
    console.error("PAYSTACK_SECRET_KEY is not configured.");
    return NextResponse.json(
      { error: "Bank verification is temporarily unavailable" },
      { status: 503 },
    );
  }

  try {
    const url = new URL("https://api.paystack.co/bank/resolve");
    url.searchParams.set("account_number", accountNumber);
    url.searchParams.set("bank_code", bankCode);

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${secretKey}` },
      cache: "no-store",
    });

    const result = await response.json();

    if (!response.ok || !result.status || !result.data?.account_name) {
      return NextResponse.json(
        { error: "Account could not be verified. Check the bank and number." },
        { status: 422 },
      );
    }

    return NextResponse.json({
      accountNumber: result.data.account_number,
      accountName: result.data.account_name,
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to verify the account right now" },
      { status: 502 },
    );
  }
}
