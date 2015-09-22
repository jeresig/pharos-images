var _ = require("lodash");
var request = require("request");

module.exports = function(core, app) {

var Upload = core.db.model("Upload");

Upload.prototype.getURL = function(locale) {
    return app.genURL(locale, "/uploads/" + this.imageName);
};

exports.load = function(req, res, next, id) {
    Upload.findById("uploads/" + id).exec(function(err, upload) {
        if (err) {
            return next(err);
        }
        if (!upload) {
            console.log("not found")
            return next(new Error("not found"));
        }
        req.upload = upload;
        next();
    });
};

var handleUpload = function(req, baseDir, callback) {
    var form = new formidable.IncomingForm();
    form.encoding = "utf-8";
    form.maxFieldsSize = process.env.MAX_UPLOAD_SIZE;

    form.parse(req, function(err, fields, files) {
        // NOTE: Is the query string also handled by formidable?
        var url = fields.url || req.query.url;

        // Handle the user accidentally hitting enter
        if (url && url === "http://") {
            return callback({err: "No file specified."});
        }

        var stream;

        if (url) {
            stream = request({
                url: url,
                timeout: 5000
            });
        } else {
            stream = fs.createReadStream(files.file.path);
        }

        core.images.downloadStream(stream, baseDir, true, callback);
    });
};

exports.searchUpload = function(req, res) {
    handleUpload(req, Upload.getDataDir(), function(err, id) {
        if (err) {
            // TODO: Show some sort of error message
            return res.redirect(app.genURL(req.i18n.getLocale(), "/"));
        }

        // TODO: Add in uploader's user name (once those exist)
        var upload = new Upload({
            _id: "uploads/" + id,
            imageName: id,
            source: "uploads"
        });

        upload.save(function() {
            res.redirect(upload.getURL(req.i18n.getLocale()));
        });
    });
};

exports.show = function(req, res) {
    // Update similar matches on every load
    req.upload.updateSimilar(function() {
        req.upload.save(function() {
            res.render("images/show", {
                image: req.upload,
                results: req.upload.similar
            });
        });
    });
};

return exports;
};