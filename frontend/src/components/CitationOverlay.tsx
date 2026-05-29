import type { CSSProperties } from 'react';

interface Citation {
  citation_id: number;
  chunk_id: string;
  source_path: string;
  source_name: string;
  clearance_level: number;
  document_category: string;
}

interface CitationOverlayProps {
  citation: Citation | null;
  onClose: () => void;
  style?: CSSProperties;
}

const CL_COLORS: Record<number, string> = {
  1: '#10b981', 2: '#3b82f6', 3: '#f59e0b', 4: '#ef4444', 5: '#8b5cf6'
};

const CL_LABELS: Record<number, string> = {
  1: 'RESTRICTED', 2: 'CONFIDENTIAL', 3: 'SECRET', 4: 'TOP SECRET', 5: 'COSMIC TOP SECRET'
};

/**
 * Citation source overlay card.
 * Rendered as plain text — no dangerouslySetInnerHTML.
 */
export function CitationOverlay({ citation, onClose, style }: CitationOverlayProps) {
  if (!citation) return null;

  const clColor = CL_COLORS[citation.clearance_level] || '#94a3b8';
  const clLabel = CL_LABELS[citation.clearance_level] || 'CLASSIFIED';

  return (
    <div
      id={`citation-overlay-${citation.citation_id}`}
      role="dialog"
      aria-modal="true"
      aria-label={`Citation ${citation.citation_id} source details`}
      style={{
        position: 'fixed',
        zIndex: 1000,
        background: '#1a2235',
        border: `1px solid ${clColor}40`,
        borderRadius: '8px',
        padding: '16px',
        minWidth: '280px',
        maxWidth: '380px',
        boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px ${clColor}20`,
        ...style
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <span style={{ color: '#6366f1', fontWeight: 600, fontSize: '0.875rem' }}>
          Source [{citation.citation_id}]
        </span>
        <button
          id={`close-citation-${citation.citation_id}`}
          onClick={onClose}
          aria-label="Close citation overlay"
          style={{
            background: 'transparent', border: 'none', color: '#64748b',
            cursor: 'pointer', fontSize: '1rem', lineHeight: 1, padding: '2px 6px'
          }}
        >
          ✕
        </button>
      </div>

      {/* Clearance badge */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        background: `${clColor}15`, border: `1px solid ${clColor}40`,
        borderRadius: '4px', padding: '3px 8px', marginBottom: '10px'
      }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: clColor, display: 'inline-block' }} />
        <span style={{ color: clColor, fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em' }}>
          {clLabel}
        </span>
      </div>

      {/* Source details — plain text only, no HTML injection */}
      <div style={{ fontSize: '0.8125rem', color: '#94a3b8', lineHeight: 1.6 }}>
        <div style={{ marginBottom: '6px' }}>
          <span style={{ color: '#64748b' }}>File: </span>
          <span style={{ color: '#f1f5f9', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem' }}>
            {citation.source_name}
          </span>
        </div>
        <div style={{ marginBottom: '6px' }}>
          <span style={{ color: '#64748b' }}>Category: </span>
          <span style={{ color: '#f1f5f9' }}>{citation.document_category?.replace(/_/g, ' ')}</span>
        </div>
        <div>
          <span style={{ color: '#64748b' }}>Clearance: </span>
          <span style={{ color: clColor }}>Level {citation.clearance_level}</span>
        </div>
      </div>
    </div>
  );
}
