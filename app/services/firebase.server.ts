import admin from "firebase-admin";

const firebaseConfig = JSON.parse(Buffer.from(process.env.FIREBASE_ADMIN_SDK || "", 'base64').toString('ascii'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(firebaseConfig as admin.ServiceAccount),
  });
}

export default admin;
