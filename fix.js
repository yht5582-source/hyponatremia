// Hotfix for the deployed compact bundle: optional fields must not block step completion.
full = function(f) {
  const value = state[f[0]];
  if (!f[3]) return true;
  if (f[2] === 'checks') return Array.isArray(value) && value.length > 0;
  return value !== undefined && String(value).trim() !== '';
};
render();
