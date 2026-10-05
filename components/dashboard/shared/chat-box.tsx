"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import { sendMessage, type MessageActionState } from "@/lib/actions/messages";

type ChatMessage = {
  id: string;
  message: string | null;
  sender_id: string;
  created_at: string;
};

type ChatBoxProps = {
  conversationId: string;
  currentUserId: string;
  initialMessages: ChatMessage[];
};

const initialState: MessageActionState = {};

function formatMessageTime(dateString: string) {
  return new Intl.DateTimeFormat("en-NG", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(dateString));
}

export function ChatBox({
  conversationId,
  currentUserId,
  initialMessages,
}: ChatBoxProps) {
  const [state, formAction, isPending] = useActionState(
    sendMessage,
    initialState,
  );

  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  /*
   * Reset the submission guard when the server action finishes.
   */
  useEffect(() => {
    if (!isPending) {
      isSubmittingRef.current = false;
    }
  }, [isPending]);

  /*
   * Clear the input after a successful message submission.
   */
  useEffect(() => {
    if (state.success && messageInputRef.current) {
      messageInputRef.current.value = "";
    }
  }, [state.success]);

  /*
   * Subscribe to new messages for this conversation.
   */
  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    );

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;

          setMessages((currentMessages) => {
            /*
             * Prevent the same message from being added twice.
             */
            if (
              currentMessages.some((message) => message.id === newMessage.id)
            ) {
              return currentMessages;
            }

            return [...currentMessages, newMessage];
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  /*
   * Scroll to the newest message.
   */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages.length]);

  return (
    <div className="flex h-[500px] flex-col overflow-hidden rounded-xl border bg-background">
      <div className="border-b px-4 py-3">
        <h2 className="font-semibold">Messages</h2>

        <p className="text-sm text-muted-foreground">
          Chat with the other participant
        </p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center">
            <div>
              <p className="font-medium">No messages yet</p>

              <p className="text-sm text-muted-foreground">
                Start the conversation.
              </p>
            </div>
          </div>
        ) : (
          messages.map((item) => {
            const isMine = item.sender_id === currentUserId;

            return (
              <div
                key={item.id}
                className={`flex ${isMine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    isMine
                      ? "rounded-br-sm bg-primary text-primary-foreground"
                      : "rounded-bl-sm bg-muted"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words text-sm">
                    {item.message}
                  </p>

                  <p
                    className={`mt-1 text-[11px] ${
                      isMine
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground"
                    }`}
                  >
                    {formatMessageTime(item.created_at)}
                  </p>
                </div>
              </div>
            );
          })
        )}

        <div ref={messagesEndRef} />
      </div>

      {state.error && (
        <div className="border-t px-4 py-2 text-sm text-destructive">
          {state.error}
        </div>
      )}

      <form
        action={formAction}
        onSubmit={(event) => {
          if (isSubmittingRef.current) {
            event.preventDefault();
            return;
          }

          isSubmittingRef.current = true;
        }}
        className="flex gap-2 border-t p-3"
      >
        <input type="hidden" name="conversationId" value={conversationId} />

        <input
          ref={messageInputRef}
          name="message"
          type="text"
          placeholder="Type a message..."
          maxLength={5000}
          disabled={isPending}
          autoComplete="off"
          className="min-w-0 flex-1 rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send className="size-4" />

          <span className="sr-only">Send message</span>
        </button>
      </form>
    </div>
  );
}
