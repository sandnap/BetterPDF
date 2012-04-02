enyo.kind({
	name: "PDFFile",
	kind: "Component",

	published: {
		fileName: "",
		uri: ""
	},

	statics: {
		getFilenameFromUri: function (uri) {
			var s = uri.split('/');
			return s[s.length - 1];
		},
		
		removeFileProtocol: function (uri) {
			if (uri !== undefined && uri.toLowerCase().indexOf("file://") === 0) {
				return uri.substring(7);
			}
			return uri;
		},
		
		parseFilename: function (file) {
			ext = file.lastIndexOf(".");
			var name = ext > -1 ? file.substr(0, ext) : file;
			return name;
		}
	},

	/*
	 * Calling the parent constructor will load the fileName and uri passed in as 'arguments'
	 */
	create: function () {
		this.inherited(arguments);
	}
});