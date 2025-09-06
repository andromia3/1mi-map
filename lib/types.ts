// Type-safe interfaces that match Prisma schema
export interface User {
  id: string
  username: string
  displayName?: string | null
  createdAt: Date
  updatedAt: Date
}

// Partial User type for auth queries that don't need all fields
export interface UserAuth {
  id: string
  username: string
  displayName?: string | null
}

export interface Place {
  id: string
  title: string
  description?: string | null
  lat: number
  lng: number
  createdById: string
  createdAt: Date
  updatedAt: Date
  createdBy: {
    id: string
    username: string
    displayName?: string | null
  }
}

// Normalized types for React components (nulls converted to undefined)
export interface NormalizedUser {
  id: string
  username: string
  displayName?: string
}

export interface NormalizedPlace {
  id: string
  title: string
  description?: string
  lat: number
  lng: number
  createdById: string
  createdAt: Date
  updatedAt: Date
  createdBy: NormalizedUser
}

// Utility function to normalize User from Prisma
export function normalizeUser(user: User | UserAuth): NormalizedUser {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName ?? undefined,
  }
}

// Utility function to normalize Place from Prisma
export function normalizePlace(place: Place): NormalizedPlace {
  return {
    id: place.id,
    title: place.title,
    description: place.description ?? undefined,
    lat: place.lat,
    lng: place.lng,
    createdById: place.createdById,
    createdAt: place.createdAt,
    updatedAt: place.updatedAt,
    createdBy: normalizeUser(place.createdBy),
  }
}
