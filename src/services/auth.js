import api from './api';

export const authService = {
  async login(email, password) {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  async register(email, password, firstName, lastName) {
    const response = await api.post('/auth/register', {
      email,
      password,
      name: `${firstName || ''} ${lastName || ''}`.trim()
    });
    return response.data;
  },

  async getProfile() {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  async updateProfile(profileData) {
    const response = await api.put('/auth/profile', {
      ...profileData,
      name: `${profileData.firstName || ''} ${profileData.lastName || ''}`.trim()
    });
    return response.data;
  },

  async logout() {
    // Just remove token from localStorage
    // The backend doesn't need to be notified for JWT
    localStorage.removeItem('token');
  }
};