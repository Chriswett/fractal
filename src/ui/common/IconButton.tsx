import { ReactNode } from "react";

type IconButtonProps = {
  label: string;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
  children: ReactNode;
};

export function IconButton({ label, onClick, active, disabled, children }: IconButtonProps) {
  return (
    <button
      type="button"
      className={`icon-btn${active ? " active" : ""}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      data-tooltip={label}
    >
      {children}
    </button>
  );
}
