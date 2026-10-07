import { useState } from 'react';
import { useEntries } from '../db';
import type { useLibrary } from '../db';
import type { Entry, MealType } from '../types';
import { MEAL_TYPES } from '../types';
import { fmt, macroLine, prettyDate, shiftDate, sum, todayStr } from '../util';
import { AddSheet } from './AddSheet';
import { ItemForm } from './ItemForm';
import { Sheet } from './Sheet';

type Lib = ReturnType<typeof useLibrary>;

function Bar({ label, value, target, unit }: { label: string; value: number; target: number | null; unit: string }) {
  const pct = target ? Math.min(100, (value / target) * 100) : 0;
  const over = target !== null && value > target;
  return (
    <div className="macro">
      <div className="macro-head">
        <span>{label}</span>
        <span>
          {fmt(value)}
          {target ? ` / ${target}` : ''}
          {unit}
        </span>
      </div>
      {target ? (
        <div className="track">
          <div className={`fill ${over ? 'over' : ''}`} style={{ width: `${pct}%` }} />
        </div>
      ) : null}
      {target ? <div className="macro-left">{over ? `${fmt(value - target)}${unit} over` : `${fmt(target - value)}${unit} left`}</div> : null}
    </div>
  );
}

export function Today({ lib, date, setDate }: { lib: Lib; date: string; setDate: (d: string) => void }) {
  const { entries, addEntries, updateEntry, deleteEntry, copyFrom, loading } = useEntries(date);
  const [adding, setAdding] = useState<MealType | null>(null);
  const [editing, setEditing] = useState<Entry | null>(null);
  const [error, setError] = useState('');

  const guard = async (fn: () => Promise<unknown>) => {
    try {
      setError('');
      await fn();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const total = sum(entries);
  const { settings } = lib;
  const remaining = settings.kcal_target - total.kcal;
  const pct = Math.min(100, (total.kcal / settings.kcal_target) * 100);

  const saveAsRecipe = (mt: MealType) =>
    guard(async () => {
      const list = entries.filter((e) => e.meal_type === mt);
      const usable = list.filter((e) => e.food_id && (e.grams || e.pieces));
      if (usable.length === 0) {
        window.alert('Only foods with grams or pieces can go in a recipe. Quick entries are skipped.');
        return;
      }
      const label = MEAL_TYPES.find((m) => m.id === mt)!.label;
      const skipped = list.length - usable.length;
      const name = window.prompt(`Save ${usable.length} items as a recipe${skipped ? ` (${skipped} skipped)` : ''}. Name:`, label);
      if (!name?.trim()) return;
      await lib.saveRecipe({
        name: name.trim(),
        meal_type: mt,
        items: usable.map((e) => ({ food_id: e.food_id!, amount: (e.grams ?? e.pieces)! })),
      });
    });

  return (
    <div className="page">
      <div className="datebar">
        <button className="icon-btn" onClick={() => setDate(shiftDate(date, -1))} aria-label="Previous day">‹</button>
        <button className="date-title" onClick={() => setDate(todayStr())}>{prettyDate(date)}</button>
        <button className="icon-btn" onClick={() => setDate(shiftDate(date, 1))} aria-label="Next day">›</button>
      </div>

      <section className="card summary">
        <div className="big">
          <span className={remaining < 0 ? 'neg' : ''}>{fmt(Math.abs(remaining))}</span>
          <small>{remaining < 0 ? 'kcal over target' : 'kcal remaining'}</small>
        </div>
        <div className="track">
          <div className={`fill ${remaining < 0 ? 'over' : ''}`} style={{ width: `${pct}%` }} />
        </div>
        <div className="muted small-text">
          {fmt(total.kcal)} eaten of {settings.kcal_target}
        </div>
        <div className="macros">
          <Bar label="Protein" value={total.protein} target={settings.protein_target} unit="g" />
          <Bar label="Carbs" value={total.carbs} target={settings.carbs_target} unit="g" />
          <Bar label="Fat" value={total.fat} target={settings.fat_target} unit="g" />
          <Bar label="Fibre" value={total.fibre} target={settings.fibre_target} unit="g" />
        </div>
      </section>

      {error && <p className="error">{error}</p>}

      {MEAL_TYPES.map(({ id, label }) => {
        const list = entries.filter((e) => e.meal_type === id);
        const t = sum(list);
        return (
          <section className="card" key={id}>
            <div className="card-head">
              <h2>{label}</h2>
              <span className="muted">{fmt(t.kcal)} kcal</span>
            </div>
            <ul className="list">
              {list.map((e) => (
                <li key={e.id}>
                  <button className="list-main" onClick={() => setEditing(e)}>
                    <span className="name">
                      {e.name}
                      {e.grams ? <span className="muted"> · {fmt(e.grams)} g</span> : null}
                      {e.pieces ? <span className="muted"> · {fmt(e.pieces)} {e.pieces === 1 ? 'pc' : 'pcs'}</span> : null}
                    </span>
                    <span className="sub">
                      {macroLine(e)}
                    </span>
                  </button>
                  <span className="kcal">{fmt(e.kcal)}</span>
                </li>
              ))}
            </ul>
            {!loading && list.length === 0 && <p className="muted small-text">Nothing logged.</p>}
            <div className="row">
              <button className="btn primary grow" onClick={() => setAdding(id)}>+ Add</button>
              {list.length === 0 ? (
                <button className="btn" onClick={() => guard(() => copyFrom(shiftDate(date, -1), id))}>Copy yesterday</button>
              ) : (
                <button className="btn" onClick={() => saveAsRecipe(id)}>Save as recipe</button>
              )}
            </div>
          </section>
        );
      })}

      {adding && (
        <AddSheet
          mealType={adding}
          foods={lib.foods}
          recipes={lib.recipes}
          onAdd={(items) => addEntries(items, adding)}
          onUsed={lib.bumpUse}
          onClose={() => setAdding(null)}
        />
      )}

      {editing && <EditEntry entry={editing} onClose={() => setEditing(null)} onSave={(p) => guard(() => updateEntry(editing.id, p))} onDelete={() => guard(() => deleteEntry(editing.id))} />}
    </div>
  );
}

function EditEntry({ entry, onSave, onDelete, onClose }: {
  entry: Entry;
  onSave: (p: Partial<Entry>) => Promise<unknown>;
  onDelete: () => Promise<unknown>;
  onClose: () => void;
}) {
  const [mt, setMt] = useState<MealType>(entry.meal_type);
  return (
    <Sheet title="Edit entry" onClose={onClose}>
      <ItemForm
        initial={entry}
        submitLabel="Save"
        onSubmit={async (item) => {
          await onSave({ ...item, meal_type: mt });
          onClose();
        }}
        onDelete={async () => {
          await onDelete();
          onClose();
        }}
        extra={
          <>
            <label>
              Meal
              <select value={mt} onChange={(e) => setMt(e.target.value as MealType)}>
                {MEAL_TYPES.map((m) => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </select>
            </label>
          </>
        }
      />
    </Sheet>
  );
}
