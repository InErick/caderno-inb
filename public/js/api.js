// Chamadas para o backend. O login fica num cookie httpOnly.
window.Api = (() => {
  async function req(method, url, body) {
    const res = await fetch(url, {
      method,
      credentials: "same-origin",
      headers: body ? { "Content-Type": "application/json" } : {},
      body: body ? JSON.stringify(body) : undefined,
    });
    let data = {};
    try { data = await res.json(); } catch {}
    if (!res.ok) {
      const err = new Error(data.error || "Erro de conexão. Tente de novo.");
      err.status = res.status;
      throw err;
    }
    return data;
  }
  return {
    me: () => req("GET", "/api/me"),
    login: (email, password) => req("POST", "/api/auth/login", { email, password }),
    register: (d) => req("POST", "/api/auth/register", d),
    logout: () => req("POST", "/api/auth/logout"),
    updateMe: (d) => req("PATCH", "/api/me", d),
    changePassword: (current, next) => req("POST", "/api/me/password", { current, next }),
    progress: () => req("GET", "/api/progress"),
    setDone: (dayKey, done) => req("PUT", `/api/progress/${dayKey}`, { done }),
    saveSession: (s) => req("POST", "/api/sessions", s),
    sessions: () => req("GET", "/api/sessions"),
    deleteSession: (id) => req("DELETE", `/api/sessions/${id}`),
    stats: (today) => req("GET", `/api/stats?today=${today}`),
  };
})();
