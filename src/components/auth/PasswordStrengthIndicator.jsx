import React from 'react';
import { Check, X } from 'lucide-react';
import { calculatePasswordStrength } from '../../utils/passwordValidator';

export { calculatePasswordStrength };

export default function PasswordStrengthIndicator({ password = '' }) {
  if (!password) return null;

  const { score, label, color, rules } = calculatePasswordStrength(password);

  const ruleItems = [
    { key: 'length', text: 'At least 8 characters', met: rules.length },
    { key: 'uppercase', text: 'Uppercase letter (A-Z)', met: rules.uppercase },
    { key: 'lowercase', text: 'Lowercase letter (a-z)', met: rules.lowercase },
    { key: 'number', text: 'At least one number (0-9)', met: rules.number }
  ];

  return (
    <div style={{ marginTop: '8px', marginBottom: '14px' }}>
      {/* Strength Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Password Strength</span>
        <span style={{ fontSize: '11px', fontWeight: 700, color }}>{label}</span>
      </div>

      <div style={{ display: 'flex', gap: '4px', height: '4px', marginBottom: '8px' }}>
        {[1, 2, 3, 4].map((level) => {
          const filled = score >= (level === 4 ? 4 : level);
          return (
            <div
              key={level}
              style={{
                flex: 1,
                height: '100%',
                borderRadius: '2px',
                background: filled ? color : 'var(--border-color)',
                transition: 'background 0.25s ease'
              }}
            />
          );
        })}
      </div>

      {/* Checklist */}
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '4px 10px', 
          fontSize: '11px', 
          marginTop: '6px',
          background: 'var(--bg-alt)',
          padding: '8px 10px',
          borderRadius: 'var(--radius-sm)'
        }}
      >
        {ruleItems.map((item) => (
          <div 
            key={item.key} 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '5px', 
              color: item.met ? 'var(--rera-green)' : 'var(--text-muted)' 
            }}
          >
            {item.met ? (
              <Check size={12} strokeWidth={3} color="var(--rera-green)" />
            ) : (
              <X size={12} color="#94A3B8" />
            )}
            <span style={{ fontWeight: item.met ? 600 : 400 }}>{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
