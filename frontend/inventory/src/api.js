// api.js
const BASE_URLS = {
  inventory: "http://localhost:8080",
  supplier: "http://localhost:8081",
};

async function apiRequest({ base, endpoint, method = "GET", body = null, headers = {} }) {
  const url = `${base}${endpoint}`;
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body ? JSON.stringify(body) : null,
  };

  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.status === 204 ? {} : await response.json();
  } catch (error) {
    console.error(`Error in ${method} ${url}:`, error);
    throw error;
  }
}

export { apiRequest, BASE_URLS };