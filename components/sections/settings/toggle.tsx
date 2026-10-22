"use client";

import { motion } from "framer-motion";

type Props = {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
};

const Toggle = ({ label, description, checked, onChange }: Props) => {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 py-3">
      <div>
        <p className="text-sm">{label}</p>
        {description ? (
          <p className="text-xs opacity-fade">{description}</p>
        ) : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`${
          checked ? "bg-action-brand" : "bg-action-dark"
        } relative h-6 w-11 flex-none rounded-full transition-colors`}>
        <motion.span
          layout
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="absolute top-1 h-4 w-4 rounded-full bg-typography-light"
          style={{ left: checked ? "calc(100% - 20px)" : "4px" }}
        />
      </button>
    </label>
  );
};

export default Toggle;
