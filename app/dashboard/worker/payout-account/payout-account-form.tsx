"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, LoaderCircle, Search, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { saveWorkerPayoutAccount } from "./actions";

type Bank = {
  name: string;
  code: string;
};

type ExistingAccount = {
  id: string;
  bank_name: string;
  bank_code: string | null;
  account_name: string;
  account_number: string;
};

export default function PayoutAccountForm({
  account,
}: {
  account?: ExistingAccount;
}) {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [bankCode, setBankCode] = useState(account?.bank_code ?? "");
  const [accountNumber, setAccountNumber] = useState(
    account?.account_number ?? "",
  );
  const [accountName, setAccountName] = useState("");
  const [verifiedFor, setVerifiedFor] = useState("");
  const [loadingBanks, setLoadingBanks] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [bankSearch, setBankSearch] = useState("");
  const [bankDropdownOpen, setBankDropdownOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filteredBanks = useMemo(() => {
    const query = bankSearch.trim().toLowerCase();

    return banks.filter((bank) => bank.name.toLowerCase().includes(query));
  }, [banks, bankSearch]);

  useEffect(() => {
    let active = true;

    async function loadBanks() {
      try {
        const response = await fetch("/api/worker/payout/banks", {
          cache: "no-store",
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error ?? "Unable to load banks.");
        }

        if (active) {
          const uniqueBanks: Bank[] = Array.from(
            new Map<string, Bank>(
              (result.banks as Bank[]).map((bank) => [bank.code, bank]),
            ).values(),
          ).sort((a, b) => a.name.localeCompare(b.name));

          setBanks(uniqueBanks);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Unable to load banks.",
          );
        }
      } finally {
        if (active) setLoadingBanks(false);
      }
    }

    void loadBanks();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setBankDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const selectedBank = useMemo(
    () => banks.find((bank) => bank.code === bankCode),
    [banks, bankCode],
  );

  function invalidateVerification() {
    setAccountName("");
    setVerifiedFor("");
    setSuccess("");
    setError("");
  }

  function selectBank(bank: Bank) {
    if (bank.code !== bankCode) {
      setBankCode(bank.code);
      invalidateVerification();
    }

    setBankSearch(bank.name);
    setBankDropdownOpen(false);
  }

  async function verifyAccount() {
    setError("");
    setSuccess("");

    if (!bankCode) {
      setError("Please select your bank.");
      return;
    }

    if (!/^\d{10}$/.test(accountNumber)) {
      setError("Enter a valid 10-digit account number.");
      return;
    }

    setVerifying(true);

    try {
      const response = await fetch("/api/worker/payout/resolve-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountNumber, bankCode }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Account verification failed.");
      }

      setAccountNumber(result.accountNumber);
      setAccountName(result.accountName);
      setVerifiedFor(`${bankCode}:${result.accountNumber}`);
      setSuccess("Account verified. Check the account name before saving.");
    } catch (err) {
      invalidateVerification();
      setError(
        err instanceof Error ? err.message : "Account verification failed.",
      );
    } finally {
      setVerifying(false);
    }
  }

  const isVerified =
    Boolean(accountName) && verifiedFor === `${bankCode}:${accountNumber}`;

  return (
    <form action={saveWorkerPayoutAccount} className="space-y-4">
      {account && <input type="hidden" name="account_id" value={account.id} />}

      <input type="hidden" name="bank_code" value={bankCode} />
      <input type="hidden" name="bank_name" value={selectedBank?.name ?? ""} />
      <input type="hidden" name="account_name" value={accountName} />
      <input type="hidden" name="account_number" value={accountNumber} />

      <div className="space-y-2" ref={dropdownRef}>
        <label
          htmlFor={`payout-bank-search-${account?.id ?? "new"}`}
          className="text-sm font-medium"
        >
          Bank
        </label>

        <div className="relative">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />

          <input
            ref={searchInputRef}
            id={`payout-bank-search-${account?.id ?? "new"}`}
            type="text"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={bankDropdownOpen}
            aria-controls={`payout-bank-options-${account?.id ?? "new"}`}
            autoComplete="off"
            value={
              bankDropdownOpen ? bankSearch : (selectedBank?.name ?? bankSearch)
            }
            onFocus={() => {
              setBankSearch("");
              setBankDropdownOpen(true);
            }}
            onChange={(event) => {
              setBankSearch(event.target.value);
              setBankDropdownOpen(true);

              if (bankCode) {
                setBankCode("");
                invalidateVerification();
              }
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setBankDropdownOpen(false);
                setBankSearch(selectedBank?.name ?? "");
              }

              if (
                event.key === "Enter" &&
                bankDropdownOpen &&
                filteredBanks.length === 1
              ) {
                event.preventDefault();
                selectBank(filteredBanks[0]);
              }
            }}
            disabled={loadingBanks || verifying}
            placeholder={
              loadingBanks ? "Loading banks..." : "Search Nigerian banks..."
            }
            className="w-full rounded-md border bg-background py-2 pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            required={!bankCode}
          />

          {bankDropdownOpen && !loadingBanks && (
            <div
              id={`payout-bank-options-${account?.id ?? "new"}`}
              role="listbox"
              className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-md border bg-background shadow-lg"
            >
              {filteredBanks.length > 0 ? (
                filteredBanks.map((bank) => (
                  <button
                    key={bank.code}
                    type="button"
                    role="option"
                    aria-selected={bankCode === bank.code}
                    onClick={() => selectBank(bank)}
                    className={`block w-full px-3 py-2.5 text-left text-sm hover:bg-muted ${
                      bankCode === bank.code ? "bg-muted font-medium" : ""
                    }`}
                  >
                    {bank.name}
                    {bankCode === bank.code && (
                      <CheckCircle2 className="float-right mt-0.5 size-4 text-emerald-600" />
                    )}
                  </button>
                ))
              ) : (
                <p className="px-3 py-4 text-sm text-muted-foreground">
                  No banks found. Try another search.
                </p>
              )}
            </div>
          )}
        </div>

        {!loadingBanks && banks.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No banks are available. Please try again later.
          </p>
        )}

        {bankCode && selectedBank && (
          <p className="text-xs text-muted-foreground">
            Selected bank: {selectedBank.name}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label
          htmlFor={`payout-number-${account?.id ?? "new"}`}
          className="text-sm font-medium"
        >
          Account number
        </label>

        <input
          id={`payout-number-${account?.id ?? "new"}`}
          inputMode="numeric"
          autoComplete="off"
          pattern="[0-9]{10}"
          minLength={10}
          maxLength={10}
          value={accountNumber}
          onChange={(event) => {
            setAccountNumber(
              event.target.value.replace(/\D/g, "").slice(0, 10),
            );
            invalidateVerification();
          }}
          disabled={verifying}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          placeholder="Enter 10-digit account number"
          required
        />
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={verifyAccount}
        disabled={
          loadingBanks ||
          verifying ||
          !bankCode ||
          !/^\d{10}$/.test(accountNumber)
        }
      >
        {verifying ? (
          <>
            <LoaderCircle className="mr-2 size-4 animate-spin" />
            Verifying account...
          </>
        ) : (
          "Verify account"
        )}
      </Button>

      {accountName && (
        <div className="rounded-lg border p-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <ShieldCheck className="size-5 text-emerald-600" />
            Verified account name
          </div>

          <p className="mt-2 font-semibold">{accountName}</p>

          <p className="mt-1 text-xs text-muted-foreground">
            Bank: {selectedBank?.name}
          </p>
        </div>
      )}

      {success && (
        <p
          role="status"
          className="flex items-center gap-2 text-sm text-emerald-700"
        >
          <CheckCircle2 className="size-4" />
          {success}
        </p>
      )}

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <Button type="submit" disabled={!isVerified || verifying}>
        {account ? "Save verified bank details" : "Save payout account"}
      </Button>

      <p className="text-xs text-muted-foreground">
        Verify the account name carefully before saving. Saving bank details
        does not initiate a transfer.
      </p>
    </form>
  );
}
