'use strict';

'require form';
'require fs';
'require rpc';
'require uci';
'require view';

return view.extend({

	load: function() {
		var wireless = uci.load('network').then(() => uci.get('network'));
        var has_curl = fs.stat('/usr/bin/curl').then(() => true).catch(() => false);
		return Promise.all([wireless, has_curl]);
	},

	render: function(data) {
		var wireless = data[0];
        var has_curl = data[1];

        console.log(wireless);
        console.log(has_curl);

		var m, s, o;

		m = new form.Map('dynapoint', _('Dynamic Access Point Manager'));

		return m.render();
	},

});
