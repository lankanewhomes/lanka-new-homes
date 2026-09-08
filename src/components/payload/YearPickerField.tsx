'use client'

import { DatePicker, FieldDescription, FieldError, FieldLabel, useField } from '@payloadcms/ui'
import type { NumberFieldClientProps } from 'payload'

// Year-only picker for number fields that store a year (Move-In Year).
// Payload's date field has day/month/time appearances but no year-only
// one, and a bare number input let people type 202 or 20300. This reuses
// Payload's own DatePicker element (react-datepicker underneath, so the
// popover matches the Sales-started / Construction-started pickers next
// to it) in year-grid mode and stores plain `2030`, so nothing about the
// field's type, the Supabase sync or the "Move in 2030" badge changes.

const EARLIEST_YEAR = 2000
const YEARS_AHEAD = 15
// react-datepicker pages the year grid in fixed blocks of this size
// (ceil(year / n) * n is the block's last year). 15 puts 2026–2040 on the
// first page — this year plus the move-in years developers actually pick —
// with completed years one "previous" click away.
const YEARS_PER_PAGE = 15

export function YearPickerField(props: NumberFieldClientProps) {
  const { field, path, readOnly } = props
  const { errorMessage, setValue, showError, value } = useField<null | number>({ path })

  const selected = typeof value === 'number' && value > 0 ? new Date(value, 0, 1, 12) : undefined
  const thisYear = new Date().getFullYear()

  return (
    <div className={['field-type', 'number', 'year-picker-field', showError && 'error', readOnly && 'read-only'].filter(Boolean).join(' ')}>
      <FieldLabel label={field.label} localized={field.localized} path={path} required={field.required} />
      <div className="field-type__wrap">
        <FieldError message={errorMessage} path={path} showError={showError} />
        <DatePicker
          id={`field-${path.replace(/\./g, '__')}`}
          displayFormat="yyyy"
          maxDate={new Date(thisYear + YEARS_AHEAD, 11, 31)}
          minDate={new Date(EARLIEST_YEAR, 0, 1)}
          onChange={(date) => setValue(date instanceof Date ? date.getFullYear() : null)}
          overrides={{ showYearPicker: true, yearItemNumber: YEARS_PER_PAGE }}
          placeholder="Pick a year"
          readOnly={readOnly}
          value={selected}
        />
        <FieldDescription description={field.admin?.description} path={path} />
      </div>
    </div>
  )
}
