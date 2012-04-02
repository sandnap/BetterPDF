enyo.kind({
	name: "ThumbsPanel",
	kind: enyo.Control,
	layoutKind: enyo.VFlexLayout,
	className: "tabPanel",
	
	published: {
		thumbs: [],
		thumbsZoom: 60,
		imageDir: "/media/internal/.pdf_images/",
		totalPages: 0,
		currentPage: 1,
		service: undefined,
		fileName: ""
	},
	
	events: {
		onRender: "",
		onPageSelect: "",
		onCloseNavPane: ""
	},
	
	components: [
		{kind: "VirtualList", flex: 1, name: "thumbsList", lookAhead: 1, onAcquirePage: "acquirePage", onSetupRow: "renderThumbsList", components: [
			{kind: "Item", layoutKind: "VFlexLayout", onclick: "thumbClicked", components: [
				{kind: "Image", name: "image", src: "", className: "thumbImage"}
			]}
		]}
	],
	
	currentPageChanged: function() {
		this.$.thumbsList.$.scroller.top = this.currentPage > 0 ? this.currentPage - 1 : 0;
		this.$.thumbsList.$.scroller.bottom = this.$.thumbsList.$.scroller.top + 10 < this.totalPages ?
								this.$.thumbsList.$.scroller.top + 10 : this.totalPages;
	},
	
	refresh: function() {
		this.$.thumbsList.refresh();
	},
	
	acquirePage: function(inSender, inPage) {
		var firstTime = false;
		if (this.thumbs.length === 0) {
			this.doRender();
			firstTime = true;
		}
		var index = inSender.pageSize * inPage;
		if (this.thumbs.length > 0) {
			this.renderThumbs(index, 10);
			if (firstTime) {
				this.currentPageChanged();
			}
		}
	},
	
	markThumbsLoadedTo: function(index) {
		if (this.thumbs.length === 0) return;
		if (this.thumbs[index - 1].rendered === false) {
			// Loop through and mark all up to index as rendered
			for (var i = 0; i <= index; i++)
				this.thumbs[i].rendered = true;
		} else {
			this.thumbs[index].rendered = true;
		}
	},
	
	callRenderService: function(service, totalPages, currentPage, fileName) {
		this.service = service;
		this.totalPages = totalPages;
		this.currentPage = currentPage;
		this.fileName = fileName;
		if (this.thumbs.length === 0) this.setupThumbsArray(totalPages);
	},
	
	renderThumbs: function(first, count) {
		for (var i = 0; i < count; i++) {
			if (first > -1 && first < this.totalPages && this.thumbs[first + i].rendered === false) {
				this.service.handleQueue({
					cmd: PDFService.render.op,
					from: first + i,
					count: 1,
					zoom: this.thumbsZoom,
					dir: this.imageDir + this.fileName + "/",
					prefix: 'page-',
					response: this.requestPageCallback.bind(this, this.thumbsZoom, i)
				});
			} else {
				//this.refresh();
			}
		}
	},
	
	requestPageCallback: function (zoom, setIndex, response) {
		var r = JSON.parse(response);
		var index = r.from !== undefined ? r.from : (r.slideNumber - 1);
		this.requestPage(index, setIndex, r.image);
	},
	
	requestPage: function(index, setIndex, url) {
		this.thumbs[index] = {url: url, rendered: true, page: index};
		if (setIndex % 5 === 0 || index === this.totalPages)
			this.refresh();
	},
	
	setupThumbsArray: function(totalPages) {
		for (var i = 0; i <= totalPages; i++) {
			this.thumbs.push({url: this.imageDir + this.fileName + "/" + "page-" + this.padFour(i) + "-060" ,
											 rendered: false, page: i});
		}
	},
	
	padFour: function(input) {
		var pad = '0000' + input;
		return pad.substring(pad.length - 4);
	},
	
	renderThumbsList: function(inSender, inIndex) {
		if (inIndex >= 0 && this.thumbs && inIndex < this.thumbs.length) {
			this.$.image.setSrc(this.thumbs[inIndex].url);
			if(this.thumbs[inIndex].page === this.currentPage - 1)
				this.$.image.addClass("thumbCurrentImage");
			else
				this.$.image.removeClass("thumbCurrentImage");
			return true;
		}
	},

	thumbClicked: function (inSender, event) {
		var index = this.thumbs[event.rowIndex].page;
		this.doPageSelect(index + 1);
		this.doCloseNavPane();
	},
});