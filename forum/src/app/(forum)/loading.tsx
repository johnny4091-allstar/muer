export default function Loading() {
  return (
    <div className="flex flex-col gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="cyber-card p-4 animate-pulse">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-[#1e1e3a]" />
            <div className="flex-1">
              <div className="h-4 bg-[#1e1e3a] rounded w-3/4 mb-2" />
              <div className="h-3 bg-[#1e1e3a] rounded w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
