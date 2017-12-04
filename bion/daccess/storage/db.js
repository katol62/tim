module.exports = bion => {
    var log = bion.crossf.logger;
    var helper = bion.crossf.helper;
    var engine = require('mysql');

    var self = {
        name: 'DB',
        con: null
    };

    self.init = callback => {
        self.con = engine.createConnection(bion.config.storage.db);

        self.con.connect(err => {
            if (err) {
                log.print(self.name, 'DB connection error:' + err, true);
                callback && callback(false);
                return false;
            }

            log.print(self.name, 'DB connected!');

            setInterval(() => {
                _query("SHOW TABLES", () => {log.print(self.name, 'Ping..');});
            }, 1600000);

            callback && callback(true);
        });
    };

    self.select = (params, callback) => {
        var q = [
            "SELECT "+(Array.isArray(params.rows) ? params.rows.join(", ") : params.rows),
            "FROM "+params.name
        ];
        var where = params.where ? prep_w(params.where) : false;
        where && q.push("WHERE "+where);
        params.order && q.push("ORDER BY "+params.order);
        params.limit && q.push("LIMIT 0,"+params.limit);

        _query(q.join(" "), callback);
    };


    self.insert = (params, callback) => {
        var q = [
            "INSERT INTO "+params.name,
            "("+Object.keys(params.data).join(", ")+")",
            "VALUES",
            "("+values(params.data).join(", ")+")"
        ].join(" ");

        _query(q, res => {
            callback(res && res.insertId ? res.insertId : null);
        });
    };

    self.update = (params, callback) => {
        var q = [
            "UPDATE "+params.name,
            "SET "+values(params.data, true).join(", ")
        ];

        if (!params.data) params.data = {};
        if (params.data.id) q.push("WHERE id = "+params.data.id);
        else {
            var where = params.where ? prep_w(params.where) : false;
            where && q.push("WHERE "+where);
        }

        _query(q.join(" "), callback);
    };

    self.delete = (params, callback) => {
        var q = [
            "DELETE FROM "+params.name,
            "WHERE"
        ];

        if (!params.data) params.data = {};
        if (params.data.id && Array.isArray(params.data.id)) q.push("id IN ("+params.data.id.join(', ')+")");
        else if (params.data.id) q.push("id = "+params.data.id);
        else if (params.where) {
            var where = prep_w(params.where);
            where && q.push(where);
        }

        _query(q.join(" "), callback);
    };

    function _query(q, callback) {
        var start = Date.now();

        self.con.query(q, (err, res) => {
            var stop = Date.now();
            log.debug('"'+q+'" query lead time: '+(stop-start)+' msec');

            if (err || !res || (res.affectedRows !== undefined && !res.affectedRows)) {
                log.print(self.name, err || res, true);
                callback(null);
                return;
            }

            callback(res);
        });
    }
    function prep_w(params) {
        var where = [];
        for (var oper in params) {
            var _where = [];
            var conds = params[oper];
            for (var i = 0; i < conds.length; i++) {
                var row = conds[i][0];
                var inner_oper = conds[i][1];
                var value = conds[i][2];

                if (inner_oper === 'IN') value = "("+value.join(', ')+")";
                else if (value*1 != value) value = "'"+value+"'";

                _where.push([row, inner_oper, value].join(" "));
            }
            _where.length && where.push("("+_where.join(" "+oper.toUpperCase()+" ")+")");
        }

        return where.join(" AND ");
    }
    function values(data, set) {
        var res = [];
        for (var i in data) {
            if (set && i === 'id') continue

            var val = set ? i+" = " : "";
            val += typeof data[i] === "string" && data[i] !== "NULL" ? "'"+data[i]+"'" : data[i];
            res.push(val);
        }
        return res;
    }

    self.init();

    return self;
};