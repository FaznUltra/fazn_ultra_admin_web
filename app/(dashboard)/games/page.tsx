'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { api, ApiError } from '../../../lib/api';
import { GameSchema, GameOptionsSchema } from '../../../lib/schemas';
import type { Game, GameOptions, CreateGameInput } from '../../../lib/schemas';
import { z } from 'zod';

type LoadState = 'loading' | 'error' | 'ready';

const SCORE_LABELS: Record<Game['score_type'], string> = {
  numeric: 'Numeric score',
  win_loss: 'Win / Loss',
  time: 'Time based',
};

export default function GamesPage() {
  const [state, setState] = useState<LoadState>('loading');
  const [games, setGames] = useState<Game[]>([]);
  const [options, setOptions] = useState<GameOptions | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const load = useCallback(async () => {
    setState('loading');
    try {
      const [list, opts] = await Promise.all([api.games.list(), api.games.options()]);
      setGames(z.array(GameSchema).parse(list));
      setOptions(GameOptionsSchema.parse(opts));
      setState('ready');
    } catch {
      setState('error');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleToggle(game: Game) {
    const next = !game.active;
    setGames((gs) => gs.map((g) => (g.id === game.id ? { ...g, active: next } : g)));
    try {
      const updated = GameSchema.parse(await api.games.toggle(game.id, next));
      setGames((gs) => gs.map((g) => (g.id === game.id ? updated : g)));
      toast.success(`${game.name} ${next ? 'activated' : 'deactivated'}`);
    } catch {
      setGames((gs) => gs.map((g) => (g.id === game.id ? { ...g, active: game.active } : g)));
      toast.error('Could not update game status');
    }
  }

  function handleCreated(game: Game) {
    setGames((gs) => [game, ...gs]);
    setDrawerOpen(false);
    toast.success(`${game.name} created`);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Games</h1>
          <p className="text-gray-400 text-sm mt-1">Manage the games available on the platform</p>
        </div>
        <button
          onClick={() => setDrawerOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
        >
          <PlusIcon />
          New game
        </button>
      </div>

      {state === 'loading' && <SkeletonGrid />}

      {state === 'error' && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-8 text-center">
          <p className="text-white font-medium">Couldn&apos;t load games</p>
          <p className="text-gray-400 text-sm mt-1">There was a problem reaching the server.</p>
          <button
            onClick={load}
            className="mt-4 inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-500 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {state === 'ready' && games.length === 0 && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-10 text-center">
          <div className="mx-auto w-12 h-12 flex items-center justify-center rounded-full bg-purple-600/20 text-purple-300">
            <GamepadIcon />
          </div>
          <p className="text-white font-medium mt-4">No games yet</p>
          <p className="text-gray-400 text-sm mt-1">Create your first game to get started.</p>
          <button
            onClick={() => setDrawerOpen(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-500 transition-colors"
          >
            <PlusIcon />
            Create first game
          </button>
        </div>
      )}

      {state === 'ready' && games.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {games.map((game) => (
            <GameCard key={game.id} game={game} onToggle={() => handleToggle(game)} />
          ))}
        </div>
      )}

      {drawerOpen && options && (
        <CreateGameDrawer
          options={options}
          onClose={() => setDrawerOpen(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}

function GameCard({ game, onToggle }: { game: Game; onToggle: () => void }) {
  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-white font-bold truncate">{game.name}</h2>
          <span className="inline-block mt-2 text-xs font-medium px-2 py-0.5 rounded-full bg-purple-600/20 text-purple-300">
            {game.category}
          </span>
        </div>
        <Toggle
          checked={game.active}
          onChange={onToggle}
          label={`Toggle ${game.name} ${game.active ? 'inactive' : 'active'}`}
        />
      </div>

      {game.platforms.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {game.platforms.map((p) => (
            <span
              key={p}
              className="text-xs px-2 py-0.5 rounded-md bg-gray-800 border border-gray-700 text-gray-300"
            >
              {p}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 text-sm text-gray-400">
        <ScoreIcon type={game.score_type} />
        <span>{SCORE_LABELS[game.score_type]}</span>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-gray-800">
        <span
          className={`text-xs font-medium ${game.active ? 'text-emerald-400' : 'text-gray-500'}`}
        >
          {game.active ? 'Active' : 'Inactive'}
        </span>
        <button
          type="button"
          disabled
          aria-disabled="true"
          title="Editing coming soon"
          className="text-xs font-medium px-3 py-1.5 rounded-lg text-gray-500 bg-gray-800/60 cursor-not-allowed"
        >
          Edit
        </button>
      </div>
    </div>
  );
}

function CreateGameDrawer({
  options,
  onClose,
  onCreated,
}: {
  options: GameOptions;
  onClose: () => void;
  onCreated: (game: Game) => void;
}) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [scoreType, setScoreType] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  function togglePlatform(p: string) {
    setPlatforms((cur) => (cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p]));
  }

  function validate() {
    const e: Record<string, string> = {};
    const trimmed = name.trim();
    if (!trimmed) e.name = 'Name is required';
    else if (trimmed.length > 120) e.name = 'Name must be 120 characters or fewer';
    if (!category) e.category = 'Category is required';
    if (platforms.length === 0) e.platforms = 'Select at least one platform';
    if (!scoreType) e.scoreType = 'Score type is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const body: CreateGameInput = {
        name: name.trim(),
        category,
        platforms,
        scoreType: scoreType as CreateGameInput['scoreType'],
      };
      const created = GameSchema.parse(await api.games.create(body));
      onCreated(created);
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error('Could not create game. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Create game">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/60"
      />
      <div className="relative w-full max-w-md h-full bg-gray-900 border-l border-gray-800 overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">New game</h2>
          <button
            onClick={onClose}
            aria-label="Close drawer"
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <CloseIcon />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="p-5 space-y-5">
          <Field label="Name" htmlFor="game-name" error={errors.name}>
            <input
              id="game-name"
              type="text"
              value={name}
              maxLength={120}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Chess"
              className={inputCls(errors.name)}
              disabled={submitting}
            />
          </Field>

          <Field label="Category" htmlFor="game-category" error={errors.category}>
            <select
              id="game-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={inputCls(errors.category)}
              disabled={submitting}
            >
              <option value="">Select a category</option>
              {options.categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>

          <fieldset>
            <legend className="block text-sm font-medium text-gray-300 mb-2">Platforms</legend>
            <div className="grid grid-cols-2 gap-2">
              {options.platforms.map((p) => (
                <label
                  key={p}
                  className="flex items-center gap-2 text-sm text-gray-300 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 cursor-pointer hover:border-gray-600"
                >
                  <input
                    type="checkbox"
                    checked={platforms.includes(p)}
                    onChange={() => togglePlatform(p)}
                    disabled={submitting}
                    className="accent-purple-600"
                  />
                  {p}
                </label>
              ))}
            </div>
            {errors.platforms && <p className="text-xs text-red-400 mt-1">{errors.platforms}</p>}
          </fieldset>

          <Field label="Score type" htmlFor="game-score" error={errors.scoreType}>
            <select
              id="game-score"
              value={scoreType}
              onChange={(e) => setScoreType(e.target.value)}
              className={inputCls(errors.scoreType)}
              disabled={submitting}
            >
              <option value="">Select a score type</option>
              {options.scoreTypes.map((s) => (
                <option key={s} value={s}>
                  {SCORE_LABELS[s as Game['score_type']] ?? s}
                </option>
              ))}
            </select>
          </Field>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold text-gray-300 bg-gray-800 hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? <Spinner /> : 'Create game'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-300">
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 ${
        checked ? 'bg-purple-600' : 'bg-gray-700'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" aria-label="Loading games" aria-busy="true">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-gray-900 rounded-xl border border-gray-800 p-5 animate-pulse">
          <div className="h-5 w-2/3 bg-gray-800 rounded" />
          <div className="h-4 w-1/3 bg-gray-800 rounded mt-3" />
          <div className="h-4 w-full bg-gray-800 rounded mt-4" />
          <div className="h-8 w-full bg-gray-800 rounded mt-4" />
        </div>
      ))}
    </div>
  );
}

function inputCls(err?: string) {
  return `w-full rounded-lg px-3 py-2.5 bg-gray-800 border text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors ${
    err ? 'border-red-500' : 'border-gray-700 hover:border-gray-600'
  }`;
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function GamepadIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="6" y1="11" x2="10" y2="11" />
      <line x1="8" y1="9" x2="8" y2="13" />
      <line x1="15" y1="12" x2="15.01" y2="12" />
      <line x1="18" y1="10" x2="18.01" y2="10" />
      <rect x="2" y="6" width="20" height="12" rx="2" />
    </svg>
  );
}

function ScoreIcon({ type }: { type: Game['score_type'] }) {
  if (type === 'time') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 3" />
      </svg>
    );
  }
  if (type === 'win_loss') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" />
        <path d="M7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3M10 18h4M9 21h6" />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 19V5M4 19h16M8 19v-6M12 19V9M16 19v-9" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}
