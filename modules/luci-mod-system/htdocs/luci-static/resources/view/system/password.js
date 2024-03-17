'use strict';
'require view';
'require dom';
'require ui';
'require form';
'require rpc';

var formData = {
	password: {
		pw1: null,
		pw2: null
	}
};

var callSetPassword = rpc.declare({
	object: 'luci',
	method: 'setPassword',
	params: [ 'username', 'password' ],
	expect: { result: false }
});

return view.extend({
	checkPassword: function(section_id, value) {
		// Guidelines as defined by NIST Special Publication 800-63b, relevant sections:
		//    * 5.1.1 Memorized Secret
		//	  * Appendix A - Strength of Memorized Secrets

		// Estimate entropy (H) according to H=log2(R^L), where:
		//     R = all ASCII printable characters (including whitespace)
		//     L = length of password, and considers:
		//         * Only unique characters
		function estimateEntropy(string) {
			const characterSetSize = 95; // 126 - 33
			const length = new Set([...string]).size;
		
			// Estimate entropy
			const entropy = Math.round(Math.log2(Math.pow(characterSetSize, length)));
			return entropy;
		}

		var strength = document.querySelector('.cbi-value-description');

		if (strength && value.length) {
			const estimatedEntropy = estimateEntropy(value);
			console.log("E: " + estimatedEntropy);

			if (value.length < 8) {
				strength.innerHTML = '%s: <span style="color:red">%s</span>'.format(_('Password strength'), _('More Characters'));
			} else if (estimatedEntropy < 36) {
				strength.innerHTML = '%s: <span style="color:red">%s</span>'.format(_('Password strength'), _('Very weak'));
			} else if (estimatedEntropy < 60) {
				strength.innerHTML = '%s: <span style="color:red">%s</span>'.format(_('Password strength'), _('Weak'));
			} else if (estimatedEntropy < 120) {
				strength.innerHTML = '%s: <span style="color:green">%s</span>'.format(_('Password strength'), _('Strong'));
			} else {
				strength.innerHTML = '%s: <span style="color:green">%s</span>'.format(_('Password strength'), _('Very strong'));
			}

			// if (false == enoughRegex.test(value))
			// 	strength.innerHTML = '%s: <span style="color:red">%s</span>'.format(_('Password strength'), _('More Characters'));
			// else if (strongRegex.test(value))
			// 	strength.innerHTML = '%s: <span style="color:green">%s</span>'.format(_('Password strength'), _('Strong'));
			// else if (mediumRegex.test(value))
			// 	strength.innerHTML = '%s: <span style="color:orange">%s</span>'.format(_('Password strength'), _('Medium'));
			// else
			// 	strength.innerHTML = '%s: <span style="color:red">%s</span>'.format(_('Password strength'), _('Weak'));
		}

		// var strength = document.querySelector('.cbi-value-description'),
		//     strongRegex = new RegExp("^(?=.{8,})(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*\\W).*$", "g"),
		//     mediumRegex = new RegExp("^(?=.{7,})(((?=.*[A-Z])(?=.*[a-z]))|((?=.*[A-Z])(?=.*[0-9]))|((?=.*[a-z])(?=.*[0-9]))).*$", "g"),
		//     enoughRegex = new RegExp("(?=.{6,}).*", "g");

		// if (strength && value.length &&) {

		// 	console.log(estimateEntropy(value));

		// 	if (false == enoughRegex.test(value))
		// 		strength.innerHTML = '%s: <span style="color:red">%s</span>'.format(_('Password strength'), _('More Characters'));
		// 	else if (strongRegex.test(value))
		// 		strength.innerHTML = '%s: <span style="color:green">%s</span>'.format(_('Password strength'), _('Strong'));
		// 	else if (mediumRegex.test(value))
		// 		strength.innerHTML = '%s: <span style="color:orange">%s</span>'.format(_('Password strength'), _('Medium'));
		// 	else
		// 		strength.innerHTML = '%s: <span style="color:red">%s</span>'.format(_('Password strength'), _('Weak'));
		// }

		return true;
	},

	render: function() {
		var m, s, o;

		m = new form.JSONMap(formData, _('Router Password'), _('Changes the administrator password for accessing the device'));
		m.readonly = !L.hasViewPermission();

		s = m.section(form.NamedSection, 'password', 'password');

		o = s.option(form.Value, 'pw1', _('Password'));
		o.password = true;
		o.validate = this.checkPassword;

		o = s.option(form.Value, 'pw2', _('Confirmation'), ' ');
		o.password = true;
		o.renderWidget = function(/* ... */) {
			var node = form.Value.prototype.renderWidget.apply(this, arguments);

			node.querySelector('input').addEventListener('keydown', function(ev) {
				if (ev.keyCode == 13 && !ev.currentTarget.classList.contains('cbi-input-invalid'))
					document.querySelector('.cbi-button-save').click();
			});

			return node;
		};

		return m.render();
	},

	handleSave: function() {
		var map = document.querySelector('.cbi-map');

		return dom.callClassMethod(map, 'save').then(function() {
			if (formData.password.pw1 == null || formData.password.pw1.length == 0)
				return;

			if (formData.password.pw1 != formData.password.pw2) {
				ui.addNotification(null, E('p', _('Given password confirmation did not match, password not changed!')), 'danger');
				return;
			}

			return callSetPassword('root', formData.password.pw1).then(function(success) {
				if (success)
					ui.addNotification(null, E('p', _('The system password has been successfully changed.')), 'info');
				else
					ui.addNotification(null, E('p', _('Failed to change the system password.')), 'danger');

				formData.password.pw1 = null;
				formData.password.pw2 = null;

				dom.callClassMethod(map, 'render');
			});
		});
	},

	handleSaveApply: null,
	handleReset: null
});
