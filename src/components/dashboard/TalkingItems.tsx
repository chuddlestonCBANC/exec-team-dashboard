'use client';

import { useState } from 'react';
import { TalkingItem, TalkingItemPriority, TalkingItemStatus, Executive } from '@/types';
import { formatRelativeTime } from '@/lib/utils/formatting';
import {
  Plus,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  Trash2,
  Edit2,
  X,
} from 'lucide-react';

interface TalkingItemsProps {
  items: TalkingItem[];
  executives: Executive[];
  onAddItem: (item: Omit<TalkingItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateItem: (id: string, updates: Partial<TalkingItem>) => void;
  onDeleteItem: (id: string) => void;
}

export function TalkingItems({
  items,
  executives,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
}: TalkingItemsProps) {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<string | null>(null);

  const openItems = items.filter((item) => item.status === 'open');
  const discussedItems = items.filter((item) => item.status === 'discussed');
  const deferredItems = items.filter((item) => item.status === 'deferred');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[var(--gray-900)]">Talking Items</h2>
          <p className="text-sm text-[var(--gray-500)] mt-1">
            Topics for discussion in this week&apos;s meeting
          </p>
        </div>
        <button
          onClick={() => setIsAddingNew(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-dark)] transition-colors"
        >
          <Plus size={16} />
          Add Item
        </button>
      </div>

      {/* Add New Item Form */}
      {isAddingNew && (
        <AddItemForm
          executives={executives}
          onSubmit={(item) => {
            onAddItem(item);
            setIsAddingNew(false);
          }}
          onCancel={() => setIsAddingNew(false)}
        />
      )}

      {/* Open Items */}
      <div>
        <h3 className="text-sm font-semibold text-[var(--gray-700)] uppercase tracking-wide mb-3 flex items-center gap-2">
          <MessageSquare size={16} className="text-[var(--primary)]" />
          To Discuss ({openItems.length})
        </h3>
        {openItems.length === 0 ? (
          <div className="bg-[var(--gray-50)] rounded-lg p-6 text-center">
            <p className="text-[var(--gray-500)]">No items to discuss. Add one above!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {openItems.map((item) => (
              <TalkingItemCard
                key={item.id}
                item={item}
                executives={executives}
                isExpanded={expandedItem === item.id}
                isEditing={editingItem === item.id}
                onToggleExpand={() =>
                  setExpandedItem(expandedItem === item.id ? null : item.id)
                }
                onEdit={() => setEditingItem(item.id)}
                onCancelEdit={() => setEditingItem(null)}
                onUpdate={(updates) => {
                  onUpdateItem(item.id, updates);
                  setEditingItem(null);
                }}
                onDelete={() => onDeleteItem(item.id)}
                onMarkDiscussed={() =>
                  onUpdateItem(item.id, {
                    status: 'discussed',
                    discussedAt: new Date().toISOString(),
                  })
                }
                onDefer={() =>
                  onUpdateItem(item.id, { status: 'deferred' })
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* Deferred Items */}
      {deferredItems.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-[var(--gray-700)] uppercase tracking-wide mb-3 flex items-center gap-2">
            <Clock size={16} className="text-[var(--warning)]" />
            Deferred ({deferredItems.length})
          </h3>
          <div className="space-y-3">
            {deferredItems.map((item) => (
              <TalkingItemCard
                key={item.id}
                item={item}
                executives={executives}
                isExpanded={expandedItem === item.id}
                isEditing={editingItem === item.id}
                onToggleExpand={() =>
                  setExpandedItem(expandedItem === item.id ? null : item.id)
                }
                onEdit={() => setEditingItem(item.id)}
                onCancelEdit={() => setEditingItem(null)}
                onUpdate={(updates) => {
                  onUpdateItem(item.id, updates);
                  setEditingItem(null);
                }}
                onDelete={() => onDeleteItem(item.id)}
                onMarkDiscussed={() =>
                  onUpdateItem(item.id, {
                    status: 'discussed',
                    discussedAt: new Date().toISOString(),
                  })
                }
                onReopen={() => onUpdateItem(item.id, { status: 'open' })}
              />
            ))}
          </div>
        </div>
      )}

      {/* Discussed Items */}
      {discussedItems.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-[var(--gray-700)] uppercase tracking-wide mb-3 flex items-center gap-2">
            <CheckCircle2 size={16} className="text-[var(--success)]" />
            Discussed ({discussedItems.length})
          </h3>
          <div className="space-y-3 opacity-75">
            {discussedItems.map((item) => (
              <TalkingItemCard
                key={item.id}
                item={item}
                executives={executives}
                isExpanded={expandedItem === item.id}
                isEditing={false}
                onToggleExpand={() =>
                  setExpandedItem(expandedItem === item.id ? null : item.id)
                }
                onDelete={() => onDeleteItem(item.id)}
                isDiscussed
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface AddItemFormProps {
  executives: Executive[];
  onSubmit: (item: Omit<TalkingItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

function AddItemForm({ executives, onSubmit, onCancel }: AddItemFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TalkingItemPriority>('medium');
  const [addedBy, setAddedBy] = useState(executives[0]?.id || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      addedBy,
      addedByName: executives.find((e) => e.id === addedBy)?.name,
      priority,
      status: 'open',
      weekOf: new Date().toISOString(),
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl border border-[var(--gray-200)] p-5 shadow-sm"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[var(--gray-700)] mb-1">
            Topic Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What do you want to discuss?"
            className="w-full px-3 py-2 border border-[var(--gray-200)] rounded-lg focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--gray-700)] mb-1">
            Description (optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add more context..."
            rows={3}
            className="w-full px-3 py-2 border border-[var(--gray-200)] rounded-lg focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--gray-700)] mb-1">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TalkingItemPriority)}
              className="w-full px-3 py-2 border border-[var(--gray-200)] rounded-lg focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--gray-700)] mb-1">
              Added By
            </label>
            <select
              value={addedBy}
              onChange={(e) => setAddedBy(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--gray-200)] rounded-lg focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
            >
              {executives.map((exec) => (
                <option key={exec.id} value={exec.id}>
                  {exec.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 mt-5 pt-4 border-t border-[var(--gray-100)]">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-[var(--gray-600)] hover:text-[var(--gray-800)] transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!title.trim()}
          className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-dark)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add Item
        </button>
      </div>
    </form>
  );
}

interface TalkingItemCardProps {
  item: TalkingItem;
  executives: Executive[];
  isExpanded: boolean;
  isEditing: boolean;
  isDiscussed?: boolean;
  onToggleExpand: () => void;
  onEdit?: () => void;
  onCancelEdit?: () => void;
  onUpdate?: (updates: Partial<TalkingItem>) => void;
  onDelete: () => void;
  onMarkDiscussed?: () => void;
  onDefer?: () => void;
  onReopen?: () => void;
}

function TalkingItemCard({
  item,
  executives,
  isExpanded,
  isEditing,
  isDiscussed,
  onToggleExpand,
  onEdit,
  onCancelEdit,
  onUpdate,
  onDelete,
  onMarkDiscussed,
  onDefer,
  onReopen,
}: TalkingItemCardProps) {
  const [notes, setNotes] = useState(item.notes || '');

  const priorityColors = {
    high: 'bg-red-100 text-red-700 border-red-200',
    medium: 'bg-amber-100 text-amber-700 border-amber-200',
    low: 'bg-blue-100 text-blue-700 border-blue-200',
  };

  const priorityIcons = {
    high: <AlertCircle size={12} />,
    medium: <Clock size={12} />,
    low: <MessageSquare size={12} />,
  };

  return (
    <div
      className={`bg-white rounded-xl border ${
        item.status === 'discussed'
          ? 'border-[var(--success)]/30'
          : 'border-[var(--gray-200)]'
      } overflow-hidden`}
    >
      {/* Header */}
      <div
        className="p-4 cursor-pointer hover:bg-[var(--gray-50)] transition-colors"
        onClick={onToggleExpand}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border ${
                  priorityColors[item.priority]
                }`}
              >
                {priorityIcons[item.priority]}
                {item.priority}
              </span>
              {item.status === 'discussed' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700">
                  <CheckCircle2 size={12} />
                  Discussed
                </span>
              )}
              {item.status === 'deferred' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                  <Clock size={12} />
                  Deferred
                </span>
              )}
            </div>
            <h4 className="text-[var(--gray-800)] font-medium mt-2">{item.title}</h4>
            {item.description && !isExpanded && (
              <p className="text-sm text-[var(--gray-500)] mt-1 line-clamp-1">
                {item.description}
              </p>
            )}
            <p className="text-xs text-[var(--gray-400)] mt-2">
              Added by {item.addedByName || 'Unknown'} • {formatRelativeTime(item.createdAt)}
            </p>
          </div>
          <div className="flex items-center gap-1">
            {!isDiscussed && onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="p-1.5 text-[var(--gray-400)] hover:text-[var(--primary)] hover:bg-[var(--gray-100)] rounded-lg transition-colors"
              >
                <Edit2 size={14} />
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-1.5 text-[var(--gray-400)] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 size={14} />
            </button>
            {isExpanded ? (
              <ChevronUp size={18} className="text-[var(--gray-400)]" />
            ) : (
              <ChevronDown size={18} className="text-[var(--gray-400)]" />
            )}
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-[var(--gray-100)]">
          {item.description && (
            <div className="mt-4">
              <p className="text-sm text-[var(--gray-600)] leading-relaxed">
                {item.description}
              </p>
            </div>
          )}

          {/* Notes */}
          {!isDiscussed && (
            <div className="mt-4">
              <label className="block text-xs font-medium text-[var(--gray-700)] mb-1.5">
                Meeting Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={() => onUpdate?.({ notes })}
                placeholder="Add notes from the discussion..."
                rows={2}
                className="w-full px-3 py-2 text-sm border border-[var(--gray-200)] rounded-lg focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] resize-none"
              />
            </div>
          )}

          {item.notes && isDiscussed && (
            <div className="mt-4 p-3 bg-[var(--gray-50)] rounded-lg">
              <p className="text-xs font-medium text-[var(--gray-700)] mb-1">Meeting Notes</p>
              <p className="text-sm text-[var(--gray-600)]">{item.notes}</p>
            </div>
          )}

          {/* Actions */}
          {!isDiscussed && (
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[var(--gray-100)]">
              {onMarkDiscussed && (
                <button
                  onClick={onMarkDiscussed}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-medium hover:bg-emerald-200 transition-colors"
                >
                  <CheckCircle2 size={14} />
                  Mark Discussed
                </button>
              )}
              {onDefer && item.status !== 'deferred' && (
                <button
                  onClick={onDefer}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--gray-100)] text-[var(--gray-600)] rounded-lg text-sm font-medium hover:bg-[var(--gray-200)] transition-colors"
                >
                  <Clock size={14} />
                  Defer
                </button>
              )}
              {onReopen && item.status === 'deferred' && (
                <button
                  onClick={onReopen}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--primary)]/10 text-[var(--primary)] rounded-lg text-sm font-medium hover:bg-[var(--primary)]/20 transition-colors"
                >
                  <MessageSquare size={14} />
                  Reopen
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
