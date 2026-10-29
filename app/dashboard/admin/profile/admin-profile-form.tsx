"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { updateAdminProfile } from "./actions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState = {
  error: undefined,
  success: undefined,
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending}
      className="bg-emerald-600 hover:bg-emerald-700"
    >
      {pending ? "Saving changes..." : "Save changes"}
    </Button>
  );
}

type AdminProfileFormProps = {
  firstName: string;
  lastName: string;
  phone: string;
};

export default function AdminProfileForm({
  firstName,
  lastName,
  phone,
}: AdminProfileFormProps) {
  const [state, formAction] = useActionState(updateAdminProfile, initialState);

  const [firstNameValue, setFirstNameValue] = useState(firstName);
  const [lastNameValue, setLastNameValue] = useState(lastName);
  const [phoneValue, setPhoneValue] = useState(phone);

  return (
    <form action={formAction} className="space-y-5">
      {state.error && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {state.error}
        </div>
      )}

      {state.success && (
        <div
          role="status"
          className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400"
        >
          {state.success}
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="firstName">First name</Label>
          <Input
            id="firstName"
            name="firstName"
            value={firstNameValue}
            onChange={(event) => setFirstNameValue(event.target.value)}
            placeholder="Enter first name"
            maxLength={50}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName">Last name</Label>
          <Input
            id="lastName"
            name="lastName"
            value={lastNameValue}
            onChange={(event) => setLastNameValue(event.target.value)}
            placeholder="Enter last name"
            maxLength={50}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone number</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          value={phoneValue}
          onChange={(event) => setPhoneValue(event.target.value)}
          placeholder="+234 800 000 0000"
          maxLength={20}
        />
        <p className="text-xs text-muted-foreground">
          Include your country code where applicable.
        </p>
      </div>

      <div className="flex justify-end border-t pt-5">
        <SubmitButton />
      </div>
    </form>
  );
}

// "use client";

// import { useActionState } from "react";
// import { useFormStatus } from "react-dom";
// import { updateAdminProfile } from "./actions";

// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";

// const initialState = {
//   error: undefined,
//   success: undefined,
// };

// function SubmitButton() {
//   const { pending } = useFormStatus();

//   return (
//     <Button
//       type="submit"
//       disabled={pending}
//       className="bg-emerald-600 hover:bg-emerald-700"
//     >
//       {pending ? "Saving changes..." : "Save changes"}
//     </Button>
//   );
// }

// type AdminProfileFormProps = {
//   firstName: string;
//   lastName: string;
//   phone: string;
// };

// export default function AdminProfileForm({
//   firstName,
//   lastName,
//   phone,
// }: AdminProfileFormProps) {
//   const [state, formAction] = useActionState(updateAdminProfile, initialState);

//   return (
//     <form action={formAction} className="space-y-5">
//       {state.error && (
//         <div
//           role="alert"
//           className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
//         >
//           {state.error}
//         </div>
//       )}

//       {state.success && (
//         <div
//           role="status"
//           className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400"
//         >
//           {state.success}
//         </div>
//       )}

//       <div className="grid gap-5 sm:grid-cols-2">
//         <div className="space-y-2">
//           <Label htmlFor="firstName">First name</Label>
//           <Input
//             id="firstName"
//             name="firstName"
//             defaultValue={firstName}
//             placeholder="Enter first name"
//             maxLength={50}
//             required
//           />
//         </div>

//         <div className="space-y-2">
//           <Label htmlFor="lastName">Last name</Label>
//           <Input
//             id="lastName"
//             name="lastName"
//             defaultValue={lastName}
//             placeholder="Enter last name"
//             maxLength={50}
//             required
//           />
//         </div>
//       </div>

//       <div className="space-y-2">
//         <Label htmlFor="phone">Phone number</Label>
//         <Input
//           id="phone"
//           name="phone"
//           type="tel"
//           defaultValue={phone}
//           placeholder="+234 800 000 0000"
//           maxLength={20}
//         />
//         <p className="text-xs text-muted-foreground">
//           Include your country code where applicable.
//         </p>
//       </div>

//       <div className="flex justify-end border-t pt-5">
//         <SubmitButton />
//       </div>
//     </form>
//   );
// }
