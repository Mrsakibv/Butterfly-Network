import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Send,
  AlertCircle,
} from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';
import { useRouter } from '../hooks/useRouter';

type ApplicationPost = {
  id: string;
  title: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  icon: string | null;
  image_url: string | null;
};

type ApplicationField = {
  id: string;
  post_id: string;
  field_key: string;
  field_label: string;
  field_type: string;
  placeholder: string | null;
  description: string | null;
  options: string[];
  is_required: boolean;
  is_active: boolean;
  sort_order: number;
};

export function ApplicationFormPage() {
  const { navigate } = useRouter();

  const [post, setPost] = useState<ApplicationPost | null>(null);
  const [fields, setFields] = useState<ApplicationField[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>({});

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const postSlug = useMemo(() => {
    if (typeof window === 'undefined') return '';

    return (
      new URLSearchParams(window.location.search).get('post') || ''
    );
  }, []);

  useEffect(() => {
    loadApplication();
  }, [postSlug]);

  const loadApplication = async () => {
    setLoading(true);
    setError('');
    setPost(null);
    setFields([]);
    setAnswers({});

    if (!postSlug) {
      setError('No application post was selected.');
      setLoading(false);
      return;
    }

    try {
      const { data: postData, error: postError } = await supabase
        .from('application_posts')
        .select(
          'id,title,slug,short_description,description,icon,image_url'
        )
        .eq('slug', postSlug)
        .eq('is_active', true)
        .maybeSingle();

      if (postError) {
        throw postError;
      }

      if (!postData) {
        setError('This application post is no longer available.');
        setLoading(false);
        return;
      }

      const { data: fieldData, error: fieldError } = await supabase
        .from('application_form_fields')
        .select(
          'id,post_id,field_key,field_label,field_type,placeholder,description,options,is_required,is_active,sort_order'
        )
        .eq('post_id', postData.id)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (fieldError) {
        throw fieldError;
      }

      const normalizedFields: ApplicationField[] = (
        fieldData || []
      ).map((field: any) => ({
        id: field.id,
        post_id: field.post_id,
        field_key: field.field_key,
        field_label: field.field_label,
        field_type: field.field_type,
        placeholder: field.placeholder ?? null,
        description: field.description ?? null,
        options: Array.isArray(field.options)
          ? field.options
          : [],
        is_required: Boolean(field.is_required),
        is_active: Boolean(field.is_active),
        sort_order: Number(field.sort_order ?? 0),
      }));

      const initialAnswers: Record<string, any> = {};

      normalizedFields.forEach((field) => {
        initialAnswers[field.id] =
          field.field_type === 'checkbox' ? false : '';
      });

      setPost(postData as ApplicationPost);
      setFields(normalizedFields);
      setAnswers(initialAnswers);
    } catch (err: any) {
      console.error('Application load error:', err);

      setError(
        err?.message || 'Failed to load the application form.'
      );
    } finally {
      setLoading(false);
    }
  };

  const updateAnswer = (fieldId: string, value: any) => {
    setAnswers((current) => ({
      ...current,
      [fieldId]: value,
    }));

    if (error) {
      setError('');
    }
  };

  const isEmptyAnswer = (value: any) => {
    if (typeof value === 'boolean') {
      return value === false;
    }

    if (Array.isArray(value)) {
      return value.length === 0;
    }

    return String(value ?? '').trim() === '';
  };

  const validateField = (field: ApplicationField) => {
    const value = answers[field.id];

    if (field.is_required && isEmptyAnswer(value)) {
      return `Please fill in: ${field.field_label}`;
    }

    if (isEmptyAnswer(value)) {
      return '';
    }

    const stringValue = String(value).trim();

    if (
      field.field_type === 'email' &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(stringValue)
    ) {
      return `Please enter a valid email address for: ${field.field_label}`;
    }

    if (
      field.field_type === 'url' &&
      !/^https?:\/\/.+/i.test(stringValue)
    ) {
      return `Please enter a valid URL for: ${field.field_label}`;
    }

    if (
      field.field_type === 'number' &&
      Number.isNaN(Number(stringValue))
    ) {
      return `Please enter a valid number for: ${field.field_label}`;
    }

    return '';
  };

  const validateForm = () => {
    for (const field of fields) {
      const fieldError = validateField(field);

      if (fieldError) {
        return fieldError;
      }
    }

    return '';
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!post) {
      return;
    }

    setError('');

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);

    let createdApplicationId: string | null = null;

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        navigate('/login-required');
        return;
      }

      const {
        data: existingApplication,
        error: existingError,
      } = await supabase
        .from('applications')
        .select('id,status')
        .eq('user_id', user.id)
        .eq('post_id', post.id)
        .in('status', ['pending', 'reviewing'])
        .maybeSingle();

      if (existingError) {
        throw existingError;
      }

      if (existingApplication) {
        setError(
          'You already have an active application for this position.'
        );
        return;
      }

      const {
        data: application,
        error: applicationError,
      } = await supabase
        .from('applications')
        .insert({
          user_id: user.id,
          post_id: post.id,
          status: 'pending',
        })
        .select('id')
        .single();

      if (applicationError) {
        throw applicationError;
      }

      if (!application) {
        throw new Error(
          'Application could not be created.'
        );
      }

      createdApplicationId = application.id;

      const answerRows = fields.map((field) => ({
        application_id: application.id,
        field_id: field.id,
        answer:
          answers[field.id] === undefined
            ? null
            : answers[field.id],
      }));

      if (answerRows.length > 0) {
        const { error: answersError } = await supabase
          .from('application_answers')
          .insert(answerRows);

        if (answersError) {
          /*
           * Try to remove the newly created application.
           * If RLS prevents deletion, the original error
           * is still reported to the user.
           */
          await supabase
            .from('applications')
            .delete()
            .eq('id', application.id);

          throw answersError;
        }
      }

      setSuccess(true);
    } catch (err: any) {
      console.error('Application submit error:', err);

      /*
       * Extra safety:
       * If something failed after application creation,
       * try one more rollback attempt.
       */
      if (createdApplicationId) {
        await supabase
          .from('applications')
          .delete()
          .eq('id', createdApplicationId);
      }

      setError(
        err?.message ||
          'Failed to submit your application. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (field: ApplicationField) => {
    const value = answers[field.id];

    const commonClassName =
      'mt-2 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-purple-500/60 focus:bg-white/[0.06]';

    if (field.field_type === 'textarea') {
      return (
        <textarea
          value={value || ''}
          onChange={(event) =>
            updateAnswer(
              field.id,
              event.target.value
            )
          }
          placeholder={field.placeholder || ''}
          rows={5}
          className={`${commonClassName} resize-y`}
        />
      );
    }

    if (field.field_type === 'select') {
      return (
        <select
          value={value || ''}
          onChange={(event) =>
            updateAnswer(
              field.id,
              event.target.value
            )
          }
          className={commonClassName}
        >
          <option value="">
            Select an option
          </option>

          {(field.options || []).map(
            (option, index) => (
              <option
                key={`${option}-${index}`}
                value={option}
              >
                {option}
              </option>
            )
          )}
        </select>
      );
    }

    if (field.field_type === 'radio') {
      return (
        <div className="mt-3 space-y-3">
          {(field.options || []).map(
            (option, index) => (
              <label
                key={`${option}-${index}`}
                className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 transition hover:bg-white/[0.06]"
              >
                <input
                  type="radio"
                  name={field.id}
                  value={option}
                  checked={value === option}
                  onChange={(event) =>
                    updateAnswer(
                      field.id,
                      event.target.value
                    )
                  }
                  className="h-4 w-4 accent-purple-500"
                />

                <span className="text-sm text-slate-200">
                  {option}
                </span>
              </label>
            )
          )}
        </div>
      );
    }

    if (field.field_type === 'checkbox') {
      return (
        <label className="mt-3 flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 transition hover:bg-white/[0.06]">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(event) =>
              updateAnswer(
                field.id,
                event.target.checked
              )
            }
            className="h-4 w-4 accent-purple-500"
          />

          <span className="text-sm text-slate-200">
            {field.placeholder ||
              field.field_label}
          </span>
        </label>
      );
    }

    const inputType = [
      'number',
      'email',
      'url',
      'date',
    ].includes(field.field_type)
      ? field.field_type
      : 'text';

    return (
      <input
        type={inputType}
        value={value || ''}
        onChange={(event) =>
          updateAnswer(
            field.id,
            event.target.value
          )
        }
        placeholder={field.placeholder || ''}
        className={commonClassName}
      />
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen px-4 pb-24 pt-36 text-white">
        <div className="mx-auto flex max-w-3xl items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
        </div>
      </div>
    );
  }

  if (error && !post) {
    return (
      <div className="min-h-screen px-4 pb-24 pt-36 text-white">
        <div className="mx-auto max-w-2xl text-center">
          <AlertCircle className="mx-auto mb-5 h-12 w-12 text-red-400" />

          <h1 className="text-2xl font-bold">
            Application Unavailable
          </h1>

          <p className="mt-3 text-slate-400">
            {error}
          </p>

          <button
            onClick={() => navigate('/apply')}
            className="mt-7 rounded-xl bg-purple-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-purple-500"
          >
            Back to Apply
          </button>
        </div>
      </div>
    );
  }

  if (!post) {
    return null;
  }

  if (success) {
    return (
      <div className="min-h-screen px-4 pb-24 pt-36 text-white">
        <motion.div
          initial={{
            opacity: 0,
            y: 20,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="mx-auto max-w-2xl rounded-3xl border border-emerald-400/20 bg-emerald-500/[0.06] p-8 text-center shadow-2xl"
        >
          <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-400" />

          <h1 className="mt-6 text-3xl font-bold">
            Application Submitted
          </h1>

          <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-slate-400">
            Your application for{' '}
            <span className="font-semibold text-white">
              {post.title}
            </span>{' '}
            has been submitted successfully.
          </p>

          <p className="mt-3 text-sm text-slate-500">
            Our team will review your application and
            update its status.
          </p>

          <button
            onClick={() => navigate('/apply')}
            className="mt-8 rounded-xl bg-purple-600 px-7 py-3 text-sm font-semibold text-white transition hover:bg-purple-500"
          >
            Back to Apply
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 pb-24 pt-32 text-white">
      <div className="mx-auto max-w-4xl">
        <button
          onClick={() => navigate('/apply')}
          className="mb-8 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Available Positions
        </button>

        <div className="mb-10">
          <div className="mb-4 inline-flex rounded-full border border-purple-500/20 bg-purple-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-purple-300">
            Application
          </div>

          <h1 className="text-4xl font-black tracking-tight md:text-5xl">
            {post.title}
          </h1>

          {post.short_description && (
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-400">
              {post.short_description}
            </p>
          )}
        </div>

        {post.description && (
          <div className="mb-8 rounded-2xl border border-white/10 bg-white/[0.025] p-6">
            <p className="whitespace-pre-line text-sm leading-7 text-slate-300">
              {post.description}
            </p>
          </div>
        )}

        {fields.length === 0 ? (
          <div className="rounded-3xl border border-yellow-400/20 bg-yellow-500/[0.05] p-8 text-center">
            <AlertCircle className="mx-auto h-10 w-10 text-yellow-400" />

            <h2 className="mt-4 text-xl font-bold text-white">
              Application Form Not Available
            </h2>

            <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-400">
              This position does not have any active
              application fields yet. Please check back later.
            </p>

            <button
              onClick={() => navigate('/apply')}
              className="mt-6 rounded-xl bg-purple-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-purple-500"
            >
              Back to Available Positions
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-5 shadow-2xl md:p-8">
              <div className="mb-8">
                <h2 className="text-xl font-bold">
                  Application Form
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  Please provide accurate information.
                  Fields marked with{' '}
                  <span className="text-red-400">
                    *
                  </span>{' '}
                  are required.
                </p>
              </div>

              <div className="space-y-7">
                {fields.map((field) => (
                  <div key={field.id}>
                    <label className="block text-sm font-semibold text-slate-200">
                      {field.field_label}

                      {field.is_required && (
                        <span className="ml-1 text-red-400">
                          *
                        </span>
                      )}
                    </label>

                    {field.description && (
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        {field.description}
                      </p>
                    )}

                    {renderField(field)}
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-3 rounded-xl border border-red-400/20 bg-red-500/[0.06] px-4 py-3 text-sm text-red-300">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 px-6 py-4 text-sm font-bold text-white shadow-lg shadow-purple-900/20 transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-5 w-5" />
                  Submit Application
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}