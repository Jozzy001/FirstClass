# FirstClass admin setup (do this once)

This switches on three things: the **password reset tool**, the **admin page** (students and activity), and the **change-password page** for students.

You will do it in three parts: (A) register the two admin accounts, (B) publish the new rules and server functions, (C) test it. Take your time. Nothing here can break the live app for students until Part B, and Part B only adds things.

---

## Part A. Register the two admin accounts (do this FIRST)

The admin numbers are **09121192596** and **07068414492**. Anyone who logs in with one of these numbers is automatically made an admin. Because phone numbers are not verified by text message, **whoever registers a number first owns it**. So the two owners must register right now, before you deploy and before you announce the app more widely.

Each person, on their own phone:
1. Open https://first-class-lovat.vercel.app and tap **Create account**.
2. Type the phone number **exactly** as `09121192596` or `07068414492`: digits only, starting with 0, no spaces, no +234. (A different format creates a different account that will not be an admin.)
3. Choose a strong password that is used nowhere else. Finish sign-up (pick any faculty and course).

Then you check in the Firebase console (https://console.firebase.google.com, project **firstclass-887f7**): **Build, then Authentication, then Users**. You should see exactly these two rows, created today by you:
- `09121192596@firstclass.app`
- `07068414492@firstclass.app`

If one of them is missing or was created by someone you do not know, **stop and tell me** before going on.

---

## Part B. Publish the rules and the server functions

You need **Node.js** on your computer. If you do not have it, install the "LTS" version from https://nodejs.org (accept the defaults).

### B1. Switch Firebase to the pay-as-you-go plan
Firebase functions need it. At your size the bill is normally zero (there is a large free allowance). In the console, click **Upgrade** (bottom of the left menu), choose **Blaze**, and add a card. Then in Google Cloud you can set a **budget alert** (for example 5 US dollars) so you are warned about any surprise.

### B2. Open the project folder in VS Code's terminal
Open the FirstClass folder in VS Code. Menu: **Terminal, then New Terminal**. Run these, one at a time, pressing Enter after each:

```
npm install -g firebase-tools
firebase login
```
(`firebase login` opens a browser. Sign in with the **same Google account** that owns the Firebase project.)

```
cd functions
npm install
cd ..
firebase deploy --only firestore:rules,functions
```

The first deploy may ask you to enable some Google services (answer **Y**) and can take 3 to 6 minutes. When it finishes you will see **Deploy complete!**.

If it says the project is not on the Blaze plan, finish B1 and run the last command again.

### B3. Push the app update as usual
Commit and push the new code from VS Code (as you always do) so Vercel publishes the new admin page.

---

## Part C. Test it

1. Log out, then **log in with one of the admin numbers**. A few seconds after the dashboard appears, an **Admin** link shows in the top bar (if not, refresh once). Do the same with the second number.
2. Open **Admin**. You should see the number of students, the course chart and the student list.
3. Test the reset on a **test student account you made yourself** (not a real student):
   1. Tap the test student, then **Reset password**, then **Reset password** again to confirm.
   2. You will see a temporary password and a **Send on WhatsApp** button.
   3. Log out, then log in as the test student with the temporary password. A banner asks them to choose their own password. Do that on the **Account** page.
4. Check that a normal student does not see the Admin link, and that opening `/admin` sends them back to the dashboard.

---

## How to help a student who forgot their password

1. Ask them to message you the **phone number they signed up with**. Confirm it is really them (for example the email they gave at sign-up matches the one on the Admin page, or you can reach them by a call).
2. Admin page, search their number, **Reset password**, send the temporary password by WhatsApp.
3. They log in and choose their own password.

Resetting signs them out of every device, so a stolen login stops working at once. The action is recorded under **Recent admin actions**.

## Adding or removing admins later
- **Add** a number: open `functions/adminPhones.js`, add the number in the same format (digits only, starting with 0), run `firebase deploy --only functions` again, and have that person register first, then log in.
- **Remove** an admin: in the Firebase console, Firestore Database, Data, collection `admins`, delete that person's document. Also take their number out of `functions/adminPhones.js` and deploy again, or it will be granted again the next time they log in on a new device.
- A one-off helper without a listed number: copy their User UID from Authentication and add a document to `admins` with that UID as the document ID and a field `role` = `helper`.

## Keep it safe
- The admin account can see every student's details. Use a strong, unique password and never share it. For helpers, make them their own admin account instead.
- Do not write temporary passwords anywhere permanent. They only need to live in the WhatsApp message.
- If you ever lose access to your admin account, you can fix it in the Firebase console (Authentication and Firestore, same screens as Part A).
