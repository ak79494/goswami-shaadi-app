# GoswamiJodi: your steps for today

These need your ID, card or account login, so you have to do them yourself. Do them in this order.

Never paste a password or key file into the chat. When a step gives you a secret, keep it on your Mac and tell me it's ready.

## 1. Google Play account (US$25, about ₹2,400, one time)

Link: https://play.google.com/console/signup

1. Sign in with the Google account of the app's owner. This account will own the app long term.
2. Choose **Personal**. If you have a registered business with a D-U-N-S number, tell me before you pay, because that changes the plan.
3. Set the developer name to **GoswamiJodi**. This shows publicly on the store.
4. Enter your legal name and address exactly as they appear on your ID.
5. Pay with a card that isn't prepaid and works for international payments.
6. Upload your ID when asked, and verify your email and phone.
7. Install the [Play Console app](https://play.google.com/store/apps/details?id=com.google.android.apps.playconsole) on an Android phone and sign in, to confirm you have an Android device.

**Stop there.** Don't click "Create app" yet. I'll give you the exact answers to fill in. Google may take a few days to check your ID.

## 2. Server (about ₹1,800 a month)

Link: https://cloud.digitalocean.com/registrations/new

1. Create the account and add your card.
2. Click **Create**, then **Droplets**, and choose:
   - **Region:** Bangalore
   - **Image:** Ubuntu, latest LTS version
   - **Size:** Basic, Regular, $12 a month (2 GB)
   - **Backups:** turn on, Daily
   - **Authentication:** SSH Key, then **Add SSH Key**, and paste this whole line:

```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIBECAaHwKgPyacUo4601jEaCgsKD9kePKsW3WuKHU7ta app-server-deploy
```

3. Click **Create Droplet**.
4. Copy the server's IP address, which looks like `139.59.12.34`. You'll need it in the next step.

This key is safe to paste. It's the public half of a login key that stays on your Mac.

## 3. Domain (about ₹1,200 a year)

Link: https://www.namecheap.com/domains/registration/results/?domain=goswamijodi.com

1. Buy **goswamijodi.com** for one year. Skip the extras.
2. Open **Domain List**, then **Manage**, then **Advanced DNS**.
3. Delete any records already there, then add these three **A Records**, using your server's IP address as the value:

| Type | Host | Value |
|---|---|---|
| A Record | `@` | your server's IP |
| A Record | `www` | your server's IP |
| A Record | `api` | your server's IP |

4. Open **Domain**, find **Redirect Email** (Email Forwarding), and forward `support` to the new Gmail address from step 5. Your app and legal pages show `support@goswamijodi.com`, so emails to it must reach you. Do this after step 5.

## 4. Firebase (free, for notifications when the app is closed)

Link: https://console.firebase.google.com

1. Create a project named **GoswamiJodi**. You can turn Google Analytics off.
2. Add an **Android** app with this package name: `com.goswamijodi.app`
3. Download the `google-services.json` file.
4. Click the gear icon, then **Project settings**, **Service accounts**, and **Generate new private key**. This downloads a second file, which is secret.
5. Create a folder on your Mac at `Documents/goswamijodi-keys` and move both files into it.

## 5. New Gmail for the app (free)

This sends the app's emails and becomes your support address. Links: https://accounts.google.com/signup and https://myaccount.google.com/apppasswords

1. Create a Gmail address, for example `goswamijodi.help@gmail.com`.
2. Turn on 2-Step Verification.
3. Create an app password and keep it private. I'll tell you where it goes.
4. On the old Google account, change the password and delete the old app password, because both are still in your Git history.

## 6. Line up 12 testers

Find 12 people with Android phones and collect their Gmail addresses. They must stay in the test for 14 days in a row and actually use the app, because Google asks how the test went.

## 7. Then send me

- The server's IP address
- Confirmation that the domain is bought and the three records are added
- Confirmation that the two Firebase files are in the folder
- Confirmation that emails to `support@goswamijodi.com` reach your new Gmail
- The name of the person Google should list as the child-safety contact, and whether Arun Goswami should be named as the grievance officer on your legal pages
