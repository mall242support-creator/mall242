export const safeTitle = (title) => {
  return title && title.trim() ? `${title} | Mall242` : 'Mall242';
};