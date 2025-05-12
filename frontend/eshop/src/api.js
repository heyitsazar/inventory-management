const BASE_URL = {
    eShop: "http://localhost:8082",
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
      // Handle 204 or empty response body
      const text = await response.text();
      if (response.status === 204 || !text) {
        return {};
      }
      return JSON.parse(text);
    } catch (error) {
      console.error(`Error in ${method} ${url}:`, error);
      throw error;
    }
  }
  
  export { apiRequest, BASE_URL };