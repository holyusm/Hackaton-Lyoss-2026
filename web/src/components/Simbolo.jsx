// Símbolo de Parejo (docs/diseno/vistas/lote-0-sistema/marca/). Colores desde --marca-*,
// así en alto contraste pasa solo a blanco y negro. Bajo 48 px va sin ventanas, como en la referencia.
export default function Simbolo({ size = 32, ...props }) {
  const ventanas = size >= 40;
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} {...props}>
      <rect width="64" height="64" rx="14" fill="var(--marca-cobalto)" />
      <path d="M4 58L60 22" stroke="#FFFFFF" strokeWidth={ventanas ? 4 : 5} strokeLinecap="round" />
      <path d="M19 9H45V28.7L19 45.4Z" fill="var(--marca-calamina)" />
      {ventanas && (
        <>
          <rect x="23" y="13" width="8" height="8" rx="1.5" fill="var(--marca-cobalto)" />
          <rect x="33" y="13" width="8" height="8" rx="1.5" fill="var(--marca-cobalto)" />
        </>
      )}
      <path d="M19 27H45" stroke="var(--marca-pacifico)" strokeWidth={ventanas ? 3 : 4} />
    </svg>
  );
}
