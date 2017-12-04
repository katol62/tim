module.exports = bion => {
    var params_path = 'app/params/';

    var self = {};

    // init
    bion.__.FS.readdirSync('./'+params_path).forEach(file => {
        var filename = file.split('.')[0];
        self[filename] = require('../../'+params_path+filename);
    });

    return self;
};