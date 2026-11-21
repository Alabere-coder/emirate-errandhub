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

  const fieldClassName =
    "w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground shadow-sm outline-none transition placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-emerald-500/30 focus-visible:border-emerald-600 disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <form action={saveWorkerPayoutAccount} className="space-y-5">
      {account && <input type="hidden" name="account_id" value={account.id} />}

      <input type="hidden" name="bank_code" value={bankCode} />
      <input type="hidden" name="bank_name" value={selectedBank?.name ?? ""} />
      <input type="hidden" name="account_name" value={accountName} />
      <input type="hidden" name="account_number" value={accountNumber} />

      {/* Bank selection */}
      <div className="space-y-2" ref={dropdownRef}>
        <label
          htmlFor={`payout-bank-search-${account?.id ?? "new"}`}
          className="text-sm font-medium text-foreground"
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
            className={`${fieldClassName} pl-9`}
            required={!bankCode}
          />

          {bankDropdownOpen && !loadingBanks && (
            <div
              id={`payout-bank-options-${account?.id ?? "new"}`}
              role="listbox"
              className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-xl"
            >
              {filteredBanks.length > 0 ? (
                filteredBanks.map((bank) => (
                  <button
                    key={bank.code}
                    type="button"
                    role="option"
                    aria-selected={bankCode === bank.code}
                    onClick={() => selectBank(bank)}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition hover:bg-muted ${
                      bankCode === bank.code
                        ? "bg-emerald-50 font-medium text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                        : "text-foreground"
                    }`}
                  >
                    {bank.name}

                    {bankCode === bank.code && (
                      <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    )}
                  </button>
                ))
              ) : (
                <p className="px-3 py-4 text-center text-sm text-muted-foreground">
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
            Selected bank:{" "}
            <span className="font-medium text-foreground">
              {selectedBank.name}
            </span>
          </p>
        )}
      </div>

      {/* Account number */}
      <div className="space-y-2">
        <label
          htmlFor={`payout-number-${account?.id ?? "new"}`}
          className="text-sm font-medium text-foreground"
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
          className={fieldClassName}
          placeholder="Enter 10-digit account number"
          required
        />

        <p className="text-xs text-muted-foreground">
          Enter the 10-digit account number linked to your bank account.
        </p>
      </div>

      {/* Verification action */}
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
        className="w-full border-border bg-background hover:bg-muted sm:w-auto"
      >
        {verifying ? (
          <>
            <LoaderCircle className="mr-2 size-4 animate-spin" />
            Verifying account...
          </>
        ) : (
          <>
            <ShieldCheck className="mr-2 size-4" />
            Verify account
          </>
        )}
      </Button>

      {/* Verified account details */}
      {accountName && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-900/70 dark:bg-emerald-950/25">
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800 dark:text-emerald-300">
            <ShieldCheck className="size-5 shrink-0" />
            Verified account name
          </div>

          <p className="mt-3 text-base font-semibold text-foreground">
            {accountName}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Bank: {selectedBank?.name}
          </p>

          <div className="mt-3 flex items-center gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="size-4" />
            Account details successfully verified
          </div>
        </div>
      )}

      {/* Feedback */}
      {success && (
        <div
          role="status"
          className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-800 dark:border-emerald-900/70 dark:bg-emerald-950/30 dark:text-emerald-300"
        >
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      {/* Save */}
      <div className="space-y-3 border-t border-border pt-5">
        <Button
          type="submit"
          disabled={!isVerified || verifying}
          className="w-full bg-emerald-700 text-white hover:bg-emerald-800 disabled:opacity-50 sm:w-auto"
        >
          {verifying ? (
            <>
              <LoaderCircle className="mr-2 size-4 animate-spin" />
              Please wait...
            </>
          ) : (
            <>
              <CheckCircle2 className="mr-2 size-4" />
              {account ? "Save verified bank details" : "Save payout account"}
            </>
          )}
        </Button>

        <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-4 shrink-0" />
          Verify the account name carefully before saving. Saving bank details
          does not initiate a transfer.
        </p>
      </div>
    </form>
  );
}
