import styled from '@emotion/styled';

import type { ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  children,
  ...rest
}: ButtonProps) {
  return (
    <StyledButton variant={variant} size={size} fullWidth={fullWidth} {...rest}>
      {children}
    </StyledButton>
  );
}

const StyledButton = styled.button<{
  variant: ButtonVariant;
  size: ButtonSize;
  fullWidth: boolean;
}>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border-radius: ${({ theme }) => theme.radius.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  letter-spacing: ${({ theme }) => theme.typography.letterSpacing.tight};
  transition: background 0.15s;
  cursor: pointer;
  width: ${({ fullWidth }) => (fullWidth ? '100%' : 'auto')};

  ${({ size }) =>
    size === 'sm' && `height: 36px; padding: 0 14px; font-size: 13px;`}
  ${({ size }) =>
    size === 'md' && `height: 44px; padding: 0 18px; font-size: 14px;`}
  ${({ size }) =>
    size === 'lg' && `height: 56px; padding: 0 22px; font-size: 16px;`}

  ${({ theme, variant }) => {
    switch (variant) {
      case 'primary':
        return `
          background: ${theme.colors.accent};
          color: #FFFFFF;
          box-shadow: ${theme.shadow.btn};
          &:hover:not(:disabled) { background: #2973DC; }
        `;
      case 'secondary':
        return `
          background: ${theme.colors.bgElev2};
          color: ${theme.colors.text2};
          &:hover:not(:disabled) { background: ${theme.colors.bgChip}; }
        `;
      case 'ghost':
        return `
          background: transparent;
          color: ${theme.colors.text2};
          &:hover:not(:disabled) { background: ${theme.colors.bgElev}; }
        `;
      case 'danger':
        return `
          background: transparent;
          color: ${theme.colors.danger};
          &:hover:not(:disabled) { background: ${theme.colors.dangerSoft}; }
        `;
    }
  }}

  &:disabled {
    background: ${({ theme }) => theme.colors.bgElev};
    color: ${({ theme }) => theme.colors.text4};
    cursor: not-allowed;
    box-shadow: none;
  }

  &:active:not(:disabled) {
    transform: scale(0.99);
  }
`;
