import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

type PaystackBank = {
  name?: string;
  code?: string;
  active?: boolean;
};

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: worker, error: workerError } = await supabase
    .from("worker_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (workerError) {
    console.error("Failed to retrieve worker profile:", workerError.message);

    return NextResponse.json(
      { error: "Unable to verify worker profile" },
      { status: 500 },
    );
  }

  if (!worker) {
    return NextResponse.json(
      { error: "Worker profile not found" },
      { status: 403 },
    );
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY;

  if (!secretKey) {
    console.error("PAYSTACK_SECRET_KEY is not configured.");

    return NextResponse.json(
      { error: "Bank service is temporarily unavailable" },
      { status: 503 },
    );
  }

  try {
    const response = await fetch(
      "https://api.paystack.co/bank?country=nigeria&perPage=100",
      {
        headers: {
          Authorization: `Bearer ${secretKey}`,
        },
        cache: "no-store",
      },
    );

    const result = await response.json();

    if (!response.ok || !result.status || !Array.isArray(result.data)) {
      return NextResponse.json(
        { error: "Unable to retrieve banks from Paystack" },
        { status: 502 },
      );
    }

    const paystackBanks = result.data as PaystackBank[];

    // Keep only active banks with valid names and codes.
    const filteredBanks = paystackBanks
      .filter(
        (bank) =>
          typeof bank.name === "string" &&
          bank.name.trim().length > 0 &&
          typeof bank.code === "string" &&
          bank.code.trim().length > 0 &&
          bank.active !== false,
      )
      .map((bank) => ({
        name: bank.name!.trim(),
        code: bank.code!.trim(),
      }));

    // Keep one entry per bank code to prevent duplicate React keys.
    const uniqueBanks = Array.from(
      new Map(filteredBanks.map((bank) => [bank.code, bank])).values(),
    );

    // Sort the final list alphabetically.
    const banks = uniqueBanks.sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json(
      { banks },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("Failed to retrieve Paystack banks:", error);

    return NextResponse.json(
      { error: "Unable to connect to the bank service" },
      { status: 502 },
    );
  }
}
