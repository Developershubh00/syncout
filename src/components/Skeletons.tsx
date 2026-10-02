/** Shown instantly while the next page loads — so a tap always feels answered. */
export function ListSkeleton() {
  return (
    <div className="pt-6" aria-busy="true" aria-label="Loading">
      <div className="px-4 lg:px-0">
        <div className="sk h-4 w-40 rounded-full" />
        <div className="sk mt-4 h-9 w-64 rounded-xl" />
        <div className="sk mt-3 h-4 w-80 max-w-full rounded-full" />
      </div>
      <div className="mt-5 flex gap-2 px-4 lg:px-0">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="sk h-8 w-20 rounded-full" />
        ))}
      </div>
      <div className="mt-6 grid gap-5 px-4 sm:grid-cols-2 lg:grid-cols-3 lg:px-0">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i}>
            <div className="sk aspect-[16/10] rounded-[20px]" />
            <div className="sk mt-2.5 h-3.5 w-1/2 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading" className="lg:grid lg:grid-cols-[1.15fr_1fr] lg:gap-10">
      <div className="sk aspect-[4/3] w-full lg:aspect-[16/11] lg:rounded-[26px]" />
      <div className="px-4 pt-5 lg:px-0 lg:pt-2">
        <div className="flex gap-2">
          <div className="sk h-8 w-28 rounded-full" />
          <div className="sk h-8 w-20 rounded-full" />
        </div>
        <div className="sk mt-5 h-4 w-full rounded-full" />
        <div className="sk mt-2.5 h-4 w-5/6 rounded-full" />
        <div className="sk mt-2.5 h-4 w-2/3 rounded-full" />
        <div className="sk mt-8 h-14 w-full rounded-2xl" />
      </div>
    </div>
  );
}
