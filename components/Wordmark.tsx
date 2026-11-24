export default function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`brand inline-flex items-baseline ${className}`}>
      Booktion
      <span
        aria-hidden="true"
        className="ml-[0.14em] inline-block size-[0.17em] rotate-45 bg-caramel"
      />
    </span>
  );
}
