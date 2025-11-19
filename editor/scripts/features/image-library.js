const cache = new Map();

export const addImage = async (file) => {
  const url = URL.createObjectURL(file);
  cache.set(file.name, url);
  return { name: file.name, url };
};

export const getImage = (name) => cache.get(name);
