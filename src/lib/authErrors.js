// Turns Firebase auth errors into plain sentences a student can act on.
export function friendlyAuthError(err) {
  const code = err?.code || ''
  switch (code) {
    case 'auth/email-already-in-use':
      return 'This phone number already has an account. Please log in instead.'
    case 'auth/weak-password':
      return 'Your password must be at least 6 characters.'
    case 'auth/invalid-phone':
      return 'Enter a valid phone number, for example 0803 123 4567.'
    case 'auth/invalid-email':
      return 'That phone number does not look right. Check it and try again.'
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-login-credentials':
      return 'Wrong phone number or password. Please try again.'
    case 'auth/user-disabled':
      return 'This account has been blocked. Please contact support.'
    case 'auth/requires-recent-login':
      return 'For your safety, please log out, log in again, and then retry.'
    case 'auth/too-many-requests':
      return 'Too many attempts. Wait a few minutes and try again.'
    case 'auth/network-request-failed':
      return 'No internet connection. Check your network and try again.'
    case 'auth/operation-not-allowed':
      return 'Sign-in is not switched on yet. Please contact support.'
    default:
      return 'Something went wrong. Please try again.'
  }
}
