Uploading Images
================

Images should be uploaded as a Zip file of JPG images. You'll need to upload any new images that you want to add before you add any metadata. Depending on how many images you add they can take a while to process (hours initially, to be fully indexed and searchable it could take many more hours or days).

The images shouldn't be smaller than about 300 pixels on any side. Ideally they would be much larger. Having them be at least 1000 pixels on each side would be good to start with. It's important to note that the names of the images should match the file names provided in the metadata.

If you upload an image that was previously uploaded then the old image will be replaced with the new one.

If you ever upload any new images you'll also need to upload a new metadata file in order for the new images to be displayed on the site. (Metadata records that have no images associated with them are never added to the database.)

Once you've uploaded some images, and the images have been fully processed, you will be presented with the number of images successfully uploaded, or that failed to upload. If you click the filename of the Zip file that you uploaded you'll be able to see additional information about what went wrong with the image uploads (if anything).

Common errors and warnings include:

* Having an improperly-formatted JPG image that is unable to be read or displayed. This can be fixed by providing a correct JPG file (verify that it's able to open on your computer).
* Having multiple images that have the same file name. Only one image will be used, the others will be ignored. You'll need to ensure that no duplicate files are provided.
* The image is smaller than 150 pixels on a side (this prevents it from being able to be indexed by the similarity search). Providing a larger image will resolve this warning.