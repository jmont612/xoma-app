import { StringValue, Unit } from 'ms';

const UNITS = [
  'Years',
  'Year',
  'Yrs',
  'Yr',
  'Y',
  'Weeks',
  'Week',
  'W',
  'Days',
  'Day',
  'D',
  'Hours',
  'Hour',
  'Hrs',
  'Hr',
  'H',
  'Minutes',
  'Minute',
  'Mins',
  'Min',
  'M',
  'Seconds',
  'Second',
  'Secs',
  'Sec',
  's',
  'Milliseconds',
  'Millisecond',
  'Msecs',
  'Msec',
  'Ms',
] as const satisfies readonly Unit[];

const UNITS_REGEX = new RegExp(`^\\d+\\s*(${UNITS.join('|')})$`, 'i');

export function assertValidExpires(
  value: string,
): asserts value is StringValue {
  if (!UNITS_REGEX.test(value.trim())) {
    throw new Error(`Valor inválido para JWT_EXPIRES: "${value}"`);
  }
}
