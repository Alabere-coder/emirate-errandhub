import { requireRole } from "@/lib/auth/require-role";

import { Card, CardContent } from "@/components/ui/card";

import { sendWorkerPhoneOtp, verifyWorkerPhoneOtp } from "./actions";

type PageProps = {
  searchParams: Promise<{
    status?: string;
  }>;
};

export default async function WorkerPhoneVerificationPage({
  searchParams,
}: PageProps) {
  const { user } = await requireRole(["worker"]);
  const { status } = await searchParams;

  const isVerified = Boolean(user.phone_confirmed_at);

  const isOtpSimulationEnabled =
    process.env.NODE_ENV !== "production" &&
    process.env.ERRANDHUB_PHONE_OTP_SIMULATION === "true";

  const showOtpForm = [
    "otp-sent",
    "invalid-code",
    "verification-failed",
    "dev-otp-sent",
    "dev-test-failed",
    "dev-test-passed",
  ].includes(status ?? "");

  //   const showOtpForm = [
  //     "otp-sent",
  //     "invalid-code",
  //     "verification-failed",
  //   ].includes(status ?? "");

  const messages: Record<string, string> = {
    // "invalid-phone": "Enter a valid Nigerian mobile number.",
    // "send-failed":
    //   "We could not send your verification code. Check the SMS configuration and try again.",
    // "otp-sent":
    //   "A verification code has been requested. Enter the same phone number and the code sent to it.",
    // "invalid-code": "Enter the six-digit verification code.",
    // "verification-failed":
    //   "The code could not be verified. Check the number and code, then try again.",
    // verified: "Phone verification completed successfully.",
    "dev-otp-sent":
      "Development simulation is active. No SMS was sent. Use the test code displayed below.",

    "dev-test-failed":
      "The test code was incorrect. Try the development test code.",

    "dev-test-passed":
      "Development test passed. This only tests the form flow; your phone is NOT verified in Supabase.",
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Verify your phone number
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Verify your Nigerian mobile number to complete your service-provider
          verification.
        </p>
      </div>

      {status && messages[status] && (
        <div role="status" className="rounded-lg border p-4 text-sm">
          {messages[status]}
        </div>
      )}

      <Card>
        <CardContent className="space-y-5 p-6">
          {isOtpSimulationEnabled && !isVerified && (
            <div
              role="note"
              className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm"
            >
              <p className="font-medium">Development testing only</p>
              <p className="mt-1">
                SMS delivery is disabled for this test. Use code{" "}
                <code className="font-semibold">123456</code>. Passing this test
                does not verify your phone number.
              </p>
            </div>
          )}
          {isVerified ? (
            <div className="space-y-2">
              <h2 className="text-lg font-medium">Phone verified</h2>
              <p className="text-sm text-muted-foreground">
                Your account has a confirmed phone number in Supabase Auth.
              </p>
              {user.phone && (
                <p className="text-sm font-medium">{user.phone}</p>
              )}
            </div>
          ) : (
            <>
              {!showOtpForm && (
                <form action={sendWorkerPhoneOtp} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="phone" className="text-sm font-medium">
                      Nigerian mobile number
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      placeholder="08012345678 or +2348012345678"
                      required
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      Make sure you can receive SMS messages on this number.
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                  >
                    Send verification code
                  </button>
                </form>
              )}

              {showOtpForm && (
                <form action={verifyWorkerPhoneOtp} className="space-y-4">
                  <div className="space-y-2">
                    <label
                      htmlFor="verify-phone"
                      className="text-sm font-medium"
                    >
                      Phone number used above
                    </label>
                    <input
                      id="verify-phone"
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      placeholder="+2348012345678"
                      required
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter the same number you used when requesting the code.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="token" className="text-sm font-medium">
                      Six-digit verification code
                    </label>
                    <input
                      id="token"
                      name="token"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      pattern="[0-9]{6}"
                      minLength={6}
                      maxLength={6}
                      placeholder="123456"
                      required
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                  >
                    Verify phone number
                  </button>
                </form>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
