export const validateMenu = (data) => {
  if (!Array.isArray(data.groups)) {
    throw new Error('Menu is missing groups');
  }
  return true;
};
