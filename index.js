var bion = require('./bion/bion.js');

// DEBUG
//setTimeout(debug, 1000);
function debug() {
    var model = bion.blogic.model;
    model.instance('user').read(
        {
            rows: ['id', 'email'],
            //id: 1,
            //order: 'id DESC',
            //limit: 10
        },
        users => {
            if (!users) return;
            console.log('Total users:', users.length);

            var user = model.instance('user');

            user
                .set({
                    email: 'test1',
                    password: '65e76rn8kbjv6cyh'
                })
                .create(res => {
                    if (!res) return;
                    console.log('New user #'+user.data.id);

                    user.data.email = 'test23';
                    user.update(res => {
                        if (!res) return;
                        console.log('User #'+user.data.id+" updated");

                        user.delete(res => {
                            if (!res) return;
                            console.log("User deleted");
                        });
                    });
                });
        }
    );
}