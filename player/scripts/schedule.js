export const loadSchedule = async (configUrl) => {
  const response = await fetch(configUrl);
  if (!response.ok) throw new Error('Failed to load schedule');
  return response.json();
};
