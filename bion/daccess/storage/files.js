module.exports = bion => {
    var self = {

    };

    self.dir = (path, mod) => {
        if (bion.__.FS.existsSync('./'+path)) return true;
        bion.__.FS.mkdirSync('./'+path, mod);
        return true;
    };

    return self;
};