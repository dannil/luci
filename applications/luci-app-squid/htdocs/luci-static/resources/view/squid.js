'use strict';

'require form';
'require fs';
'require uci';
'require ui';
'require view';

return view.extend({

	load: function() {
		return uci.load('squid')
			.then(() => uci.get('squid', 'squid', 'config_file'));
	},

	render: function(config_file) {
		var m, s, o;

		m = new form.Map('squid', _('Squid'));

		s = m.section(form.TypedSection, 'squid');
		s.anonymous = true;
		s.addremove = false;

		s.tab('general', _('General Settings'));
		s.tab('advanced', _('Advanced Settings'));

		o = s.taboption('general', form.Value, 'http_port', _('Port'));
		o.datatype = 'portrange';
		o.placeholder = '0-65535';

		o = s.taboption('general', form.Value, 'visible_hostname', _('Visible Hostname'));
		o.datatype = 'string';
		o.placeholder = 'OpenWrt';

		o = s.taboption('general', form.Value, 'coredump_dir', _('Coredump files directory'));
		o.datatype = 'string';
		o.placeholder = '/tmp/squid';

		o = s.taboption('advanced', form.TextValue, '_data');
		o.wrap = false;
		o.rows = 25;
		o.rmempty = false;
		o.cfgvalue = function(section_id) {
			return fs.read(config_file);
		};
		o.write = function(section_id, value) {
			if (value) {
				var normalized = value.replaceAll('\r\n', '\n');
				fs.write(config_file, normalized);
			}
		};

		return m.render();
	},

	handleSaveApply: function (ev) {
		this.handleSave()
			.then(() => ui.changes.apply())
			.then(() => fs.exec('/etc/init.d/squid', ['restart']));
	}

});
