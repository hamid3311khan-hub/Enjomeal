// =============================================
// EnjoMeal Admin Authentication Helper
// =============================================

export const getAuthToken = () => {
  const token = localStorage.getItem("enjoMealToken");

  if (!token || token.trim() === "") {
    return null;
  }

  return token;
};

export const getAuthHeaders = () => {
  const token = getAuthToken();

  if (!token) {
    return null;
  }

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

export const isLoggedIn = () => {
  return !!getAuthToken();
};

export const logoutAdmin = () => {
  localStorage.removeItem("enjoMealToken");
  localStorage.removeItem("enjoMealUser");
};