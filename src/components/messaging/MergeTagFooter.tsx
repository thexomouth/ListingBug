export function MergeTagFooter() {
  return (
    <div className="mt-4 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 p-3 text-xs text-zinc-500 dark:text-zinc-400 space-y-1">
      <p className="font-semibold text-zinc-600 dark:text-zinc-300">Available merge tags</p>
      <p><span className="font-mono bg-zinc-200 dark:bg-zinc-800 px-1 rounded">{'{{first_name}}'}</span> <span className="font-mono bg-zinc-200 dark:bg-zinc-800 px-1 rounded">{'{{last_name}}'}</span> <span className="font-mono bg-zinc-200 dark:bg-zinc-800 px-1 rounded">{'{{city}}'}</span> <span className="font-mono bg-zinc-200 dark:bg-zinc-800 px-1 rounded">{'{{company}}'}</span></p>
      <p className="text-zinc-400 dark:text-zinc-500">Example subject: <span className="italic">"New listings in {'{{city}}'}, {'{{first_name}}'}"</span></p>
      <p className="text-zinc-400 dark:text-zinc-500">Example body: <span className="italic">"Hi {'{{first_name}}'}, here are this week's new listings in {'{{city}}'}..."</span></p>
    </div>
  );
}
