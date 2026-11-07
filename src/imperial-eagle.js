// Layered, heraldic feathers remain editable vector artwork, including the stitch guides.
export const imperialEagle = (() => {
  const feathers = Array.from({ length: 8 }, (_, i) => {
    const x = -56 + i * 4.9, y = -66 + i * 11.3;
    const rootX = -13 - i * 1.1, rootY = -11 + i * 5;
    return `<path d="M${rootX} ${rootY}Q${x + 6} ${y + 25} ${x} ${y}Q${x - 10} ${y + 20} ${x + 1} ${y + 36}Q${x + 16} ${y + 48} ${rootX + 3} ${rootY + 6}Z"/>
    <path d="M${rootX} ${rootY + 2}Q${x + 5} ${y + 26} ${x + 1} ${y + 7}" fill="none" stroke="#f2d68f" stroke-width=".65"/>`;
  }).join('');
  const coverts = Array.from({ length: 5 }, (_, i) =>
    `<path d="M${-15 - i * 4.3} ${-21 - i * 6.3}q-10-6-11-14q-5 10 3 19q6 5 8 2Z"/>`).join('');
  const wing = `<g fill="url(#GOLD)" stroke="#66502b" stroke-width=".7">${feathers}${coverts}</g>`;
  const breast = Array.from({ length: 6 }, (_, i) =>
    `<path d="M-9 ${-13 + i * 6}q4 6 9 2q5 4 9-2M-4 ${-9 + i * 6}q4 4 8 0"/>`).join('');
  return `<g>${wing}<g transform="scale(-1 1)">${wing}</g>
    <g fill="url(#GOLD)" stroke="#6d532c" stroke-width=".8">
      <path d="M-8 24Q-19 42-25 53L-12 48-14 61-3 54 0 68 4 54 15 61 12 48 25 53Q15 37 8 24Z"/>
      <path d="M-13-23Q-4-31-7-40L-14-47-7-53 5-54 14-49 22-44 10-41 8-32Q19-18 17-2L10 25Q0 41-10 25L-17-2Q-18-15-13-23Z"/>
      <path d="M-11 18Q-15 29-27 33L-32 41-39 43-38 39-44 41-42 35-35 32-27 28-18 14M11 18Q15 29 27 33L32 41 39 43 38 39 44 41 42 35 35 32 27 28 18 14"/>
    </g>
    <g stroke="#69512c" stroke-width=".65" fill="none">${breast}<path d="M-3 32-5 51M3 32 5 51M0-37Q-4-27 3-19M-8-44 2-46 11-44"/></g>
    <path d="M10-41q8 1 10 5" stroke="#8f4434" stroke-width="1.5" fill="none"/>
    <circle cx="3" cy="-47" r="1.7" fill="#202321"/><circle cx="3.2" cy="-47.6" r=".5" fill="#f3e6bb"/>
  </g>`;
})();
