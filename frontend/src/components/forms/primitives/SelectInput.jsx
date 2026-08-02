import React from 'react';
import { useFormContext } from 'react-hook-form';

export default function SelectInput({
  name,
  label,
  options = [],
  required = false,
  helperText,
}) {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  const error = errors[name];

  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <select
        {...register(name)}
        className={`
          w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-800 
          focus:outline-none focus:ring-2 transition-all
          ${error 
            ? 'border-red-500 ring-2 ring-red-500/20 focus:border-red-500' 
            : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500'}
        `}
      >
        {options.map((opt) => (
          <option key={opt.value || opt} value={opt.value || opt}>
            {opt.label || opt}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-xs text-red-500 mt-1 font-medium animate-fadeIn">
          {error.message}
        </p>
      )}
      {!error && helperText && (
        <p className="text-xs text-slate-400 mt-1">{helperText}</p>
      )}
    </div>
  );
}
