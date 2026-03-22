"use client";

import { css, cx } from "styled-system/css";
import { input, label } from "styled-system/recipes";

import { useFieldContext } from "@/lib/form";

interface Props {
  label: string;
  placeholder?: string;
}

export const TextField = ({ label: labelText, placeholder }: Props) => {
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
      {errors.length > 0 ? (
        <p
          className={css({
            color: "error",
            fontSize: "xs",
            marginTop: "1",
          })}
        >
          {errors.join(", ")}
        </p>
      ) : null}
    </>
  );
};
