import { validateMenu } from '../../shared/validator.js';

export const loadSchedule = async (configUrl) => {
  const response = await fetch(configUrl, { cache: 'no-store' });
  if (!response.ok) throw new Error('Failed to load schedule');
  const json = await response.json();
  const result = validateMenu(json);
  if (!result.valid) {
    throw new Error(`Menu config invalid: ${result.errors.join('; ')}`);
  }
  return json;
};
