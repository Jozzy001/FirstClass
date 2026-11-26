const { onCall, HttpsError } = require('firebase-functions/v2/https')
const admin = require('firebase-admin')
const logic = require('./logic')

admin.initializeApp()

const deps = () => ({
  db: admin.firestore(),
  auth: admin.auth(),
  now: () => admin.firestore.FieldValue.serverTimestamp()
})

function wrap(fn) {
  return async (request) => {
    try {
      return await fn(deps(), request.auth && request.auth.uid, request.data, request.auth && request.auth.token)
    } catch (e) {
      if (e instanceof logic.AdminError) throw new HttpsError(e.code, e.message)
      console.error('admin action failed', e)
      throw new HttpsError('internal', 'Something went wrong. Please try again.')
    }
  }
}

// Region matches the Firestore location (nam5 is in the US), keeping calls fast and cheap.
const options = { region: 'us-central1', maxInstances: 3 }

exports.adminResetPassword = onCall(options, wrap(logic.resetPassword))
exports.adminSetDisabled = onCall(options, wrap(logic.setDisabled))
exports.claimAdmin = onCall(options, wrap((d, uid, data, token) => logic.claimAdmin(d, uid, token && token.email)))
