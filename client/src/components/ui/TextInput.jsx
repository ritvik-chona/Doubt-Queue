import { useState } from 'react';
import { inputClass } from '../Field.jsx';
import { Eye, EyeOff } from '../Icons.jsx';

// Input with a leading icon. Pass any normal <input> props.
export function IconInput({ icon: LeadingIcon, error, className = '', ...props }) {
  return (
    <div className="relative">
      {LeadingIcon && (
        <LeadingIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-subtle" />
      )}
      <input className={`${inputClass(error)} ${LeadingIcon ? 'pl-9' : ''} h-11 ${className}`} {...props} />
    </div>
  );
}

// Password field with a show/hide toggle. Visibility is purely local UI state.
export function PasswordInput({ icon, error, ...props }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <IconInput icon={icon} error={error} type={visible ? 'text' : 'password'} className="pr-10" {...props} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute top-1/2 right-1.5 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-md text-subtle hover:bg-raised hover:text-fg"
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}
