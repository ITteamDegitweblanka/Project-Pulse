
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', className = '', ...props }) => {
  const baseStyles = 'inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-light-bg dark:focus:ring-offset-dark-bg disabled:opacity-50 disabled:cursor-not-allowed transition-colors';

  const variantStyles = {
    primary: 'bg-brand-primary hover:bg-brand-primary/90 text-white focus:ring-brand-primary',
    secondary: 'bg-light-card dark:bg-dark-card hover:bg-light-border dark:hover:bg-dark-border text-light-text-primary dark:text-dark-text-primary border-light-border dark:border-dark-border focus:ring-brand-secondary',
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;