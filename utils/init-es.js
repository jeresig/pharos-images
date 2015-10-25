var core = require("../models");

var Artwork = core.db.model("Artwork");

core.init(function() {
    Artwork.createMapping(function(err, mapping) {
        var stream = Artwork.synchronize();
        var count = 0;
        stream.on('data', function(err, doc){
            count++;
            console.log('indexed ' + count);
        });
        stream.on('close', function(){
            process.exit(0);
        });
        stream.on('error', function(err){
            console.log(err);
        });
    });
});