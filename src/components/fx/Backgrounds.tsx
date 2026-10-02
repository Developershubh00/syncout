/** Fixed decorative backdrops. Pure CSS — cheap on phones, and off under reduced-motion. */
export function PartyBackground() {
  return (
    <div aria-hidden className="fx-bg fx-party">
      <span className="orb orb-1" />
      <span className="orb orb-2" />
      <span className="orb orb-3" />
      <span className="sparkle" />
    </div>
  );
}

export function ElegantBackground() {
  return (
    <div aria-hidden className="fx-bg fx-elegant">
      <span className="beam" />
      <span className="beam beam-2" />
      <span className="grain" />
    </div>
  );
}
