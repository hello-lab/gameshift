interface KeyboardProps {
  onKey: (key: string) => void;
  onEnter: () => void;
  onBackspace: () => void;
  disabled?: boolean;
}

const ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫'],
];

export function Keyboard({ onKey, onEnter, onBackspace, disabled }: KeyboardProps) {
  const handleKey = (key: string) => {
    if (disabled) return;
    if (key === 'ENTER') return onEnter();
    if (key === '⌫') return onBackspace();
    onKey(key);
  };

  return (
    <div style={{ backgroundColor: '#111827', padding: '8px', borderRadius: '8px', width: '100%' }}>
      {ROWS.map((row, ri) => (
        <div key={ri} style={{ display: 'flex', gap: '4px', justifyContent: 'center', marginBottom: '4px' }}>
          {row.map(key => {
            const isFunctionKey = key === 'ENTER' || key === '⌫';
            return (
              <button
                key={key}
                onClick={() => handleKey(key)}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  handleKey(key);
                }}
                disabled={disabled}
                style={{
                  flex: isFunctionKey ? '1.3' : '1',
                  height: '40px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  borderRadius: '4px',
                  border: isFunctionKey ? 'none' : '1px solid #4b5563',
                  backgroundColor: isFunctionKey ? '#2563eb' : '#374151',
                  color: 'white',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  opacity: disabled ? 0.4 : 1,
                  transition: 'background-color 75ms',
                }}
                onMouseDown={(e) => {
                  if (!disabled) {
                    e.currentTarget.style.backgroundColor = isFunctionKey ? '#1d4ed8' : '#1f2937';
                  }
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.backgroundColor = isFunctionKey ? '#2563eb' : '#374151';
                }}
              >
                {key}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
}
