import React from 'react';
import { cn } from '@/lib/utils';

interface NeoButtonProps {
  text: string;
  icon?: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

const NeoButton: React.FC<NeoButtonProps> = ({ text, icon, onClick, className = '', disabled = false, type = 'button' }) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className={cn(
      'relative border-2 rounded-xl px-6 py-3 font-semibold text-base',
      'transition-all duration-100 ease-in-out',
      'active:translate-y-1 active:shadow-[1px_1px_0px]',
      'hover:-translate-y-0.5 hover:shadow-[5px_5px_0px]',
      'flex items-center justify-center gap-2',
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-[3px_3px_0px]',
      className
    )}
  >
    {icon && <span className="inline-flex">{icon}</span>}
    {text}
  </button>
);

export default NeoButton;
