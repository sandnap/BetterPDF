enyo.kind({
	name: "BookmarksPanel",
	kind: enyo.Control,
	layoutKind: enyo.VFlexLayout,
	className: "tabPanel",
	
	published: {
		bookmarks: []
	},
	
	events: {
		onPageSelect: "",
		onCloseNavPane: "",
		onDeleteBookmark: ""
	},
	
	components: [
		{name: "bookmarksList", kind: "VirtualList", flex: 1, onSetupRow: "bookmarksSetupRow", components: [
			{kind: "SwipeableItem", layoutKind: "VFlexLayout", onclick: "bookmarkRowSelect", onConfirm: "deleteBookmark", components: [
				{name: "page", className: "bookmarkPage"},
				{name: "link", className: "bookmarkLink"}
			]}
		 ]}
	],
	
	updateBookmarks: function (bookmarks) {
		if (bookmarks !== null && bookmarks.length > 0) this.bookmarks = bookmarks;
		if (this.$.bookmarksList !== undefined) this.$.bookmarksList.reset();
	},

	bookmarksSetupRow: function (inSender, inIndex) {
		if (inIndex >= 0 && this.bookmarks && inIndex < this.bookmarks.length) {
			this.$.page.setContent("Page " + (1 + this.bookmarks[inIndex].page) + ":");
			this.$.link.setContent(this.bookmarks[inIndex].comment);
			return true;
		}
	},

	bookmarkRowSelect: function (inSender, event) {
		var index = this.bookmarks[event.rowIndex].page;
		this.doPageSelect(index + 1);
		this.doCloseNavPane();
	},

	deleteBookmark: function (sender, event) {
		this.doDeleteBookmark(this.bookmarks[event]._id);
	}
});