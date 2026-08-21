export function FullPageLoader({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#E9EEF0]">
      <div className="flex flex-col items-center gap-3">
        <div
          className="h-10 w-10 animate-spin rounded-full border-4 border-[#E03040]/25 border-t-[#E03040]"
          aria-hidden
        />
        <p className="text-sm font-medium text-[#758188]">{label}</p>
      </div>
    </div>
  );
}
