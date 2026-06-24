"use client";

import { InlineEditField } from "./InlineEditField";

interface Props {
  initialName: string;
}

function validate(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed || !(/[a-zA-Z]/.test(trimmed))) return "Name needs at least one letter.";
  if (trimmed.length > 60) return "Name needs at least one letter.";
  return null;
}

export function NameEditorClient({ initialName }: Props) {
  async function save(name: string): Promise<string | null> {
    const res = await fetch("/api/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      return data.error ?? "Couldn't save. Try again.";
    }
    return null;
  }

  return (
    <InlineEditField
      label="Name"
      initialValue={initialName}
      placeholder="Your name"
      validate={validate}
      onSave={save}
    />
  );
}
