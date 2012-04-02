enyo.kind({
	name: "PDFPane",
	kind: enyo.Control,
	layoutKind: "VFlexLayout",
	flex: 1,

	events: {
		onNavPaneButton: "",
		onDocLoaded: "",
		onAddBookmark: "",
		onSaveSettings: "",
		onPageChanged: "",
		onThumbLoaded: ""
	},

	published: {
		scrollLocked: false,
		fullScreen: false
	},
	 
	components: [
		 {kind: "Drawer", name: "topToolbar", className: "topToolbar", components: [
				{kind: "Control", className: "toolbarBackground", components: [
					{kind: "Control", style: "float: left; padding-left: 10px;", components: [
					 {kind: "Image", className: "toolbarImage", src: "images/sh.png"}
					]},
					{kind: "Control", name: "bookTitle", className: "bookTitle", content: ""},
					{kind: "Control", style: "float: right; width: 200px;", components: [
					 {kind: "Control", className: "inlineLeft", style: "width: 40px;", components: [
							{kind: "Image", className: "toolbarImage", src: "images/an.png"}
					 ]},
					 {kind: "Control", className: "inlineLeft", style: "width: 40px;", components: [
							{kind: "Image", className: "toolbarImage", onmousedown: "lockScroll", src: "images/hz.png"}
					 ]},
					 {kind: "Control", className: "inlineLeft", style: "width: 40px;", components: [
							{kind: "Image", className: "toolbarImage", src: "images/tp.png"}
					 ]},
					 {kind: "Control", className: "inlineLeft", style: "width: 40px;", components: [
							{kind: "Image", className: "toolbarImage", onmousedown: "toggleFullScreen", src: "images/fs.png"}
					 ]},
					 {kind: "Control", className: "inlineLeft", style: "width: 40px;", components: [
							{kind: "Image", className: "toolbarImage", onmousedown: "addBookmarkEvent", src: "images/abm.png"}
					 ]}
					]}
				]}
		 ]},
		 { name: "pdfImageView", kind: "PDFImageView",
				onDocLoaded: "doDocLoaded",
				onPageChange: "pageChanged",
				onTitleUpdate: "updateTitle",
				onThumbLoaded: "doThumbLoaded",
				onclick: "click"
		 },
		 {kind: "Drawer", name: "bottomToolbar", animate: false, className: "bottomToolbar", components: [
			 {kind: "Control", className: "toolbarBackground", components: [
				 {kind: "Control", className: "bottomCenterToolbarSection", components: [
					 {kind: "Image", src: "images/grabbutton.png", className: "grabButton", onmousedown: "doNavPaneButton"},
					 {kind: enyo.Input, name: "pageNumInput", value: 30, style: "width: 30%; float: left;", selectAllOnFocus: true, inputClassName: "pageNumberInput", focusClassName: "pageNumberInputFocus", onchange: "changePage"},
					 {kind: enyo.HtmlContent, name: "pageNumText", content: "(3) of 346", className: "pageNumberText"}
				 ]},
				 {kind: "Control", className: "bottomRightToolbarSection", components: [
					 {kind: "Image", src: "images/settings.png", className: "settingsImage", onclick: "settingsEvent"}
				 ]}
			 ]}
		 ]},
		 {kind: "ModalDialog", name: "addBookmarkDialog", layoutKind: "VFlexLayout", caption: "Add Bookmark", components: [
			 {kind: "RichText", name: "comment", style: "width: 300px; height: 200px;", hint: "Tap to add bookmark comment"},
			 {kind: "Control", layoutKind: "HFlexLayout", pack: "center", components: [
				 {kind: "Button", name: "save", caption: "Save", onclick: "saveBookmark"},
				 {kind: "Button", name: "cancel", caption: "Cancel", onclick: "closeAddBookmarkDialog"}
			 ]}
		 ]},
		 {kind: "ModalDialog", name: "settingsDialog", layoutKind: "VFlexLayout", caption: "Document Settings", components: [
			{kind: "RowGroup", caption: "General", components: [
				{layoutKind: "HFlexLayout", components: [
					{content: "TOC Page One", flex: 1},
					{kind: "BasicInput", style: "width: 70px;", name: "tocPageOne"}
				]},
				{layoutKind: "HFlexLayout", components: [
					{content: "Clear Page Cache", flex: 1},
					{kind: "Button", style: "", caption: "Clear", onclick: "clearPageCache", name: "clearPageCache"}
				]}
			]},
			 {kind: "Control", className: "dialogButtons", layoutKind: "HFlexLayout", pack: "center", components: [
				 {kind: "Button", name: "save", caption: "Save", onclick: "saveSettings"},
				 {kind: "Button", name: "cancel", caption: "Cancel", onclick: "closeSettingsDialog"}
			 ]}
		 ]}
	],
	
	click: function (inSender, e) {
		if (e.y > window.screen.height / Number(14)) {
			if (e.x < window.screen.width / Number(6)) this.previousPage();
			else if (e.x > window.screen.width * (Number(6) - 1) / Number(6)) this.nextPage();
			else {
				this.toggleToolbars();
			}
		} else {
			this.toggleToolbars();
		}
	},

	toggleToolbars: function () {
		this.$.topToolbar.toggleOpen();
		this.$.bottomToolbar.toggleOpen();
		this.$.topToolbar.setClassName("topToolbarClosed");
		if (this.$.topToolbar.open) this.$.topToolbar.setClassName("topToolbar");
		this.$.bottomToolbar.setClassName("bottomToolbarClosed");
		if (this.$.bottomToolbar.open) this.$.bottomToolbar.setClassName("bottomToolbar");
	},

	lockScroll: function (sender, event) {
		this.scrollLocked = (this.scrollLocked === false);
		if (this.scrollLocked === true) {
			sender.addClass("toolBarImageBorder");
			this.$.pdfImageView.toggleScrollLock(true);
		} else {
			sender.removeClass("toolBarImageBorder");
			this.$.pdfImageView.toggleScrollLock(false);
		}
	},

	toggleFullScreen: function (sender, event) {
		this.$.pdfImageView.setResizeScreen(true);
		this.fullScreen = (this.fullScreen === false);
		if (this.fullScreen === true) {
			sender.addClass("toolBarImageBorder");
			enyo.setFullScreen(true);
		} else {
			sender.removeClass("toolBarImageBorder");
			enyo.setFullScreen(false);
		}
	},

	resize: function () {
		var w = this.$.topToolbar.hasNode().parentNode.style.width;
		this.$.topToolbar.setStyle("width: " + w);
		this.$.bottomToolbar.setStyle("width: " + w);
	},

	/*
	 * The user changed the page using the input text box
	 */
	changePage: function () {
		this.$.pageNumInput.forceBlur();
		var tocPageOne = this.$.pdfImageView.getDoc().getAttributes().tocPageOne;
		if (isNaN(tocPageOne)) tocPageOne = 0;
		var realPage = parseInt(this.$.pageNumInput.getValue()) + parseInt(tocPageOne);
		setTimeout(this.goToPage.bind(this, realPage - 1), 500);
	},

	/*
	 * The document has been loaded time to display the title
	 */
	updateTitle: function (event, result) {
		if (result && result.length > 45) result = result.substring(0, 45) + "...";
		this.$.bookTitle.setContent(result);
	},

	/*
	 * We received a page changed event from the image view update the current page label
	 */
	pageChanged: function (event, result) {
		// Update the current page label
		var tocPageOne = this.$.pdfImageView.getDoc().getAttributes().tocPageOne;
		if (isNaN(tocPageOne)) tocPageOne = 1;
		var calculatedPage = parseInt(result.currentPage) - parseInt(tocPageOne);
		this.$.pageNumInput.setValue(1 + calculatedPage);
		this.$.pageNumText.setContent("(" + result.currentPage + ") of " + result.totalPages);
		this.doPageChanged(result.currentPage);
	},

	/*
	 * If the user types in a specific page or clicks a bookmark, toc link, etc...
	 * tell the image view to go to that page
	 */
	goToPage: function (newPage) {
		this.$.pdfImageView.goToPage(newPage);
	},

	/*
	 * If the user taps on the previous sections on the screen tell the image view
	 * to go to the previous page.
	 */
	previousPage: function () {
		this.$.pdfImageView.goPrev();
	},

	/*
	 * If the user taps on the next sections on the screen tell the image view
	 * to go to the next page.
	 */
	nextPage: function () {
		this.$.pdfImageView.goNext();
	},

	/*
	 * Open the dialog to add a bookmark for the current page
	 */
	addBookmarkEvent: function () {
		this.$.addBookmarkDialog.openAtCenter();
	},

	saveBookmark: function () {
		this.doAddBookmark(this.$.comment.getValue());
		this.$.comment.setValue("");
		this.closeAddBookmarkDialog();
	},

	closeAddBookmarkDialog: function () {
		this.$.addBookmarkDialog.close();
	},

	/*
	 * Open the settings dialog
	 */
	settingsEvent: function () {
		this.$.settingsDialog.openAtCenter();
		this.$.clearPageCache.setCaption("Clear");
		var tocP1 = this.$.pdfImageView.getDoc().getAttributes().tocPageOne;
		if (tocP1 === undefined) tocP1 = 1;
		this.$.tocPageOne.setValue(tocP1);
	},

	saveSettings: function () {
		var tocP1 = this.$.tocPageOne.getValue();
		if (isNaN(tocP1)) tocP1 = 1;
		this.doSaveSettings(tocP1);
		this.closeSettingsDialog();
	},

	closeSettingsDialog: function () {
		this.$.settingsDialog.close();
	},
	
	clearPageCache: function() {
		this.$.pdfImageView.getDoc().getAttributes().pagesRendered = false;
		this.$.pdfImageView.getDoc().getAttributes().lastPageRendered = 0;
		this.$.pdfImageView.getDoc().setMerge(true);
		this.$.clearPageCache.setCaption("Cleared");
		setTimeout(this.$.pdfImageView.loadPages.bind(this.$.pdfImageView, 0), 0);
	}
});