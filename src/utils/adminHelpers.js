// Admin helper functions for user approval management

const ADMIN_EMAIL = 'rakeshkanojia96@gmail.com'

export const isUserAdmin = (user) => {
  return user?.emailAddresses[0]?.emailAddress === ADMIN_EMAIL
}

export const isUserApproved = (user) => {
  // Admin is always approved
  if (isUserAdmin(user)) return true
  
  // Check public metadata for approval status
  return user?.publicMetadata?.approved === true
}

export const ADMIN_CONFIG = {
  adminEmail: ADMIN_EMAIL
}
