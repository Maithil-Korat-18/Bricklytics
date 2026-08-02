import React from 'react';
import NumberInput from './NumberInput';

export default function PriceInput({ name = 'expectedPrice', label = 'Expected Price ($ / ₹)', required = true }) {
  return (
    <NumberInput
      name={name}
      label={label}
      placeholder="e.g. 2450000"
      required={required}
      min={0}
    />
  );
}
