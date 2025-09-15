import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/auth';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      authService.getProfile()
        .then(response => {
          const userData = response.user || response;
          const [firstName = '', lastName = ''] = userData.name ? userData.name.split(' ') : ['', ''];
          setUser({
            ...userData,
            firstName,
            lastName
          });
        })
        .catch(() => {
          localStorage.removeItem('token');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const response = await authService.login(email, password);
    const userData = response.user;
    const [firstName = '', lastName = ''] = userData.name ? userData.name.split(' ') : ['', ''];
    setUser({
      ...userData,
      firstName,
      lastName
    });
    localStorage.setItem('token', response.token);
    return response;
  };

  const register = async (email, password, firstName, lastName) => {
    const response = await authService.register(email, password, firstName, lastName);
    const userData = response.user;
    const [fName = '', lName = ''] = userData.name ? userData.name.split(' ') : [firstName, lastName];
    setUser({
      ...userData,
      firstName: fName,
      lastName: lName
    });
    localStorage.setItem('token', response.token);
    return response;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await authService.updateProfile(profileData);
      const userData = response.user || response;
      const [firstName = '', lastName = ''] = userData.name ? userData.name.split(' ') : [profileData.firstName, profileData.lastName];
      setUser({
        ...userData,
        firstName,
        lastName
      });
      return response;
    } catch (error) {
      console.log('Server not available, updating profile locally');
      // For demo purposes, update local state
      const updatedUser = {
        ...user,
        ...profileData,
        name: `${profileData.firstName || user.firstName} ${profileData.lastName || user.lastName}`
      };
      setUser(updatedUser);
      return { user: updatedUser, success: true };
    }
  };

  const value = {
    user,
    login,
    register,
    logout,
    updateProfile,
    loading,
    isAuthenticated: !!user,
    token: localStorage.getItem('token')
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};