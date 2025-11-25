# Quick Start Guide - Facebook Lead Import

## 🚀 Quick Setup (5 Minutes)

### Step 1: Create Facebook App (2 minutes)

1. Go to https://developers.facebook.com/apps/
2. Click **"Create App"** → Choose **"Business"**
3. Name it: `[YourName] CRM Lead Import`
4. Save your **App ID**

### Step 2: Configure App (2 minutes)

1. In your app dashboard, click **"Add Product"**
2. Add **"Facebook Login"** → Choose **"Web"**
3. Go to **Facebook Login > Settings**
4. Add to **Valid OAuth Redirect URIs**:
   ```
   http://localhost:5173/
   ```
5. Add to **Allowed Domains for JS SDK**:
   ```
   localhost
   ```

### Step 3: Update Your Code (1 minute)

1. Open `index.html`
2. Find line with `appId`:
   ```javascript
   appId: '1148870030057645',  // Change this!
   ```
3. Replace with YOUR App ID from Step 1
4. Save the file

### Step 4: Test It! ✨

1. Start dev server:
   ```bash
   npm run dev
   ```
2. Open http://localhost:5173
3. Go to Leads page
4. Click "Import from Facebook"
5. Log in with YOUR Facebook account
6. Should see your name and email! 🎉

---

## 🎯 What You Can Test RIGHT NOW

### ✅ Available Immediately (No Approval Needed)

- **Basic Login**: Facebook login with email
- **User Info**: Retrieve name and email
- **SDK Integration**: Verify Facebook SDK works

### ⏳ Requires App Review (Takes 3-7 days)

- **Pages List**: See your Facebook Pages
- **Lead Forms**: Access your lead generation forms
- **Lead Data**: Import actual lead submissions

---

## 📝 Next Steps After Basic Testing

### 1. Business Verification

- Go to **Settings > Business Verification**
- Upload business documents
- Takes 1-2 business days

### 2. Create Privacy Policy

- Use the `PRIVACY_POLICY_TEMPLATE.md` in this repo
- Customize for your business
- Host it on your website
- Add URL to Facebook App settings

### 3. Request Permissions

- Go to **App Review > Permissions and Features**
- Request each permission with clear explanation
- Provide demo video showing usage
- Submit for review

### 4. Create Test Data

While waiting for approval:

- Create a test Facebook Page
- Create a test Lead Ad campaign
- Submit test leads yourself
- This data will be ready when permissions are approved!

---

## 🐛 Troubleshooting

### "Facebook SDK not loaded"

- **Fix**: Clear browser cache and reload
- **Check**: Console for errors (F12)
- **Verify**: SDK script is in `index.html`

### "App ID mismatch"

- **Fix**: Ensure App ID in `index.html` matches Facebook App
- **Check**: Copy App ID exactly from Facebook dashboard
- **No spaces or quotes**

### "Invalid OAuth redirect URI"

- **Fix**: Add your URL to Facebook App settings
- **Go to**: Facebook Login > Settings > Valid OAuth Redirect URIs
- **Add**: `http://localhost:5173/` (with trailing slash!)

### Login popup blocked

- **Fix**: Allow popups for localhost in browser
- **Try**: Click login button again
- **Alternative**: Check browser popup settings

---

## 💡 Tips for Success

### 1. Test with YOUR account first

- You must be Admin/Developer of the Facebook App
- Add yourself in **Roles > Roles** section

### 2. Start simple

- First test just the email permission
- Once working, request advanced permissions
- Don't try to test everything at once

### 3. Keep notes

- Screenshot each step
- Document any errors
- You'll need this for App Review submission

### 4. Use Test Mode

- Your app starts in "Development Mode"
- Only admins/developers/testers can use it
- Perfect for testing before going live!

---

## 📚 Resources Checklist

Use these files in your project:

- [x] `FACEBOOK_APP_SETUP_GUIDE.md` - Complete setup instructions
- [x] `TESTING_GUIDE.md` - Comprehensive testing procedures
- [x] `PRIVACY_POLICY_TEMPLATE.md` - Privacy policy template
- [x] `.env.example` - Environment variables template
- [x] This file - Quick start guide

---

## 🎬 Demo Video Script

When you submit for App Review, record this:

### Script (2-3 minutes):

1. **Intro** (15 sec)

   - "This is [Your CRM Name]"
   - "It helps businesses manage leads"

2. **Facebook Login** (30 sec)

   - Click "Import from Facebook"
   - Login popup appears
   - Grant permissions
   - Show permissions dialog clearly

3. **Select Page** (30 sec)

   - Show Pages dropdown
   - Explain: "User selects their business Page"
   - Select a Page

4. **Select Form** (30 sec)

   - Show Forms dropdown
   - Explain: "User selects their lead form"
   - Select a form

5. **Import Success** (30 sec)

   - Click "Connect to CRM"
   - Show success message
   - Show leads in CRM list
   - Explain: "Leads now sync automatically"

6. **Privacy & Control** (15 sec)
   - Show disconnect option
   - Show data deletion
   - Explain: "Users control their data"

Record in HD, clear audio, no music needed!

---

## ✅ Current Status Check

Run through this checklist:

### Facebook App Setup

- [ ] Facebook App created
- [ ] App ID saved
- [ ] Facebook Login product added
- [ ] OAuth redirect URIs configured
- [ ] Your account added as Admin

### Code Configuration

- [ ] App ID updated in `index.html`
- [ ] Dev server runs without errors
- [ ] Facebook SDK loads in browser console
- [ ] No CORS errors

### Initial Testing

- [ ] Login button appears
- [ ] Login popup opens
- [ ] Can login successfully
- [ ] Name and email display
- [ ] No console errors

### Ready for Next Phase

- [ ] Privacy Policy drafted
- [ ] Business documents ready
- [ ] Test Page created
- [ ] Test Lead Ad created
- [ ] Demo video planned

---

## 🚦 Status Indicators

### 🟢 Working Now

- Facebook SDK integration
- Basic authentication
- Email permission

### 🟡 Needs Configuration

- App ID update
- OAuth redirect URIs
- Privacy Policy

### 🔴 Needs App Review

- Pages access
- Lead forms access
- Lead data import

---

## 📞 Need Help?

### Check These First

1. Browser console (F12) for errors
2. Facebook App dashboard for status messages
3. `FACEBOOK_APP_SETUP_GUIDE.md` for detailed steps
4. `TESTING_GUIDE.md` for testing procedures

### Common Issues & Fixes

See `TESTING_GUIDE.md` section "Common Issues & Solutions"

### Still Stuck?

- Check Facebook Developer Forums
- Review Facebook Login documentation
- Check your app's error logs in Facebook dashboard

---

## 🎯 Success Criteria

You'll know it's working when:

- ✅ Login popup appears without errors
- ✅ Your name displays after login
- ✅ Your email displays (with copy button)
- ✅ "Successfully Connected!" message appears
- ✅ No red errors in browser console

---

**Time to first working demo: ~5 minutes**  
**Time to production-ready: ~2 weeks** (includes App Review)

Good luck! 🚀
