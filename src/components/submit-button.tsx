"use client";

import { useStore } from "@tanstack/react-form";
import { button } from "styled-system/recipes";

import { useFormContext } from "@/lib/form";

interface Props {
  label: string;
}

export const SubmitButton = ({ label }: Props) => {
  const form = useFormContext();
  const isSubmitting = useStore(form.store, (s) => s.isSubmitting);

  return (
    <button
      className={button({ size: "block", variant: "primary" })}
      disabled={isSubmitting}
      type="submit"
    >
      {label}
    </button>
  );
};
