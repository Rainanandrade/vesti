function withTimeout(task, timeoutMs = 15000, label = 'A operação') {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} demorou mais que o esperado. Verifique sua conexão e tente novamente.`)), timeoutMs);
  });
  return Promise.race([Promise.resolve(task), timeout]).finally(() => clearTimeout(timer));
}

module.exports = { withTimeout };
