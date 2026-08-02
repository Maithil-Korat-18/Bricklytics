import React from 'react';
import TextInput from './TextInput';

export default function PhoneInput({ name = 'phoneNumber', label = 'Phone Number', required = true }) {
  return (
    <TextInput
      name={name}
      label={label}
      placeholder="10 digit phone number (e.g. 9876543210)"
      required={required}
      maxLength={10}
    />
  );
}
