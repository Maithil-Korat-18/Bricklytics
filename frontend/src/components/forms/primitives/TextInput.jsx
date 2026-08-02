import React from 'react';
import { useFormContext } from 'react-hook-form';

export default function TextInput({
  name,
  label,
  placeholder,
  required = false,
  helperText,
  type = 'text',
  ...props
}) {
  const {
    register,
    formState: { errors, touchedFields },
  } = useFormContext();

  const error = errors[name];
  const isTouched = touchedFields[name];

  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        type={type}
        {...register(name)}
        placeholder={placeholder}
        className={`
          w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-800 placeholder-slate-400 
          focus:outline-none focus:ring-2 transition-all
          ${error 
            ? 'border-red-500 ring-2 ring-red-500/20 focus:border-red-500' 
            : isTouched 
              ? 'border-emerald-500 focus:ring-emerald-500/20' 
              : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500'}
        `}
        {...props}
      />
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
