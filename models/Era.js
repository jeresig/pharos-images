module.exports = function(lib) {
    try {
        return lib.db.model("Era");
    } catch(e) {}

    var EraSchema = new lib.db.schema({
        _id: String,
        name: String,
        startYear: Number,
        endYear: Number
    });

    return lib.db.model("Era", EraSchema);
};