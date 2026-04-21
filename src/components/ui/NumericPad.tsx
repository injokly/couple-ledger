import styled from '@emotion/styled';

interface NumericPadProps {
  onDigit: (digit: string) => void;
  onDelete: () => void;
}

const KEYS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['00', '0', '⌫'],
] as const;

export function NumericPad({ onDigit, onDelete }: NumericPadProps) {
  function handlePress(key: string) {
    if (key === '⌫') {
      onDelete();
    } else {
      onDigit(key);
    }
  }

  return (
    <Grid>
      {KEYS.flat().map((key) => (
        <Key
          key={key}
          type="button"
          aria-label={key === '⌫' ? '삭제' : key}
          onClick={() => handlePress(key)}
        >
          {key}
        </Key>
      ))}
    </Grid>
  );
}

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 4px;
  padding: 0 4px;
`;

const Key = styled.button`
  height: 52px;
  border-radius: ${({ theme }) => theme.radius.sm};
  font-size: 22px;
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  font-variant-numeric: tabular-nums;
  color: ${({ theme }) => theme.colors.text};
  background: transparent;
  transition: background 0.1s;
  touch-action: manipulation;
  user-select: none;
  -webkit-tap-highlight-color: transparent;

  &:hover {
    background: ${({ theme }) => theme.colors.bgElev};
  }

  &:active {
    background: ${({ theme }) => theme.colors.bgChip};
  }
`;
