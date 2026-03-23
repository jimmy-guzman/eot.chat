"use client";

import { css, cx } from "styled-system/css";
import { input, label } from "styled-system/recipes";

import { useFieldContext } from "@/lib/form";

interface Props {
  autoComplete?: string;
  label: string;
  placeholder?: string;
}

function errorMessage(e: unknown): string {
  if (typeof e === "string") return e;

  if (
    typeof e === "object" &&
    e !== null &&
    "message" in e &&
    typeof (e as Record<string, unknown>).message === "string"
  ) {
    return (e as Record<string, unknown>).message as string;
  }

  return "Invalid value";
}

export const TextField = ({
  autoComplete,
  label: labelText,
  placeholder,
}: Props) => {
  const field = useFieldContext<string>();
  const { errors } = field.state.meta;

  return (
    <>
      <label
        className={cx(label(), css({ marginBottom: "2" }))}
        htmlFor={field.name}
      >
        {labelText}
      </label>
      <input
        autoComplete={autoComplete}
        className={input()}
        id={field.name}
        name={field.name}
        onBlur={field.handleBlur}
        onChange={(e) => {
          field.handleChange(e.target.value);
        }}
        placeholder={placeholder}
        type="text"
        value={field.state.value}
      />
      <p
        aria-live="polite"
        className={css({
          color: "error",
          fontSize: "xs",
          marginTop: "1",
          minHeight: "1em",
        })}
      >
        {errors.length > 0 ? errors.map(errorMessage).join(", ") : null}
      </p>
    </>
  );
};
