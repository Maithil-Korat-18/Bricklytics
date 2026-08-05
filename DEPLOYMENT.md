# Bricklytics — Production Deployment Guide & Infrastructure Documentation

This guide provides step-by-step instructions for deploying the **Bricklytics** AI Real Estate Platform to production.

---

## 1. Architecture Overview

- **Frontend**: React (Vite, TailwindCSS, Lucide Icons, Three.js) compiled as a static single-page application (SPA).
- **Backend API**: Django REST Framework serving clean JSON endpoints for Auth, Buyer, Seller, and AI services.
- **Database**: MongoDB Atlas / local MongoDB storing Users, Properties, Visits, Wishlists, and Prediction Logs.
- **AI Models**: Pre-trained Scikit-Learn pipelines (`price_model.joblib`) hosted in `backend/ml_models/`.

---

## 2. Frontend Deployment

### Hosting Options
Recommended: **Vercel**, **Netlify**, **AWS S3 + CloudFront**, or **Nginx**.

### Build Command & Settings
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Node Version**: `>= 18.x`

### Environment Variables
Configure in hosting panel:
```env
VITE_API_BASE_URL=https://api.yourdomain.com/api
```

### Local Build Verification
```bash
cd frontend
npm install
npm run build
```

---

## 3. Backend API Deployment

### Hosting Options
Recommended: **AWS EC2 / App Runner**, **Render**, **DigitalOcean App Platform**, or **Linux VPS**.

### Prerequisites
- Python 3.10 or higher
- Gunicorn or Uvicorn ASGI server

### Step-by-Step Setup
1. Clone repo onto backend host.
2. Install Python dependencies:
   ```bash
   cd backend
   pip install -r ../requirements.txt
   ```
3. Set Environment Variables in `.env`:
   ```env
   SECRET_KEY=your-secure-prod-key
   DEBUG=False
   ALLOWED_HOSTS=api.yourdomain.com,yourdomain.com
   MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/bricklytics_db
   JWT_SECRET_KEY=your-jwt-secret-key
   ```
4. Collect Static Files:
   ```bash
   python manage.py collectstatic --noinput
   ```
5. Run WSGI Production Server:
   ```bash
   gunicorn bricklytics_backend.wsgi:application --bind 0.0.0.0:8000 --workers 4
   ```

---

## 4. Database Setup (MongoDB)

### Hosting Recommendation
Use **MongoDB Atlas** (Managed Cloud Database).

### Network & Connection Configuration
1. Whitelist the IP addresses of your backend server in MongoDB Atlas IP Access List.
2. Update `MONGODB_URI` in backend `.env`.

### Indexes for High Performance
Run these commands in Mongo shell or Mongo Compass for fast querying:
```js
db.properties.createIndex({ locality: 1, status: 1 });
db.properties.createIndex({ price: 1 });
db.properties.createIndex({ seller_id: 1 });
db.users.createIndex({ email: 1 }, { unique: true });
```

---

## 5. AI Model Serving & Updates

### Pre-trained Models
Ensure `backend/ml_models/price_model.joblib` exists in your deployment artifact.

### Retraining / Updating Models in Production
If updating the ML model with fresh market data:
```bash
python bricklytics_model/train_model.py
cp bricklytics_model/models/price_model.joblib backend/ml_models/price_model.joblib
```
Restart backend process after updating model artifacts.

---

## 6. Media Files Storage

### Uploaded Property Images
Uploaded property images are stored in `backend/media/properties/`.

### Production Recommendation
For scalable multi-instance setups, store uploaded files on **AWS S3** or **Cloudinary**:
- Install `django-storages` and `boto3`.
- Set `DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'`.

---

## 7. CORS Configuration & Security

In `backend/bricklytics_backend/settings.py`:
- Set `CORS_ALLOWED_ORIGINS` to match your frontend production URL:
  ```python
  CORS_ALLOWED_ORIGINS = [
      "https://bricklytics.com",
      "https://www.bricklytics.com",
  ]
  ```
- Ensure HTTPS certificates (SSL via Let's Encrypt / AWS Certificate Manager) are enabled on both frontend and backend domains.

---

## 8. Verification & Health Monitoring

To verify deployment status:
- GET `https://api.yourdomain.com/api/health/` -> Expected response: `{"status": "healthy"}`
