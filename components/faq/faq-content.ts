export type FAQCategory =
  | "Getting Started"
  | "Customers"
  | "Service Providers"
  | "Payments"
  | "Safety & Support";

export type FAQItem = {
  id: string;
  category: FAQCategory;
  question: string;
  answer: string;
};

export const faqCategories: FAQCategory[] = [
  "Getting Started",
  "Customers",
  "Service Providers",
  "Payments",
  "Safety & Support",
];

export const faqItems: FAQItem[] = [
  // Getting started
  {
    id: "what-is-errandhub",
    category: "Getting Started",
    question: "What is Emirate ErrandHub?",
    answer:
      "Emirate ErrandHub is a service marketplace that connects customers with service providers for everyday tasks. You can explore available services, submit a request, receive quotations, choose a provider, and manage your job through your account.",
  },
  {
    id: "who-can-use",
    category: "Getting Started",
    question: "Who can use Emirate ErrandHub?",
    answer:
      "Customers who need help with everyday services can create customer accounts. Skilled individuals and service businesses can register as service providers, subject to the platform's verification and approval requirements.",
  },
  {
    id: "how-to-register",
    category: "Getting Started",
    question: "How do I create an account?",
    answer:
      "Visit the Sign Up page and choose the appropriate registration option. Customers should register using the customer sign-up process. People who want to offer services should use the service provider registration option.",
  },
  {
    id: "forgot-password",
    category: "Getting Started",
    question: "What if I forget my password?",
    answer:
      "Go to the login page and select 'Forgot password?'. Enter the email address associated with your account. If an account exists for that address, a password recovery link will be sent to your inbox. Follow the link to choose a new password.",
  },
  {
    id: "service-availability",
    category: "Getting Started",
    question: "Which services can I find on ErrandHub?",
    answer:
      "Available services depend on the categories and providers active on the platform. They may include cleaning, plumbing, electrical repairs, air-conditioner repairs, delivery, moving, and other everyday services. Browse the Services page to see what is currently available.",
  },

  // Customers
  {
    id: "request-service",
    category: "Customers",
    question: "How do I request a service?",
    answer:
      "Browse the Services page, choose the service you need, and submit a request with a clear description of the task. Provide your preferred location and schedule, and include relevant photos or videos when they help explain the work. You can then follow your request from your dashboard.",
  },
  {
    id: "receive-quotations",
    category: "Customers",
    question: "How do I receive quotations?",
    answer:
      "After submitting a request, service providers who are eligible to view and respond to it may submit quotations. You can review the available offers and compare the proposed prices and details before making a decision.",
  },
  {
    id: "accept-quotation",
    category: "Customers",
    question: "What happens when I accept a quotation?",
    answer:
      "Accepting a quotation confirms your choice of provider and assigns the job to that provider. You can then proceed with the payment options available for the job and follow its progress through your dashboard.",
  },
  {
    id: "reject-quotation",
    category: "Customers",
    question: "Can I reject a quotation?",
    answer:
      "Yes. You can reject a quotation if its price or proposed terms do not meet your expectations. You can review other available quotations before choosing a provider.",
  },
  {
    id: "track-job",
    category: "Customers",
    question: "How can I track my service request?",
    answer:
      "Sign in and open the relevant request or job from your customer dashboard. The job details and status help you follow progress as the provider works through the service.",
  },
  {
    id: "cancel-job",
    category: "Customers",
    question: "Can I cancel a request or an assigned job?",
    answer:
      "If you need to cancel, check the available options on the request or job and contact support if you need assistance. The handling of an assigned job, any payment already made, and any applicable refund must be reviewed according to the circumstances and the platform's applicable policies. Do not assume that cancelling automatically reverses a payment.",
  },
  {
    id: "customer-reviews",
    category: "Customers",
    question: "Can I leave a review after a service?",
    answer:
      "Where the review feature is available for your completed job, you can share feedback about your experience. Honest and respectful reviews help other customers make informed decisions and help providers improve their services.",
  },

  // Service providers
  {
    id: "become-provider",
    category: "Service Providers",
    question: "How do I become a service provider?",
    answer:
      "Choose the service provider registration option and complete the application. You will need to verify your email address and phone number, submit the required documents, and wait for an administrator to review and approve your application.",
  },
  {
    id: "provider-approval",
    category: "Service Providers",
    question: "Can I accept jobs immediately after registering?",
    answer:
      "No. Registering does not automatically authorize you to accept jobs. Providers must complete the required verification steps, submit the required documents, and receive administrator approval before they can accept jobs through the platform.",
  },
  {
    id: "provider-documents",
    category: "Service Providers",
    question: "Why do I need to submit documents?",
    answer:
      "Required documents help the platform review service provider applications and support its provider verification process. Submit accurate, valid documents through the designated application or verification area of your dashboard.",
  },
  {
    id: "provider-service-areas",
    category: "Service Providers",
    question: "How do I choose where I offer services?",
    answer:
      "Use the Service Areas section of your provider dashboard to select the locations you serve. Keep your selected areas up to date so customers can find providers who serve their locations.",
  },
  {
    id: "provider-quotations",
    category: "Service Providers",
    question: "How do I submit a quotation?",
    answer:
      "Open an available request that matches your services and review the customer's description. Submit a quotation with a realistic price and any relevant details about the work. The customer decides whether to accept or reject your offer.",
  },
  {
    id: "provider-job-assignment",
    category: "Service Providers",
    question: "When is a job assigned to me?",
    answer:
      "A job is assigned to you when the customer accepts your quotation. You do not need a separate job-acceptance step after the customer accepts the quotation.",
  },
  {
    id: "provider-earnings",
    category: "Service Providers",
    question: "Where can I view my earnings?",
    answer:
      "Sign in to your provider dashboard and open the Earnings section to review the earnings information available for your jobs. Your dashboard also provides access to your payout account information.",
  },
  {
    id: "provider-withdrawals",
    category: "Service Providers",
    question: "How do I receive my earnings?",
    answer:
      "Keep your payout account details up to date in your provider dashboard. Earnings are subject to the platform's payment and release process. Check your earnings information for the status of your funds, or contact support if you need help with a payout.",
  },

  // Payments
  {
    id: "payment-method",
    category: "Payments",
    question: "How do I pay for a service?",
    answer:
      "Payments for eligible jobs are processed online through Paystack. When payment is available for your assigned job, follow the payment instructions shown in your dashboard. Always confirm that you are paying against the correct job.",
  },
  {
    id: "full-or-deposit",
    category: "Payments",
    question: "Can I pay in full or make a deposit?",
    answer:
      "For eligible jobs without a discount, customers can choose full payment or the platform's 40% deposit arrangement, with the remaining balance payable later. The available payment options are shown for the job before you proceed.",
  },
  {
    id: "discount-payment",
    category: "Payments",
    question: "Can I use a discount and pay a deposit?",
    answer:
      "No. When a discount is applied to a job, the discounted amount must be paid in full. The deposit option is not available for discounted jobs.",
  },
  {
    id: "payment-confirmation",
    category: "Payments",
    question: "How do I know if my payment was successful?",
    answer:
      "A payment is confirmed after the platform verifies the transaction. Check the payment information on the relevant job and your payment history for its status. Do not rely only on a bank debit notification or a payment screenshot as proof of confirmation.",
  },
  {
    id: "failed-payment",
    category: "Payments",
    question: "What should I do if a payment fails?",
    answer:
      "Check the payment status on your dashboard before trying again. If your account was debited but the payment is still pending or unsuccessful, avoid making repeated payments until you have checked the transaction status. Contact support with the relevant job and transaction details if the issue remains unresolved.",
  },
  {
    id: "refunds",
    category: "Payments",
    question: "How do refunds work?",
    answer:
      "Refund requests must be reviewed based on the job, payment status, and circumstances. If you believe you are entitled to a refund, contact support with the relevant job and transaction details. A refund should not be assumed to be automatic when a request or job is cancelled.",
  },
  {
    id: "discount-codes",
    category: "Payments",
    question: "How do I use a discount code?",
    answer:
      "If a discount code is available to you, enter it in the discount area provided for the eligible job and apply it before making payment. The platform will show the applicable discount and updated amount. Discount codes are subject to their stated eligibility conditions and availability.",
  },

  // Safety and support
  {
    id: "provider-verification",
    category: "Safety & Support",
    question: "Are service providers verified?",
    answer:
      "Service providers are required to verify their email addresses and phone numbers, submit the required documents, and receive administrator approval before accepting jobs. Verification is part of the platform's provider review process, but customers should still communicate clearly and exercise reasonable care when arranging a service.",
  },
  {
    id: "protect-account",
    category: "Safety & Support",
    question: "How can I keep my account secure?",
    answer:
      "Use a strong, unique password and keep your login details private. Never share your password or verification codes with anyone. Access your account through the official Emirate ErrandHub website and contact support if you notice activity you do not recognise.",
  },
  {
    id: "report-problem",
    category: "Safety & Support",
    question: "What should I do if I have a problem with a service?",
    answer:
      "If you experience a problem, open the relevant job and use the available dispute or support options. Explain what happened and provide relevant information or supporting evidence so the issue can be reviewed.",
  },
  {
    id: "disputes",
    category: "Safety & Support",
    question: "How are disputes handled?",
    answer:
      "A dispute submitted through the platform can be reviewed by the appropriate administrator. Keep your explanation factual and provide relevant evidence, such as job details, messages, or supporting photos. You can follow the dispute information available in your dashboard.",
  },
  {
    id: "contact-support",
    category: "Safety & Support",
    question: "How can I contact customer support?",
    answer:
      "Sign in to your account and visit the Support Center to create or follow a support ticket. Include the relevant job or transaction details and explain the issue clearly so the support team can assist you.",
  },
];
