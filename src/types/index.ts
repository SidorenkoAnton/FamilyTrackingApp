export interface User {
  id: string;
  email: string;
  name: string;
}

export interface AuthResponse {
  access_token: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
}

export interface Location {
  id: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  batteryLevel?: number;
  createdAt: string;
  user: User;
}