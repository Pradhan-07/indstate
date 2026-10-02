import React, { useRef, useEffect } from 'react';

/**
 * 6-Digit OTP Input Component
 * Features:
 * - Auto-focus between fields
 * - Full clipboard paste support
 * - Backspace / arrow navigation
 * - Enter key to submit
 * - Accessible and mobile responsive
 */
export default function OtpInput({ 
  value = ['', '', '', '', '', ''], 
  onChange, 
  onComplete,
  disabled = false,
  autoFocus = true
}) {
  const inputRefs = useRef([]);

  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  const handleChange = (e, index) => {
    const val = e.target.value;
    if (disabled) return;

    // If pasted or multi-char
    if (val.length > 1) {
      handlePastedContent(val, index);
      return;
    }

    // Only allow single numeric digit
    const cleaned = val.replace(/\D/g, '');
    const newOtp = [...value];
    newOtp[index] = cleaned;
    onChange(newOtp);

    // Auto-advance to next input if digit entered
    if (cleaned && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Check if fully filled
    if (newOtp.every(d => d !== '') && onComplete) {
      onComplete(newOtp.join(''));
    }
  };

  const handleKeyDown = (e, index) => {
    if (disabled) return;

    if (e.key === 'Backspace') {
      if (!value[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    if (disabled) return;
    const pastedData = e.clipboardData.getData('text/plain').replace(/\D/g, '').slice(0, 6);
    if (!pastedData) return;

    const newOtp = [...value];
    for (let i = 0; i < 6; i++) {
      newOtp[i] = pastedData[i] || '';
    }
    onChange(newOtp);

    const focusIdx = Math.min(pastedData.length, 5);
    inputRefs.current[focusIdx]?.focus();

    if (pastedData.length === 6 && onComplete) {
      onComplete(pastedData);
    }
  };

  const handlePastedContent = (str, startIndex) => {
    const digits = str.replace(/\D/g, '');
    const newOtp = [...value];
    for (let i = 0; i < digits.length && (startIndex + i) < 6; i++) {
      newOtp[startIndex + i] = digits[i];
    }
    onChange(newOtp);
    const nextIdx = Math.min(startIndex + digits.length, 5);
    inputRefs.current[nextIdx]?.focus();

    if (newOtp.every(d => d !== '') && onComplete) {
      onComplete(newOtp.join(''));
    }
  };

  return (
    <div 
      className="otp-inputs-row"
      style={{
        display: 'flex',
        justifyContent: 'center',
        gap: 'clamp(6px, 2vw, 12px)',
        margin: '18px 0'
      }}
    >
      {[0, 1, 2, 3, 4, 5].map((index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6} // Allow paste into single input
          value={value[index] || ''}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={handlePaste}
          disabled={disabled}
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          aria-label={`Digit ${index + 1} of verification code`}
          style={{
            width: 'clamp(38px, 11vw, 48px)',
            height: 'clamp(46px, 12vw, 56px)',
            textAlign: 'center',
            fontSize: 'clamp(18px, 4vw, 24px)',
            fontWeight: '700',
            fontFamily: 'var(--font-body)',
            color: 'var(--primary)',
            background: value[index] ? '#FFFFFF' : 'var(--bg-alt)',
            border: value[index] ? '2px solid var(--saffron)' : '1.5px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            boxShadow: value[index] ? '0 0 0 3px rgba(181, 100, 43, 0.12)' : 'none',
            outline: 'none',
            transition: 'all 0.18s ease-in-out'
          }}
          onFocus={(e) => {
            e.target.select();
            e.target.style.borderColor = 'var(--saffron)';
            e.target.style.boxShadow = '0 0 0 3px rgba(181, 100, 43, 0.15)';
          }}
          onBlur={(e) => {
            if (!value[index]) {
              e.target.style.borderColor = 'var(--border-color)';
              e.target.style.boxShadow = 'none';
            }
          }}
        />
      ))}
    </div>
  );
}
