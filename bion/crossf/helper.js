function Helper(platform) {
    var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    var self = {
        gen_id: length => {
            var id = "";
            if (!length) length = 20;
            for (var i = 0; i < length; i++)
                id += chars.charAt(Math.floor(Math.random()*chars.length));

            return id;
        },
        isset: (obj, attr) => {return obj[attr] !== undefined;},
        in_array: (array, value) => {return array.indexOf(value) != -1;}
    };

    self.array_to_obj = (array, key) => {
        if (!Array.isArray(array) || !array.length || !self.isset(array[0], key)) return {};

        var obj = {};
        array.map(elem => {obj[elem[key]] = elem});

        return obj;
    };
    self.array_keys = (array, key) => {
        if (!Array.isArray(array) || !array.length || !self.isset(array[0], key)) return [];

        var keys = [];
        array.map(elem => {keys.push(elem[key])});

        return keys;
    };

    return self;
}

module.exports = Helper;