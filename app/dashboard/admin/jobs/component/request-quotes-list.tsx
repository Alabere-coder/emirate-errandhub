import { Clock3, FileText, MessageSquareText } from "lucide-react";

export type RequestQuote = {
  id: string;
  request_id: string;
  worker_id: string;
  amount: number;
  currency: string;
  message: string | null;
  status: string;
  created_at: string;
  workerName: string;
};

type RequestQuotesListProps = {
  requestId: string;
  quotes: RequestQuote[];
};

function getStatusStyles(status: string) {
  switch (status.toLowerCase()) {
    case "accepted":
      return "bg-emerald-500/10 text-emerald-700";

    case "rejected":
      return "bg-red-500/10 text-red-700";

    case "pending":
      return "bg-amber-500/10 text-amber-700";

    default:
      return "bg-muted text-muted-foreground";
  }
}

function formatAmount(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString("en-NG")}`;
  }
}

export default function RequestQuotesList({
  requestId,
  quotes,
}: RequestQuotesListProps) {
  const requestQuotes = quotes.filter(
    (quote) => quote.request_id === requestId,
  );

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
          <FileText className="size-5" />
        </div>

        <div>
          <h3 className="font-semibold text-foreground">Provider quotations</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Review quotations submitted for this request.
          </p>
        </div>
      </div>

      {requestQuotes.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-6 text-center">
          <MessageSquareText className="mx-auto mb-2 size-7 text-muted-foreground" />
          <p className="text-sm font-medium">No quotations yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Quotations will appear here when providers submit them.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {requestQuotes.map((quote) => (
            <article
              key={quote.id}
              className="rounded-lg border border-border p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-foreground">
                    {quote.workerName || "Service provider"}
                  </p>

                  <p className="mt-1 text-lg font-semibold text-foreground">
                    {formatAmount(
                      Number(quote.amount),
                      quote.currency || "NGN",
                    )}
                  </p>
                </div>

                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ${getStatusStyles(quote.status)}`}
                >
                  {quote.status.replaceAll("_", " ")}
                </span>
              </div>

              {quote.message && (
                <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">
                  {quote.message}
                </p>
              )}

              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <Clock3 className="size-3.5" />
                {new Date(quote.created_at).toLocaleString("en-NG", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
