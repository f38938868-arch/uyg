const React = globalThis.React;

export default function TicTacToe() {
  const [board, setBoard] = React.useState(Array(9).fill(null));
  const [xTurn, setXTurn] = React.useState(true);
  const winner = getWinner(board);
  const status = winner ? `${winner} wins!` : board.every(Boolean) ? 'Draw' : `${xTurn ? 'X' : 'O'} to move`;
  const click = (i) => {
    if (board[i] || winner) return;
    const next = board.slice();
    next[i] = xTurn ? 'X' : 'O';
    setBoard(next);
    setXTurn(!xTurn);
  };
  const reset = () => { setBoard(Array(9).fill(null)); setXTurn(true); };
  const cellStyle = (val) => ({
    height: 72,
    fontSize: 32,
    fontWeight: 900,
    borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.2)',
    background: val === 'X' ? 'linear-gradient(135deg,#1f2937,#111827)' : val === 'O' ? 'linear-gradient(135deg,#065f46,#064e3b)' : 'rgba(255,255,255,0.06)',
    color: val ? '#ffffff' : 'rgba(255,255,255,0.7)',
    textShadow: val ? '0 1px 2px rgba(0,0,0,0.5)' : 'none'
  });
  return React.createElement('div', { style: { padding: 12, display: 'grid', gap: 8 } },
    React.createElement('div', { style: { fontWeight: 800 } }, status),
    React.createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 } },
      board.map((cell, i) => React.createElement('button', {
        key: i,
        onClick: () => click(i),
        style: cellStyle(cell)
      }, cell || ''))
    ),
    React.createElement('button', { className: 'task', onClick: reset }, 'Reset')
  );
}

function getWinner(b) {
  const lines = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  for (const [a,b2,c] of lines) {
    if (b[a] && b[a] === b[b2] && b[a] === b[c]) return b[a];
  }
  return null;
}

