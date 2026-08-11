import React from 'react';
import { cn } from '../../utils';
import { Loader2, X } from 'lucide-react';

// ─── Button ───────────────────────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ variant = 'primary', size = 'md', loading, children, className, disabled, ...props }) => {
  const variants = { primary: 'btn-primary', secondary: 'btn-secondary', danger: 'btn-danger', ghost: 'btn-ghost' };
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-6 py-3 text-base' };
  return (
    <button className={cn('btn', variants[variant], sizes[size], className)} disabled={disabled || loading} {...props}>
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
};

// ─── Input ────────────────────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ label, error, helperText, className, ...props }, ref) => (
  <div className="space-y-1">
    {label && <label className="label">{label}</label>}
    <input ref={ref} className={cn('input', error && 'border-red-500 focus:border-red-500 focus:ring-red-500', className)} {...props} />
    {error && <p className="text-xs text-red-600">{error}</p>}
    {helperText && !error && <p className="text-xs text-gray-500">{helperText}</p>}
  </div>
));
Input.displayName = 'Input';

// ─── Textarea ─────────────────────────────────────────────────────────────────
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ label, error, className, ...props }, ref) => (
  <div className="space-y-1">
    {label && <label className="label">{label}</label>}
    <textarea ref={ref} className={cn('input min-h-[100px] resize-y', error && 'border-red-500', className)} {...props} />
    {error && <p className="text-xs text-red-600">{error}</p>}
  </div>
));
Textarea.displayName = 'Textarea';

// ─── Select ───────────────────────────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({ label, error, options, placeholder, className, ...props }, ref) => (
  <div className="space-y-1">
    {label && <label className="label">{label}</label>}
    <select ref={ref} className={cn('input', error && 'border-red-500', className)} {...props}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
    {error && <p className="text-xs text-red-600">{error}</p>}
  </div>
));
Select.displayName = 'Select';

// ─── Card ─────────────────────────────────────────────────────────────────────
export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={cn('card p-6', className)}>{children}</div>
);

// ─── Badge ────────────────────────────────────────────────────────────────────
interface BadgeProps { children: React.ReactNode; variant?: string; className?: string; }
export const Badge: React.FC<BadgeProps> = ({ children, variant = 'badge-gray', className }) => (
  <span className={cn(variant, className)}>{children}</span>
);

// ─── Spinner ──────────────────────────────────────────────────────────────────
export const Spinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({ size = 'md', className }) => {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return <Loader2 className={cn('animate-spin text-primary-600', sizes[size], className)} />;
};

export const LoadingScreen: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center space-y-3">
      <Spinner size="lg" />
      <p className="text-gray-500 text-sm">Loading...</p>
    </div>
  </div>
);

// ─── Modal ────────────────────────────────────────────────────────────────────
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;
  const sizes = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-2xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className={cn('relative bg-white rounded-xl shadow-xl w-full', sizes[size])}>
        {title && (
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100"><X className="w-5 h-5" /></button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

// ─── Pagination ───────────────────────────────────────────────────────────────
interface PaginationProps {
  meta: { page: number; totalPages: number; total: number; limit: number };
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({ meta, onPageChange }) => {
  const { page, totalPages, total, limit } = meta;
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
      <p className="text-sm text-gray-600">Showing {start}–{end} of {total}</p>
      <div className="flex items-center gap-1">
        <button onClick={() => onPageChange(page - 1)} disabled={page === 1} className="btn-ghost px-3 py-1.5 text-sm disabled:opacity-40">Previous</button>
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
          return (
            <button key={p} onClick={() => onPageChange(p)} className={cn('w-8 h-8 rounded-lg text-sm font-medium', p === page ? 'bg-primary-600 text-white' : 'hover:bg-gray-100 text-gray-700')}>
              {p}
            </button>
          );
        })}
        <button onClick={() => onPageChange(page + 1)} disabled={page === totalPages} className="btn-ghost px-3 py-1.5 text-sm disabled:opacity-40">Next</button>
      </div>
    </div>
  );
};

// ─── Empty State ──────────────────────────────────────────────────────────────
export const EmptyState: React.FC<{ icon?: React.ReactNode; title: string; description?: string; action?: React.ReactNode }> = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    {icon && <div className="mb-4 text-gray-300">{icon}</div>}
    <h3 className="text-lg font-medium text-gray-900 mb-1">{title}</h3>
    {description && <p className="text-sm text-gray-500 mb-4 max-w-sm">{description}</p>}
    {action}
  </div>
);

// ─── Star Rating ──────────────────────────────────────────────────────────────
export const StarRating: React.FC<{ rating: number; max?: number; size?: 'sm' | 'md' }> = ({ rating, max = 5, size = 'md' }) => {
  const sz = size === 'sm' ? 'w-3 h-3' : 'w-5 h-5';
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <svg key={i} className={cn(sz, i < Math.round(rating) ? 'text-yellow-400' : 'text-gray-200')} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
};

// ─── Avatar ───────────────────────────────────────────────────────────────────
export const Avatar: React.FC<{ src?: string; name: string; size?: 'sm' | 'md' | 'lg' }> = ({ src, name, size = 'md' }) => {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-lg' };
  const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  return src ? (
    <img src={src} alt={name} className={cn('rounded-full object-cover', sizes[size])} />
  ) : (
    <div className={cn('rounded-full bg-primary-100 text-primary-700 font-semibold flex items-center justify-center', sizes[size])}>
      {initials}
    </div>
  );
};

// ─── Stats Card ───────────────────────────────────────────────────────────────
export const StatsCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color?: string; change?: string }> = ({ title, value, icon, color = 'bg-primary-50 text-primary-600', change }) => (
  <div className="card p-6">
    <div className="flex items-center justify-between mb-4">
      <div className={cn('p-3 rounded-xl', color)}>{icon}</div>
      {change && <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">{change}</span>}
    </div>
    <p className="text-2xl font-bold text-gray-900">{value}</p>
    <p className="text-sm text-gray-500 mt-1">{title}</p>
  </div>
);
