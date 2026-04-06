import { useState } from 'react';
import { Plus, List, Users } from 'lucide-react';

export interface ContactList {
  id: string;
  name: string;
  count: number;
}

interface ContactsListPanelProps {
  lists: ContactList[];
  selectedListId: string | null; // null = "All Contacts"
  onSelectList: (id: string | null) => void;
  onCreateList: (name: string) => void;
}

export function ContactsListPanel({ lists, selectedListId, onSelectList, onCreateList }: ContactsListPanelProps) {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');

  const handleCreate = () => {
    const name = newName.trim();
    if (!name) return;
    onCreateList(name);
    setNewName('');
    setCreating(false);
  };

  return (
    <div className="w-48 shrink-0 border-r border-zinc-200 dark:border-zinc-700 flex flex-col">
      <div className="p-3 border-b border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
        <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Lists</span>
        <button
          onClick={() => setCreating(true)}
          className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
          title="New list"
        >
          <Plus size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-1">
        {/* All Contacts */}
        <button
          onClick={() => onSelectList(null)}
          className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${
            selectedListId === null
              ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 font-medium'
              : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'
          }`}
        >
          <Users size={13} />
          All Contacts
        </button>

        {lists.map(l => (
          <button
            key={l.id}
            onClick={() => onSelectList(l.id)}
            className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${
              selectedListId === l.id
                ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 font-medium'
                : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'
            }`}
          >
            <List size={13} />
            <span className="truncate flex-1">{l.name}</span>
            <span className="text-xs text-zinc-400 shrink-0">{l.count}</span>
          </button>
        ))}
      </div>

      {creating && (
        <div className="p-2 border-t border-zinc-200 dark:border-zinc-700">
          <input
            autoFocus
            type="text"
            placeholder="List name"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setCreating(false); }}
            className="w-full px-2 py-1.5 text-sm rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-yellow-400 mb-1.5"
          />
          <div className="flex gap-1">
            <button
              onClick={handleCreate}
              className="flex-1 py-1 text-xs rounded bg-yellow-400 hover:bg-yellow-500 text-zinc-900 font-semibold transition-colors"
            >
              Create
            </button>
            <button
              onClick={() => setCreating(false)}
              className="flex-1 py-1 text-xs rounded border border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
