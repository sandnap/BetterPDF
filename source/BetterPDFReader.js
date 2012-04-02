enyo.kind({
	name: "BetterPDFReader",
	kind: "VFlexBox",

	published: {
		pdfFile: undefined,
		firstTime: true
	},

	components: [
		{name: "pdfService", kind: "PDFService"},
		{name: "doc", kind: "PDFDocument"},
		{name: "settings", kind: "GlobalSettings"},
		{kind: "AppMenu", name: "appMenu", lazy: false, components: [
			{caption: $L("Preferences"), onclick: "showPreferences"},
			{caption: $L("Help"), onclick: "showHelp"},
			{caption: $L("About"), onclick: "showAbout"},
		]},
		{
			name: "pdfPane",
			width: "100%",
			kind: "PDFPane",
			onDocLoaded: "docLoaded",
			onNavPaneButton: "openNavPane",
			onAddBookmark: "addBookmark",
			onSaveSettings: "saveDocSettings",
			onPageChanged: "pageChanged",
			onThumbLoaded: "thumbLoaded"
		},
		{
			name: "navPane",
			className: "navPane",
			kind: "NavPane",
			dismissWithClick: false,
			onPageChange: "changePage",
			onDeleteBookmark: "deleteBookmark"
		},
		{kind: "ModalDialog", name: "preferencesDialog", style: "width: 500px; height: 500px;", layoutKind: "VFlexLayout", caption: "Preferences", components: [
			{kind: "RowGroup", caption: "General", components: [
				{layoutKind: "HFlexLayout", components: [
					{content: "Render Pages on Open", flex: 1},
					{kind: "ToggleButton", name: "renderPagesOnOpen"}
				]}
			]},
			{kind: "Control", className: "dialogButtons", layoutKind: "HFlexLayout", pack: "center", components: [
				{kind: "Button", name: "save", caption: "Save", onclick: "savePreferences"},
				{kind: "Button", name: "cancel", caption: "Cancel", onclick: "closePreferencesDialog"}
			]}
		]},
		{kind: "Popup", name: "helpPopup", style: "width: 500px; height: 500px;", components: [
		]},
		{kind: "Popup", name: "aboutPopup", style: "width: 500px; height: 500px;", components: [
		]}
	],

	create: function () {
		this.inherited(arguments);
		params = enyo.windowParams;
		config = {
			uri: PDFFile.removeFileProtocol(params.target)
		};
		params.fileName = PDFFile.getFilenameFromUri(config.uri);
		config.fileName = PDFFile.parseFilename(params.fileName);
		pdfFile = new PDFFile(config);
		this.setPdfFile(pdfFile);
	},
	
	thumbLoaded: function(sender, index) {
		this.$.navPane.setThumbsLoadedIndex(index);
	},
	
	docLoaded: function(sender, totalPages, fileName) {
		// Send the signal to load the thumbnails
		this.$.navPane.setupThumbs(this.$.pdfService, totalPages, this.$.doc.getAttributes().currentPage, fileName);
		this.$.navPane.setupToc(this.$.pdfService);
	},
	
	pageChanged: function(sender, currentPage) {
		this.$.navPane.setCurrentPage(currentPage);
	},

	openNavPane: function () {
		var np = this.$.navPane;
		np.open();
		np.bookmarksLoaded(this.$.doc.getAttributes().bookmarks);
		if (this.firstTime == true) {
			this.firstTime = false;
			np.setDefaultTab();
		}
	},

	/*
	 * Called by the framework when the page is rendered.
	 */
	rendered: function () {
		this.inherited(arguments);
		this.loadDBRecord();
	},

	loadDBRecord: function () {
		// Load the database record for the document or create a new one
		this.$.doc.findDocument(this.pdfFile.getFileName(), this.docDataLoaded.bind(this));
		// Load the global settings database record or create a new one
		this.$.settings.findSettings(this.settingsDataLoaded.bind(this));
	},

	docDataLoaded: function () {
		// Now set the file so the document can be loaded
		this.$.pdfPane.$.pdfImageView.setService(this.$.pdfService);
		// Set the document in the image view so it can set zoom, current page, etc...
		this.$.pdfPane.$.pdfImageView.setDoc(this.$.doc);
		this.$.pdfPane.$.pdfImageView.setFile({
			path: this.pdfFile.uri
		});
	},
	
	settingsDataLoaded: function() {
		// Set the (global) settings so that they are available for doc rendering options
		this.$.pdfPane.$.pdfImageView.setSettings(this.$.settings);
	},

	changePage: function (sender, pageNum) {
		this.$.pdfPane.goToPage(pageNum);
	},

	deleteBookmark: function (sender, id) {
		this.$.doc.removeBookmark(id);
		setTimeout(this.refreshBookmarks.bind(this), 500);
	},

	addBookmark: function (sender, comment) {
		this.$.doc.addBookmark(comment);
		setTimeout(this.refreshBookmarks.bind(this), 500);
	},

	refreshBookmarks: function () {
		this.$.navPane.bookmarksLoaded(this.$.doc.getAttributes().bookmarks);
	},

	saveDocSettings: function (sender, tocPageOne) {
		this.$.doc.getAttributes().tocPageOne = tocPageOne;
		// Save the document record
		this.$.doc.setMerge(true);
	},
	
	showPreferences: function() {
		this.$.preferencesDialog.openAtCenter();
		//this.$.renderPagesOnOpen.setState(this.$.settings.getSettings().renderPagesOnOpen);
	},
	
	savePreferences: function() {
		//this.$.settings.getSettings().renderPagesOnOpen = this.$.renderPagesOnOpen.getState();
		// Save the settings record
		this.$.settings.setMerge(true);
		this.closePreferencesDialog();
	},
	
	closePreferencesDialog: function() {
		this.$.preferencesDialog.close();
	},
	
	showHelp: function() {
		this.$.helpPopup.openAtCenter();
	},
	
	showAbout: function() {
		this.$.aboutPopup.openAtCenter();
	}
});