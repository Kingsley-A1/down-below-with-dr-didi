export default function MedicalDisclaimer({
  compact = false,
}: {
  compact?: boolean
}) {
  return (
    <section
      className={compact ? 'rounded-xl border p-5' : 'border-t px-6 py-5'}
      style={{ backgroundColor: '#fffbeb', borderColor: '#fcd34d' }}
      aria-label="Medical disclaimer"
    >
      <div className={compact ? '' : 'max-w-container mx-auto'}>
        <p className="font-body text-sm leading-relaxed" style={{ color: '#92400e' }}>
          <strong>Medical disclaimer:</strong> This content is educational and does not replace medical advice,
          diagnosis, or treatment. For urgent symptoms or emergencies, contact your nearest hospital or qualified
          healthcare professional immediately.
        </p>
      </div>
    </section>
  )
}
