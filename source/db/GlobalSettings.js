enyo.kind({
	name: "GlobalSettings",
	kind: "Control",

	published: {
		id: "",
		settings: {
			_kind: "net.better-apps.betterpdf.global.db:1"
		},
		put: false,
		merge: false
	},

	components: [
		{
			kind: "DbService", dbKind: "net.better-apps.betterpdf.global.db:1", onFailure: "dbFailure",
			components: [
				{name: "putKind", method: "put", onSuccess: "putSuccess"},
				{name: "getKind", method: "get", onSuccess: "getSuccess"},
				{name: "findKind", method: "find", onSuccess: "findSuccess"},
				{name: "mergeKind", method: "merge", onSuccess: "mergeSuccess"}
			]
		},
	],

	findSettings: function (findCallback) {
		this.findCallback = findCallback;
		var fquery = {
			"from": "net.better-apps.betterpdf.global.db:1"
		};
		this.$.findKind.call({
			query: fquery
		});
	},

	putChanged: function () {
		var objs = [
			this.settings
		];
		this.$.putKind.call({
			objects: objs
		});

		this.put = false;
	},

	mergeChanged: function () {
		var objs = [
			this.settings
			];
		this.$.mergeKind.call({
			objects: objs
		});

		this.merge = false;
	},

	findSuccess: function (event, result) {
		if (result.results.length == 0) {
			this.setPut(true);
			return;
		}
		this.getSettings()._id = result.results[0]._id;
		this.findCallback();
	},

	putSuccess: function (event, result) {
		this.findSettings();
	},

	getSuccess: function (event, result) {},

	mergeSuccess: function (event, result) {},

	dbFailure: function (event, result) {
		enyo.error("Database Call Error: " + enyo.json.stringify(result));
	}
});