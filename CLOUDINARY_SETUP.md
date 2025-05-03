# Cloudinary Integration Guide

This project uses Cloudinary for storing order screenshot images. Follow these steps to set up Cloudinary in your development environment.

## Setup Steps

1. **Create a Cloudinary Account**
   - Go to [Cloudinary Sign Up](https://cloudinary.com/users/register/free)
   - Create a free account

2. **Get Your Cloudinary Credentials**
   - Once logged in, go to your [Dashboard](https://cloudinary.com/console)
   - You will see your Cloud Name, API Key, and API Secret

3. **Add Credentials to Environment Variables**
   - Create or update your `.env.local` file in the project root with:
   ```
   # Cloudinary Credentials
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

4. **Restart Your Development Server**
   - Run `npm run dev` to apply the changes

## How It Works

1. When a user uploads an order screenshot, the image is sent to the API as part of form data
2. The API extracts the image file and uploads it to Cloudinary
3. Cloudinary returns a secure URL which is stored in the database
4. The image URL is returned to the frontend and can be used in `<Image>` components

## Folder Structure in Cloudinary

Images are organized in Cloudinary in the following structure:
- All order screenshots are stored in the `order_proofs` folder
- Each image uses a naming convention of `product_{productId}_{uniqueId}`
- Images are tagged with `order_proof` and `product_{productId}` for easy filtering

## Troubleshooting

If images are not uploading correctly:

1. Check your Cloudinary credentials in `.env.local`
2. Ensure your Cloudinary account is active and has available credits
3. Check the API logs for specific error messages
4. Verify the file types being uploaded (Cloudinary supports most image formats)

## Resource Limits

The free tier of Cloudinary includes:
- 25 credits (~25GB storage and bandwidth)
- 25,000 transformations
- 25GB of managed storage

For production use with higher volumes, consider upgrading to a paid plan. 