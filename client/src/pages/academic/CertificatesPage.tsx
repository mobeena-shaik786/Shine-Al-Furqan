import { useCallback, useEffect, useState } from 'react';
import { Award, Search } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import {
  issueCertificates,
  listCompletedBatchesForCertificates,
  listEligibleStudents,
  listIssuedCertificates,
  type CertificateDto,
  type CompletedBatchOption,
  type EligibleStudentDto,
} from '../../services/certificateApi';

type Tab = 'issued' | 'eligible';

const canIssue = (role?: string) => role === 'admin' || role === 'coordinator';

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export function CertificatesPage() {
  const { user } = useAuth();
  const issueAllowed = canIssue(user?.role);
  const [tab, setTab] = useState<Tab>('issued');
  const [search, setSearch] = useState('');
  const [batchId, setBatchId] = useState('');
  const [batches, setBatches] = useState<CompletedBatchOption[]>([]);
  const [issued, setIssued] = useState<CertificateDto[]>([]);
  const [eligible, setEligible] = useState<EligibleStudentDto[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const loadBatches = useCallback(async () => {
    if (user?.role === 'student') {
      setBatches([]);
      return;
    }
    try {
      setBatches(await listCompletedBatchesForCertificates());
    } catch {
      setBatches([]);
    }
  }, [user?.role]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      if (tab === 'issued') {
        const result = await listIssuedCertificates({
          search: search.trim() || undefined,
          batchId: batchId || undefined,
        });
        setIssued(result.certificates);
      } else {
        const result = await listEligibleStudents({
          search: search.trim() || undefined,
          batchId: batchId || undefined,
        });
        setEligible(result.students);
        setSelected((prev) =>
          prev.filter((id) => result.students.some((s) => s.studentId === id)),
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load certificates');
    } finally {
      setLoading(false);
    }
  }, [tab, search, batchId]);

  useEffect(() => {
    void loadBatches();
  }, [loadBatches]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setSelected([]);
  }, [tab, batchId]);

  const issueForBatch = async () => {
    if (!batchId) return;
    setBusy(true);
    setError('');
    try {
      await issueCertificates({
        batchId,
        studentIds: selected.length > 0 ? selected : undefined,
      });
      setSelected([]);
      setTab('issued');
      setSearch('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to issue certificates');
    } finally {
      setBusy(false);
    }
  };

  const allEligibleSelected =
    eligible.length > 0 && eligible.every((s) => selected.includes(s.studentId));

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <PageHeader
          title="Certificates"
          description="Issue and download completion certificates for students in completed batches"
          className="mb-3"
        />
        <div className="flex gap-6 border-b border-[#E4DFE5]">
          <button
            type="button"
            onClick={() => setTab('issued')}
            className={cn(
              'border-b-2 pb-2.5 text-sm font-semibold transition',
              tab === 'issued'
                ? 'border-[#B01828] text-[#1E2531]'
                : 'border-transparent text-[#758188] hover:text-[#1E2531]',
            )}
          >
            Issued
          </button>
          {user?.role !== 'student' ? (
            <button
              type="button"
              onClick={() => setTab('eligible')}
              className={cn(
                'border-b-2 pb-2.5 text-sm font-semibold transition',
                tab === 'eligible'
                  ? 'border-[#B01828] text-[#1E2531]'
                  : 'border-transparent text-[#758188] hover:text-[#1E2531]',
              )}
            >
              Eligible to issue
            </button>
          ) : null}
        </div>
      </div>

      <section className="rounded-2xl border border-[#E4DFE5] bg-[#F8F8F8] shadow-soft">
        <div className="space-y-3 border-b border-[#E4DFE5] p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#758188]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search student, batch, certificate no..."
                className="w-full rounded-xl border border-[#E4DFE5] bg-[#F8F8F8] py-2.5 pl-10 pr-3 text-sm outline-none focus:border-[#E03040] focus:ring-2 focus:ring-[#E03040]/20"
              />
            </div>
            {user?.role !== 'student' ? (
              <select
                value={batchId}
                onChange={(e) => setBatchId(e.target.value)}
                className="rounded-xl border border-[#E4DFE5] bg-[#F8F8F8] px-3 py-2.5 text-sm text-[#1E2531] outline-none focus:border-[#E03040] focus:ring-2 focus:ring-[#E03040]/20 lg:min-w-[220px]"
                aria-label="Filter by completed batch"
              >
                <option value="">All completed batches</option>
                {batches.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))}
              </select>
            ) : null}
            {tab === 'eligible' && issueAllowed ? (
              <button
                type="button"
                disabled={!batchId || busy}
                onClick={() => void issueForBatch()}
                className={cn(
                  'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition',
                  batchId
                    ? 'bg-[#B01828] text-[#F8F8F8] hover:bg-[#800810]'
                    : 'cursor-not-allowed bg-[#E4DFE5] text-[#758188]',
                )}
              >
                <Award className="h-4 w-4" />
                Issue for batch
              </button>
            ) : null}
          </div>

          {tab === 'eligible' ? (
            <p className="text-sm text-[#758188]">
              Select a completed batch to bulk-issue certificates for every student who does not
              have one yet. Or tick rows after choosing a batch.
            </p>
          ) : null}
          {error ? <p className="text-sm text-[#E03040]">{error}</p> : null}
        </div>

        <div className="min-h-[320px] p-4 sm:p-5">
          {loading ? (
            <p className="py-16 text-center text-sm text-[#758188]">Loading…</p>
          ) : tab === 'issued' ? (
            issued.length === 0 ? (
              <EmptyState message="No certificates issued yet" />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-[#E4DFE5] text-xs uppercase tracking-wide text-[#758188]">
                    <tr>
                      <th className="px-3 py-3">Certificate No</th>
                      <th className="px-3 py-3">Student</th>
                      <th className="px-3 py-3">Batch</th>
                      <th className="px-3 py-3">Course</th>
                      <th className="px-3 py-3">Issued</th>
                    </tr>
                  </thead>
                  <tbody>
                    {issued.map((cert) => (
                      <tr key={cert._id} className="border-b border-[#E4DFE5]/80 last:border-0">
                        <td className="px-3 py-3 font-semibold text-[#1E2531]">
                          {cert.certificateNo}
                        </td>
                        <td className="px-3 py-3 text-[#1E2531]">{cert.studentName}</td>
                        <td className="px-3 py-3 text-[#758188]">{cert.batchName}</td>
                        <td className="px-3 py-3 text-[#758188]">{cert.courseTitle}</td>
                        <td className="px-3 py-3 text-[#758188]">{formatDate(cert.issuedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : eligible.length === 0 ? (
            <EmptyState message="No students in completed batches match your filters" />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-[#E4DFE5] text-xs uppercase tracking-wide text-[#758188]">
                  <tr>
                    {issueAllowed ? (
                      <th className="px-3 py-3">
                        <input
                          type="checkbox"
                          checked={allEligibleSelected}
                          onChange={() =>
                            setSelected(
                              allEligibleSelected ? [] : eligible.map((s) => s.studentId),
                            )
                          }
                          aria-label="Select all eligible students"
                          disabled={!batchId}
                        />
                      </th>
                    ) : null}
                    <th className="px-3 py-3">Student</th>
                    <th className="px-3 py-3">Batch</th>
                    <th className="px-3 py-3">Course</th>
                  </tr>
                </thead>
                <tbody>
                  {eligible.map((row) => (
                    <tr
                      key={`${row.studentId}-${row.batchId}`}
                      className="border-b border-[#E4DFE5]/80 last:border-0"
                    >
                      {issueAllowed ? (
                        <td className="px-3 py-3">
                          <input
                            type="checkbox"
                            checked={selected.includes(row.studentId)}
                            disabled={!batchId || row.batchId !== batchId}
                            onChange={() =>
                              setSelected((prev) =>
                                prev.includes(row.studentId)
                                  ? prev.filter((id) => id !== row.studentId)
                                  : [...prev, row.studentId],
                              )
                            }
                            aria-label={`Select ${row.studentName}`}
                          />
                        </td>
                      ) : null}
                      <td className="px-3 py-3">
                        <p className="font-semibold text-[#1E2531]">{row.studentName}</p>
                        <p className="text-xs text-[#758188]">{row.studentEmail}</p>
                      </td>
                      <td className="px-3 py-3 text-[#758188]">{row.batchName}</td>
                      <td className="px-3 py-3 text-[#758188]">{row.courseTitle}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <Award className="h-14 w-14 text-[#E4DFE5]" aria-hidden />
      <p className="mt-4 text-sm text-[#758188]">{message}</p>
    </div>
  );
}

export default CertificatesPage;
