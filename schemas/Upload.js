"use strict";

module.exports = (core) => {
    const Artwork = require("./Artwork")(core);

    const uploadName = "uploads";

    const Upload = Artwork.extend({}, {
        collection: uploadName,
    });

    Upload.methods.getTitle = function(locale) {
        // TODO: Find way to i18n this.
        return "Uploaded Image";
    };

    Upload.methods.getURL = function(locale) {
        return core.urls.gen(locale, `/${uploadName}/${this._id}`);
    };

    Upload.methods.addImage = function(image) {
        // Stop if the image is already in the images list
        if (this.images.indexOf(image._id) >= 0) {
            return;
        }

        this.images.push(image);
    };

    // We don't save the uploaded files in the index so we override this
    // method to use `fileSimilar` to re-query every time.
    Upload.methods.updateImageSimilarity = function(image, callback) {
        const id = image.imageName;
        const file = core.urls.genLocalFile(
            `./${uploadName}/scaled/${image.imageName}.jpg`);

        core.similar.fileSimilar(file, (err, matches) => {
            if (err) {
                return callback(err);
            }

            image.similarImages = matches.filter((match) => match.id !== id);

            callback();
        });
    };

    return Upload;
};
