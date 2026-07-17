import type { HalalStatus } from '../data/schema';
import type { OpenStatus } from '../lib/openNow';

export function CertBadge({ status }: { status: HalalStatus }) {
  return status === 'muis-certified' ? (
    <span className="badge badge-cert">MUIS Certified</span>
  ) : (
    <span className="badge badge-owned">Muslim Owned</span>
  );
}

export function OpenBadge({ status }: { status: OpenStatus }) {
  if (status.state === 'open') {
    return <span className="badge badge-open">Open · till {status.closesAt}</span>;
  }
  if (status.state === 'closing-soon') {
    return <span className="badge badge-soon">Closing soon · {status.closesAt}</span>;
  }
  return (
    <span className="badge badge-closed">
      Closed{status.opensAt ? ` · opens ${status.opensAt}` : ''}
    </span>
  );
}
