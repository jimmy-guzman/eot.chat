"use client";

import { createFormHook, createFormHookContexts } from "@tanstack/react-form";

import { SubmitButton } from "@/components/form/submit-button";
import { TextField } from "@/components/form/text-field";

export const { fieldContext, formContext, useFieldContext, useFormContext } =
  createFormHookContexts();

export const { useAppForm } = createFormHook({
  fieldComponents: { TextField },
  fieldContext,
  formComponents: { SubmitButton },
  formContext,
});
