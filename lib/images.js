var path = require("path");
var crypto = require("crypto");

var imageinfo = require("imageinfo");
var fs = require("graceful-fs");
var gm = require("gm");
var async = require("async");
var request = require("request");

var genTmpFile = function() {
    return "/tmp/" + (new Date).getTime() + "" + Math.random();
};

module.exports = function(ukiyoe) {
    var images = {
        maxAttempts: 3,

        hashFile: function(file, callback) {
            var hash = crypto.createHash("sha256");
            hash.setEncoding("hex");

            fs.createReadStream(file)
                .on("end", function() {
                    hash.end();
                    callback(hash.read());
                })
                .pipe(hash);
        },

        convert: function(inputFile, outputFile, config, callback) {
            var stream = gm(fs.createReadStream(inputFile))
                .autoOrient();

            if (arguments.length === 4) {
                stream = config(stream);
            } else {
                callback = config;
            }

            stream
                .stream("jpg")
                .on("error", function(err) {
                    callback({msg: "Error converting file to JPEG: " + err});
                })
                .pipe(fs.createWriteStream(outputFile))
                .on("finish", function() {
                    callback(null, outputFile);
                });
        },

        parseSize: function(size) {
            var nums = size.split("x");
            var width = parseFloat(nums[0]);
            var height = parseFloat(nums[1]);
            return {
                width: width,
                height: height
            };
        },

        getSize: function(fileName, callback) {
            var width, height, info;

            fs.readFile(fileName, function(err, data){
                if (err) {
                    return callback(err);
                }

                var info = imageinfo(data);
                callback(null, {
                    width: info.width,
                    height: info.height
                });
            });
        },

        cropToFile: function(inputFile, outputFile, coords, callback) {
            gm(inputFile)
                .crop(coords.width, coords.height, coords.x, coords.y)
                .write(outputFile, function (err) {
                    if (err) console.log(err);
                });
        },

        makeThumb: function(baseDir, fileName, callback) {
            var imageFile = path.resolve(baseDir, "images", fileName);
            var thumbFile = path.resolve(baseDir, "thumbs", fileName);
            var thumb = this.parseSize(process.env.THUMB_SIZE);

            images.convert(imageFile, thumbFile, function(img) {
                return img.resize(thumb.width, thumb.height, ">")
                    .gravity("Center")
                    .extent(thumb.width, thumb.height);
            }, callback);
        },

        makeScaled: function(baseDir, fileName, callback) {
            var imageFile = path.resolve(baseDir, "images", fileName);
            var scaledFile = path.resolve(baseDir, "scaled", fileName);
            var scaled = this.parseSize(process.env.SCALED_SIZE);

            images.convert(imageFile, scaledFile, function(img) {
                return img.resize(scaled.width, scaled.height, "^>");
            }, callback);
        },

        makeThumbs: function(fullPath, callback) {
            var baseDir = path.resolve(path.dirname(fullPath), "..");
            var fileName = path.basename(fullPath);

            async.series([
                function(callback) {
                    images.makeThumb(baseDir, fileName, callback);
                },
                function(callback) {
                    images.makeScaled(baseDir, fileName, callback);
                }
            ], function(err) {
                if (err) {
                    callback({
                        msg: "Error converting thumbnails: " + err
                    });
                } else {
                    var thumbFile = path.resolve(baseDir, "thumbs", fileName);
                    var scaledFile = path.resolve(baseDir, "scaled", fileName);
                    callback(null, [thumbFile, scaledFile]);
                }
            });
        },

        getPath: function(baseDir, file) {
            return path.relative(path.resolve(baseDir, ".."), file);
        },

        upload: function(baseDir, imageFile, callback) {
            var attemptNum = 0;
            var pathName = this.getPath(baseDir, imageFile);

            var uploadImage = function() {
                attemptNum += 1;

                ukiyoe.s3.upload(imageFile, pathName, function(err) {
                    if (err) {
                        if (attemptNum < images.maxAttempts) {
                            uploadImage();
                        } else {
                            callback({msg: "Error Uploading Image."});
                        }
                    } else {
                        callback();
                    }
                });
            };

            uploadImage();
        },

        uploadImages: function(baseDir, files, callback) {
            async.map(files, function(file, callback) {
                images.upload(baseDir, file, callback);
            }, callback);
        },

        processImage: function(tmpFile, baseDir, cdnSave, callback) {
            images.hashFile(tmpFile, function(hash) {
                // TODO: Make sure that the file is a JPG
                var fileName = hash + ".jpg";
                var imageFile = path.resolve(baseDir, "images", fileName);

                images.convert(tmpFile, imageFile, function(err) {
                    if (err) {
                        return callback(err);
                    }

                    // TODO: Avoid doing all of this if it already exists

                    images.makeThumbs(imageFile, function(err, files) {
                        if (err) {
                            return callback(err);
                        }

                        if (!cdnSave) {
                            return callback(err, hash);
                        }

                        images.uploadImages(baseDir, [imageFile].concat(files),
                            function(err) {
                                callback(err, hash);
                            });
                    });
                });
            });
        },

        downloadStream: function(stream, baseDir, cdnSave, callback) {
            var attemptNum = 0;

            var downloadImage = function() {
                attemptNum += 1;

                var tmpFile = genTmpFile();
                var outStream = fs.createWriteStream(tmpFile);

                outStream.on("finish", function() {
                    images.processImage(tmpFile, baseDir, cdnSave, callback);
                });

                stream.on("error", function() {
                    console.error("Error Downloading Image:",
                        JSON.stringify(err));
                    if (attemptNum < images.maxAttempts) {
                        downloadImage();
                    } else {
                        callback({msg: "Error Downloading image."});
                    }
                });

                stream.pipe(outStream);
            };

            downloadImage();
        },

        download: function(imageURL, baseDir, cdnSave, callback) {
            this.downloadStream(request({
                url: imageURL,
                timeout: 30000
            }), baseDir, cdnSave, callback);
        }
    };

    return images;
};