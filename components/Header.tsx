// components/Header.tsx
export function Header() {
  return (
    <header className="bg-[#1B4F8A] text-white">
      <div className="max-w-2xl mx-auto px-8 py-4 flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg bg-[#E8810A] flex items-center justify-center flex-shrink-0">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M7 1L9.5 5.5H12.5L10 8.5L11 13L7 10.5L3 13L4 8.5L1.5 5.5H4.5L7 1Z"
              fill="white" />
          </svg>
        </div>
        <div>
          <span className="font-extrabold text-base tracking-tight">SkillForge</span>
          <span className="ml-2 text-blue-200 text-xs font-normal hidden sm:inline">
            Canadian Trade Pathway Matching
          </span>
        </div>
      </div>
    </header>
  );
}
