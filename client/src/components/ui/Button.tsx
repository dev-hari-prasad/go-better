import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'secondary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center whitespace-nowrap flex-nowrap font-medium apple-button focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shrink-0 select-none cursor-pointer';

  const sizeStyles = {
    xs: 'px-3 py-1.5 text-xs gap-1.5 font-semibold h-8 min-h-[32px]',
    sm: 'px-3.5 py-2 text-xs gap-2 font-semibold h-9 min-h-[36px]',
    md: 'px-4 py-2.5 text-sm gap-2 font-semibold h-10 min-h-[40px]',
    lg: 'px-5 py-3 text-base gap-2.5 font-bold h-11 min-h-[44px]',
  };

  const variantStyles = {
    primary: 'bg-[#c0f200] text-black hover:bg-[#b2e300] active:bg-[#a5d400] font-bold shadow-xs',
    secondary: 'bg-[#1a1b22] text-zinc-200 hover:bg-[#252733] active:bg-[#121316] border border-[#232530] hover:border-zinc-700',
    outline: 'bg-transparent text-zinc-300 hover:bg-[#1a1b22] border border-[#232530] hover:border-zinc-700',
    ghost: 'bg-transparent text-zinc-400 hover:text-zinc-200 hover:bg-[#1a1b22] border border-transparent',
    danger: 'bg-rose-600/90 text-white hover:bg-rose-600 active:bg-rose-700 border border-rose-500/30',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin h-3.5 w-3.5 text-current shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : leftIcon ? (
        <span className="shrink-0 flex items-center">{leftIcon}</span>
      ) : null}
      <span className="whitespace-nowrap">{children}</span>
      {!isLoading && rightIcon && <span className="shrink-0 flex items-center">{rightIcon}</span>}
    </button>
  );
};
