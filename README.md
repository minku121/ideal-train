# ideal-train

## Ideal Train - Order Management System

A system for managing orders, products, and brand relationships.

### Environment Setup

1. Create a `.env.local` file in the project root with the following variables:

```
# Database
DATABASE_URL=mysql://user:password@localhost:3306/mydb

# NextAuth
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000

# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

2. Install dependencies:

```bash
npm install
```

3. Run the development server:

```bash
npm run dev
```

### Image Upload Feature

Order screenshots are now uploaded to Cloudinary for better image management. See the [Cloudinary Setup Guide](CLOUDINARY_SETUP.md) for more details on how to set up and use this feature.
