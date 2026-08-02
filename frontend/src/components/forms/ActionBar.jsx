import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Save, Eye, CheckCircle2, X, RefreshCw } from 'lucide-react';

export default function ActionBar({ onReset }) {
  const {
    formState: { isSubmitting, isDirty, isValid },
  } = useFormContext();

  return (
    <div className="sticky bottom-0 z-40 bg-white/90 backdrop-blur-md border-t border-slate-200/80 p-4 shadow-3d-float">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs text-slate-500 hidden sm:flex items-center space-x-2">
          <span className={`w-2 h-2 rounded-full ${isDirty ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
          <span>{isDirty ? 'Unsaved changes' : 'All changes saved'}</span>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={onReset}
            disabled={isSubmitting}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold transition-colors flex items-center space-x-1.5 disabled:opacity-50"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <button
            type="button"
            onClick={() => alert('Draft state saved locally')}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold transition-colors shadow-xs flex items-center space-x-1.5 disabled:opacity-50"
          >
            <Save className="w-4 h-4 text-slate-500" />
            <span>Save Draft</span>
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all flex items-center space-x-1.5"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Publishing...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Publish Property</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
