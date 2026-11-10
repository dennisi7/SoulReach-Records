export function RosaBrand({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "rosa-brand rosa-brand-compact" : "rosa-brand"}>
      <span className="rosa-brand-name">ROSA UHAS</span>
      <span className="rosa-brand-motto">Power the vision</span>
    </div>
  );
}
