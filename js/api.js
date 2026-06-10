class APIClient {
  constructor() {
    this.baseURL = "https://msmscoompletefinal--ms1464684.replit.app/api";
  }

  getToken() {
    return localStorage.getItem("authToken");
  }

  async request(endpoint, options = {}) {
    const headers = {
      "Content-Type": "application/json",
      ...options.headers
    };

    const token = this.getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(this.baseURL + endpoint, {
      ...options,
      headers
    });

    if (res.status === 401) {
      localStorage.removeItem("authToken");
      window.app?.showPage("login");
      history.pushState({}, "", "/");
    }

    return res;
  }
}

window.apiClient = new APIClient();
