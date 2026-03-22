"use client";

import { useStore } from "@tanstack/react-form";
import { css, cx } from "styled-system/css";
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
      className={cx(button({ variant: "primary" }), css({ width: "100%" }))}
      disabled={isSubmitting}
      type="submit"
    >
      {label}
    </button>
  );
};
