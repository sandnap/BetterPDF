enyo.kind({
	name: "NavPane",
	kind: enyo.Toaster,
	flyInFrom: "left",
	style: "opacity: 0.9; z-index: 20;",
	layoutKind: enyo.VFlexLayout,
	
	published: {
		service: undefined,
		fileName: "",
		totalPages: 1,
		currentPage: 1,
		toc: "",
		thumbsLoadedIndex: 0
	},

	events: {
		onPageChange: "",
		onDeleteBookmark: ""
	},

	components: [
		{className: "tabButtonGroup", components: [
			/*{className: "tabButtonFocus", name: "annot", onclick: "setTabPanel", components: [
				{kind: "Image", className: "tabImage", src: "images/an.png"}
			]},*/
			{className: "tabButton", name: "bookmarks", onclick: "setTabPanel", components: [
				{kind: "Image", className: "tabImage", src: "images/bm.png"}
			]},
			{className: "tabButton", name: "toc", onclick: "setTabPanel", components: [
				{kind: "Image", className: "tabImage", src: "images/toc.png"}
			]},
			{className: "tabButton", name: "thumbs", onclick: "setTabPanel", components: [
				{kind: "Image", className: "tabImage", src: "images/th.png"}
			]},
			{className: "tabButton", name: "search", onclick: "setTabPanel", components: [
				{kind: "Image", className: "tabImage", src: "images/s1.png"}
			]}
		]},
		{kind: enyo.Pane, name: "tabPane", flex: 1, components: [
			//{kind: "SearchPanel", name: "annotPanel"},
			{kind: "BookmarksPanel", name: "bookmarksPanel", onPageSelect: "doPageChange", onCloseNavPane: "closeNavPane", onDeleteBookmark: "doDeleteBookmark"},
			{kind: "TOCPanel", name: "tocPanel", onRender: "renderToc", onPageSelect: "doPageChange", onCloseNavPane: "closeNavPane"},
			{kind: "ThumbsPanel", name: "thumbsPanel", onRender: "renderThumbs", onPageSelect: "doPageChange", onCloseNavPane: "closeNavPane"},
			{kind: "SearchPanel", name: "searchPanel"}
		 ]},
		{kind: "Control", className: "navToolbar", components: [
			{kind: enyo.GrabButton, onclick: "closeNavPane"}
		]},
	],
	
	/*
	 * Called when prerendering thumbnails for each thumbnail loaded incrementally from 0
	 */
	thumbsLoadedIndexChanged: function() {
		if (this.$.thumbsPanel)
			this.$.thumbsPanel.markThumbsLoadedTo(this.thumbsLoadedIndex);
	},
	
	currentPageChanged: function() {
		if (this.$.thumbsPanel !== undefined)
			this.$.thumbsPanel.setCurrentPage(this.currentPage);
	},
	
	renderThumbs: function() {
		this.$.thumbsPanel.callRenderService(this.service, this.totalPages, this.currentPage, this.fileName);
	},
	
	renderToc: function() {
		this.$.tocPanel.callTocService(this.service);
	},
	
	setupThumbs: function(service, totalPages, currentPage, fileName) {
		this.totalPages = totalPages;
		this.currentPage = currentPage;
		this.service = service;
		this.fileName = fileName;
	},
	
	setupToc: function(service) {
		this.service = service;
	},

	setDefaultTab: function () {
		//this.$.tabPane.selectViewByName("tocPanel", true);
		this.setTabPanelByName("tocPanel", this.$.toc);
	},

	setTabPanel: function (inSender, msg) {
		this.setTabPanelByName(inSender.name + "Panel", inSender);
	},

	setTabPanelByName: function (name, tab) {
		this.$.tabPane.selectViewByName(name, true);
		//this.$.annot.setClassName("tabButton");
		this.$.bookmarks.setClassName("tabButton");
		this.$.toc.setClassName("tabButton");
		this.$.search.setClassName("tabButton");
		this.$.thumbs.setClassName("tabButton");
		tab.setClassName("tabButtonFocus");
	},

	closeNavPane: function () {
		this.close();
	},

	updateToc: function () {
		this.$.tocPanel.updateToc();
	},

	tocLoaded: function (toc) {
		this.$.tocPanel.updateToc(toc);
	},

	bookmarksLoaded: function (bookmarks) {
		if (this.$.bookmarksPanel !== undefined) this.$.bookmarksPanel.updateBookmarks(bookmarks);
	}
});