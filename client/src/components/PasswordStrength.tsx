import { getPasswordStrength, type PasswordStrengthLevel } from '../utils/validators';

const COLORS: Record<PasswordStrengthLevel, string> = {
  weak: 'bg-red-500',
  medium: 'bg-amber-500',
  strong: 'bg-blue-500',
  'very-strong': 'bg-emerald-500',
};

interface Props {
  password: string;
}

export default function PasswordStrength({ password }: Props) {
  if (!password) return null;

  const { level, score, label } = getPasswordStrength(password);

  return (
    <div className="mt-2 space-y-1">
      <div className="h-1.5 w-full rounded-full bg-white/5">
        <div
          className={`h-full rounded-full transition-all duration-500 ${COLORS[level]}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <p className={`text-xs ${COLORS[level].replace('bg-', 'text-')}`}>
        Força: {label}
      </p>
    </div>
  );
}
