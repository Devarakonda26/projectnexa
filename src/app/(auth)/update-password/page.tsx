import { AuthForm } from "@/components/auth/AuthForm";
import { AuthShell } from "@/components/auth/AuthShell";
import { updatePasswordAction } from "../actions";

export const metadata = { title: "Choose a new password" };

export default function UpdatePasswordPage() {
  return (
    <AuthShell title="Choose a new password">
      <AuthForm
        action={updatePasswordAction}
        submitLabel="Update password"
        fields={[
          { name: "password", label: "New password", type: "password", autoComplete: "new-password", hint: "At least 10 characters, with a letter and a number" },
        ]}
      />
    </AuthShell>
  );
}
