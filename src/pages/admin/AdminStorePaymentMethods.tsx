import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Smartphone,
  Trash2,
  X,
} from 'lucide-react';

import { supabase } from '../../lib/supabase';
import { useToast } from '../../hooks/useToast';

interface PaymentMethod {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  account_number: string;
  account_type: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface PaymentMethodForm {
  name: string;
  slug: string;
  description: string;
  account_number: string;
  account_type: string;
  is_active: boolean;
  sort_order: string;
}

const EMPTY_FORM: PaymentMethodForm = {
  name: '',
  slug: '',
  description: '',
  account_number: '',
  account_type: 'Send Money',
  is_active: true,
  sort_order: '0',
};

function makeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function statusClass(active: boolean) {
  return active
    ? 'border-green-500/20 bg-green-500/10 text-green-400'
    : 'border-red-500/20 bg-red-500/10 text-red-400';
}

export const AdminStorePaymentMethods: React.FC = () => {
  const { showToast } = useToast();

  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [editorOpen, setEditorOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] =
    useState<PaymentMethodForm>(EMPTY_FORM);

  const loadMethods = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('store_payment_methods')
      .select('*')
      .order('sort_order', {
        ascending: true,
      })
      .order('created_at', {
        ascending: true,
      });

    if (error) {
      showToast(
        'Payment Methods Error',
        error.message,
        'error'
      );

      setMethods([]);
    } else {
      setMethods(
        (data || []) as PaymentMethod[]
      );
    }

    setLoading(false);
  };

  useEffect(() => {
    loadMethods();
  }, []);

  const refresh = async () => {
    setRefreshing(true);
    await loadMethods();
    setRefreshing(false);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setEditorOpen(true);
  };

  const openEdit = (
    method: PaymentMethod
  ) => {
    setEditingId(method.id);

    setForm({
      name: method.name,
      slug: method.slug,
      description:
        method.description || '',
      account_number:
        method.account_number,
      account_type:
        method.account_type ||
        'Send Money',
      is_active: method.is_active,
      sort_order: String(
        method.sort_order
      ),
    });

    setEditorOpen(true);
  };

  const saveMethod = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    const name = form.name.trim();
    const accountNumber =
      form.account_number.trim();

    if (!name) {
      showToast(
        'Payment Method Error',
        'Payment method name is required.',
        'error'
      );
      return;
    }

    if (!accountNumber) {
      showToast(
        'Payment Method Error',
        'Payment number is required.',
        'error'
      );
      return;
    }

    const slug =
      form.slug.trim() ||
      makeSlug(name);

    if (!slug) {
      showToast(
        'Payment Method Error',
        'A valid slug is required.',
        'error'
      );
      return;
    }

    const sortOrder =
      Number(form.sort_order);

    if (
      Number.isNaN(sortOrder) ||
      sortOrder < 0
    ) {
      showToast(
        'Payment Method Error',
        'Sort order must be a valid number.',
        'error'
      );
      return;
    }

    setSaving(true);

    const payload = {
      name,
      slug,
      description:
        form.description.trim() ||
        null,
      account_number:
        accountNumber,
      account_type:
        form.account_type.trim() ||
        'Send Money',
      is_active:
        form.is_active,
      sort_order: sortOrder,
    };

    const result = editingId
      ? await supabase
          .from(
            'store_payment_methods'
          )
          .update(payload)
          .eq('id', editingId)
      : await supabase
          .from(
            'store_payment_methods'
          )
          .insert(payload);

    if (result.error) {
      showToast(
        'Payment Method Error',
        result.error.message,
        'error'
      );

      setSaving(false);
      return;
    }

    showToast(
      'Success',
      editingId
        ? 'Payment method updated successfully.'
        : 'Payment method added successfully.',
      'success'
    );

    setSaving(false);
    setEditorOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);

    await loadMethods();
  };

  const toggleMethod = async (
    method: PaymentMethod
  ) => {
    const { error } = await supabase
      .from('store_payment_methods')
      .update({
        is_active:
          !method.is_active,
      })
      .eq('id', method.id);

    if (error) {
      showToast(
        'Update Failed',
        error.message,
        'error'
      );
      return;
    }

    showToast(
      'Payment Method Updated',
      `${method.name} is now ${
        method.is_active
          ? 'inactive'
          : 'active'
      }.`,
      'success'
    );

    await loadMethods();
  };

  const deleteMethod = async (
    method: PaymentMethod
  ) => {
    const confirmed =
      window.confirm(
        `Delete payment method "${method.name}"?`
      );

    if (!confirmed) {
      return;
    }

    const { error } = await supabase
      .from(
        'store_payment_methods'
      )
      .delete()
      .eq('id', method.id);

    if (error) {
      showToast(
        'Delete Failed',
        error.message,
        'error'
      );
      return;
    }

    showToast(
      'Payment Method Deleted',
      `${method.name} was deleted.`,
      'success'
    );

    await loadMethods();
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-purple-400">
            Store Settings
          </p>

          <h2 className="mt-2 text-2xl font-black text-white">
            Payment Methods
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            Manage bKash, Nagad, Rocket and
            future payment methods used by
            customers during checkout.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={refresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-slate-300 hover:bg-white/[0.07] disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                refreshing
                  ? 'animate-spin'
                  : ''
              }`}
            />

            Refresh
          </button>

          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-purple-900/20 hover:bg-purple-500"
          >
            <Plus className="h-4 w-4" />

            Add Payment Method
          </button>
        </div>
      </div>

      {/* INFO */}
      <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-5">
        <div className="flex items-start gap-3">
          <Smartphone className="mt-0.5 h-5 w-5 shrink-0 text-purple-400" />

          <div>
            <p className="font-bold text-white">
              Manual Payment System
            </p>

            <p className="mt-1 text-sm leading-6 text-slate-400">
              Customers will select one of
              these payment methods during
              checkout. The selected payment
              number and payment instructions
              will be shown automatically.
            </p>
          </div>
        </div>
      </div>

      {/* METHODS */}
      {loading ? (
        <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin text-purple-400" />

            Loading Payment Methods...
          </div>
        </div>
      ) : methods.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-12 text-center">
          <Smartphone className="mx-auto h-10 w-10 text-slate-700" />

          <p className="mt-4 text-sm text-slate-500">
            No payment methods found.
          </p>

          <button
            type="button"
            onClick={openCreate}
            className="mt-4 rounded-xl bg-purple-600 px-5 py-3 text-sm font-bold text-white hover:bg-purple-500"
          >
            Add First Payment Method
          </button>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {methods.map((method) => (
            <div
              key={method.id}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
            >
              {/* CARD HEADER */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-purple-500/20 bg-purple-500/10">
                    <Smartphone className="h-5 w-5 text-purple-400" />
                  </div>

                  <div>
                    <h3 className="font-black text-white">
                      {method.name}
                    </h3>

                    <p className="mt-1 text-xs text-slate-600">
                      {method.slug}
                    </p>
                  </div>
                </div>

                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${statusClass(
                    method.is_active
                  )}`}
                >
                  {method.is_active ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : (
                    <EyeOff className="h-3 w-3" />
                  )}

                  {method.is_active
                    ? 'Active'
                    : 'Inactive'}
                </span>
              </div>

              {/* NUMBER */}
              <div className="mt-5 rounded-xl border border-white/5 bg-black/20 p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                  Payment Number
                </p>

                <p className="mt-2 font-mono text-xl font-black tracking-wide text-white">
                  {method.account_number}
                </p>

                <p className="mt-1 text-xs text-purple-400">
                  {method.account_type}
                </p>
              </div>

              {/* DESCRIPTION */}
              <div className="mt-4 min-h-[52px]">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                  Description
                </p>

                <p className="mt-2 text-sm leading-5 text-slate-400">
                  {method.description ||
                    'No description added.'}
                </p>
              </div>

              {/* SORT */}
              <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
                <span className="text-xs text-slate-600">
                  Sort Order
                </span>

                <span className="text-sm font-bold text-white">
                  {method.sort_order}
                </span>
              </div>

              {/* ACTIONS */}
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    openEdit(method)
                  }
                  className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-white/[0.06] hover:text-white"
                >
                  <Pencil className="h-3.5 w-3.5" />

                  Edit
                </button>

                <button
                  type="button"
                  onClick={() =>
                    toggleMethod(method)
                  }
                  className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-white/[0.06] hover:text-white"
                >
                  {method.is_active ? (
                    <>
                      <EyeOff className="h-3.5 w-3.5" />
                      Disable
                    </>
                  ) : (
                    <>
                      <Eye className="h-3.5 w-3.5" />
                      Activate
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    deleteMethod(method)
                  }
                  className="inline-flex items-center gap-2 rounded-lg border border-red-500/10 px-3 py-2 text-xs font-bold text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />

                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* EDITOR MODAL */}
      {editorOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-[#0b0b12] shadow-2xl">
            {/* MODAL HEADER */}
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <div>
                <h2 className="text-lg font-black text-white">
                  {editingId
                    ? 'Edit Payment Method'
                    : 'Add Payment Method'}
                </h2>

                <p className="mt-1 text-xs text-slate-600">
                  Configure the payment
                  method customers will see.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!saving) {
                    setEditorOpen(false);
                  }
                }}
                className="rounded-lg p-2 text-slate-500 hover:bg-white/[0.05] hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* FORM */}
            <form
              onSubmit={saveMethod}
              className="max-h-[calc(92vh-100px)] overflow-y-auto p-6"
            >
              <div className="space-y-5">
                {/* NAME + SLUG */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                      Payment Method Name *
                    </span>

                    <input
                      value={form.name}
                      onChange={(event) =>
                        setForm(
                          (current) => ({
                            ...current,
                            name: event
                              .target
                              .value,
                            slug: editingId
                              ? current.slug
                              : makeSlug(
                                  event
                                    .target
                                    .value
                                ),
                          })
                        )
                      }
                      placeholder="bKash"
                      className={inputClass}
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                      Slug *
                    </span>

                    <input
                      value={form.slug}
                      onChange={(event) =>
                        setForm(
                          (current) => ({
                            ...current,
                            slug: makeSlug(
                              event
                                .target
                                .value
                            ),
                          })
                        )
                      }
                      placeholder="bkash"
                      className={`${inputClass} font-mono`}
                    />
                  </label>
                </div>

                {/* NUMBER + TYPE */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                      Payment Number *
                    </span>

                    <input
                      value={
                        form.account_number
                      }
                      onChange={(event) =>
                        setForm(
                          (current) => ({
                            ...current,
                            account_number:
                              event
                                .target
                                .value,
                          })
                        )
                      }
                      placeholder="01326566544"
                      className={`${inputClass} font-mono`}
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                      Payment Type
                    </span>

                    <input
                      value={
                        form.account_type
                      }
                      onChange={(event) =>
                        setForm(
                          (current) => ({
                            ...current,
                            account_type:
                              event
                                .target
                                .value,
                          })
                        )
                      }
                      placeholder="Send Money"
                      className={inputClass}
                    />
                  </label>
                </div>

                {/* DESCRIPTION */}
                <label className="block">
                  <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Description
                  </span>

                  <textarea
                    value={
                      form.description
                    }
                    onChange={(event) =>
                      setForm(
                        (current) => ({
                          ...current,
                          description:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    rows={4}
                    placeholder="Send Money to this bKash number. Use your own bKash account and enter the transaction ID below."
                    className={textareaClass}
                  />
                </label>

                {/* SORT */}
                <label className="block">
                  <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Sort Order
                  </span>

                  <input
                    type="number"
                    min="0"
                    value={
                      form.sort_order
                    }
                    onChange={(event) =>
                      setForm(
                        (current) => ({
                          ...current,
                          sort_order:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    className={inputClass}
                  />

                  <p className="mt-1 text-[11px] text-slate-600">
                    Lower number appears first.
                  </p>
                </label>

                {/* ACTIVE */}
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <input
                    type="checkbox"
                    checked={
                      form.is_active
                    }
                    onChange={(event) =>
                      setForm(
                        (current) => ({
                          ...current,
                          is_active:
                            event
                              .target
                              .checked,
                        })
                      )
                    }
                    className="h-4 w-4 accent-purple-500"
                  />

                  <div>
                    <p className="text-sm font-bold text-white">
                      Payment Method Active
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Active methods will be
                      available to customers
                      during checkout.
                    </p>
                  </div>
                </label>

                {/* ACTIONS */}
                <div className="flex justify-end gap-2 border-t border-white/10 pt-5">
                  <button
                    type="button"
                    onClick={() =>
                      setEditorOpen(false)
                    }
                    disabled={saving}
                    className="rounded-xl border border-white/10 px-5 py-3 text-sm font-bold text-slate-400 hover:text-white disabled:opacity-40"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-3 text-sm font-bold text-white hover:bg-purple-500 disabled:opacity-50"
                  >
                    {saving && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}

                    {editingId
                      ? 'Save Changes'
                      : 'Add Payment Method'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const inputClass =
  'w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-purple-500/40 focus:ring-2 focus:ring-purple-500/10';

const textareaClass =
  'w-full resize-none rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-purple-500/40 focus:ring-2 focus:ring-purple-500/10';