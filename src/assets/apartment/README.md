# Apartment Images Folder

This folder contains images for the apartment rental listing page.

## Structure
- **Main images**: Place apartment photos directly in this folder
- **Thumbnails**: Place smaller versions in the `thumbs/` subfolder (optional)

## Supported formats
- JPG, JPEG, PNG, WebP

## Expected images
The apartment component looks for these specific filenames:
- `living-room.jpg` - Living room photos
- `bedroom.jpg` - Bedroom photos  
- `kitchen.jpg` - Kitchen photos
- `bathroom.jpg` - Bathroom photos
- `terrace.jpg` - Terrace/balcony photos
- `exterior.jpg` - Building exterior photos

## Adding new images
1. Add your image files to this folder
2. Update the `loadApartmentImages()` method in `apartment.component.ts` to include new filenames
3. Optionally create thumbnail versions in the `thumbs/` subfolder

## Current placeholder images
The current SVG files are placeholders demonstrating the layout. Replace them with actual apartment photos for production use.