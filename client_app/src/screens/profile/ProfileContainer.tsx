import React from 'react';
import { ProfileScreen } from './ProfileScreen';

export const ProfileContainer: React.FC = () => {
  // ProfileScreen now handles data fetching internally
  return <ProfileScreen />;
}; 