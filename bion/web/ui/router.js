function Router(bion) {
    var log = bion.crossf.logger;

    var self = {
        name: 'ROUTER'
    };

    self.static = (url, path) => {
        bion.web.server.use(url, bion.web.express.static(path));
    };

    self.init_page = page => {
        var path = '../app/web/pages/'+page.tmp;
        var method = page._partial ? bion.web.server.post : bion.web.server.get;

        if (!page._partial) {
            bion.web.server.get(page.url, (req, res) => {
                res.render(path, page.data, (err, html) => {
                    if (err) {
                        log.print(self.name, 'Page loading error: url: '+page.url+', path: '+path);
                        res.status(500).json({error: err});
                        return false;
                    }

                    log.print(self.name, 'Page loading success: url: '+page.url+', path: '+path);
                    res.send(html);
                });
            });
            return;
        }

        bion.web.server.post(page.url, (req, res) => {
            res.render(path, page.data, (err, html) => {
                if (err) {
                    log.print(self.name, 'Page loading error: url: '+page.url+', path: '+path);
                    res.status(500).json({error: err});
                    return false;
                }

                var data = req.body;
                //console.log('POST:', data);

                if (!data.token) {
                    res.status(404).end();
                    return false;
                }

                var user = _bion.users[data.token];

                if (!user || !user.page_access(page)) {
                    res.status(404).end();
                    return false;
                }

                res.status(200).json({html: html});
            });
        });
    };

    return self;
}

module.exports = Router;