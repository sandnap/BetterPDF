enyo.kind({
	name: "PDFImageView",
	kind: enyo.VFlexBox,
	flex: 1,

	events: {
		onPageChange: "",
		onTitleUpdate: "",
		onDocLoaded: "",
		onThumbLoaded: ""
	},

	published: {
		doc: undefined,
		settings: undefined,
		file: undefined,
		service: null,
		imageDir: "/media/internal/.pdf_images/",
		scrollLocked: false,
		scrollLeft: 0,
		ratio: 1,
		currentPage: 0,
		orientation: undefined,
		pages: 0,
		resizeScreen: false,
		thumbsZoom: 60,
		pageZoom: 0
	},

	components: [
		{name: "viewOverlay", className: "viewOverlayHide", layoutKind: "VFlexLayout", align: "center", pack: "center",
			components: [{content: "", className: "loadingText"}]
		},
		{name: "onePageView", kind: "ImageView", className: "pdfView", layoutKind: "VFlexLayout", onGetLeft: "getPrevPage", onGetRight: "getNextPage", flex: 1,
			components: [
				{ name: "left",   kind: "Control", className: "pdf-page", showing: false },
				{ name: "center", kind: "Control", className: "pdf-page", showing: false },
				{ name: "right",  kind: "Control", className: "pdf-page", showing: false }
			]
		}
	],
	
	create: function () {
		this.inherited(arguments);
		this.setOrientation(enyo.getWindowOrientation());
	},
	
	openFile: function (path, nameonly) {
		this.init(nameonly);
		this.service.handleQueue({
			cmd: PDFService.open.op,
			src: path,
			response: this.openCallback.bind(this)
		});
	},
	
	init: function (nameonly) {
		this.currentName = nameonly;
		this.pages = undefined;
		this.cached = [];
	},
	
	openCallback: function (response) {
		var r = JSON.parse(response);
		if (r.error) {
			var err = (r.error === 'protected document') ? 'Password Required' : 'Unspecified Error';
			return;
		}
		this.pages = Number(r.pages || r.count);
		this.pageWidth = Number(r.width || r.slide_dom_width);
		this.pageHeight = Number(r.height || r.slide_dom_height);
		this.ratio = this.pageWidth / this.pageHeight;
		this.pageZoom = this.calculateImageZoom(this.pageWidth, this.pageHeight);
		this.placeholder = "images/loadingPDF.png";
		for (var i = 0; i < this.pages; i++) {
			this.setupImage(i);
		}
		this.$.onePageView.setCenterView(this.$.onePageView.images[0]);
		setTimeout(this.doDocLoaded.bind(this, this.pages, this.file.filename), 0);
		setTimeout(this.goToPage.bind(this, this.getDocAttributes().currentPage + 1), 0);
		// If we already rendered the thumbnails skip rendering
		if (this.getDocAttributes().pagesRendered === false)
			setTimeout(this.loadPages.bind(this, 0), 0);
		else
		  setTimeout(this.thumbPrerendered.bind(this, this.pages), 0);
	},
	
	setupImage: function(i) {
		this.placeholder = "images/loadingPDF.png";
		this.$.onePageView.images[i] = {
			src: this.placeholder,
			uid: i,
			imageZoom: -1
		};
		if (this.getDocAttributes().pagesRendered === true) {
			var pagePath = this.imageDir + this.file.filename + '/page-' + this.pad(i, 4) + '-' + this.pad(this.pageZoom, 3);
			this.$.onePageView.images[i].src = pagePath;
			this.$.onePageView.images[i].imageZoom = this.pageZoom;
			this.cached[i] = this.pageZoom;
			//enyo.error(pagePath);
		}
	},
	
	pad: function(input, len) {
		var pad = '0000000000000000' + input;
		return pad.substring(pad.length - len);
	},
	
	/*
	 * If the settings call for it load the thumbnails and pages on load
	 */
	loadPages: function(start) {
		if (start === 0) {
			start = this.getDocAttributes().lastPageRendered;
		}
		for (var i = start; i < this.pages; i++) {
			if (this.service.getQueue().length > 4) {
				// Throttle page rendering to prevent UI blocking
				setTimeout(this.loadPages.bind(this, i), 1000);
				return;
			}
			// Render thumbnail
			this.callRenderHandler(i, this.thumbsZoom, this.thumbPrerendered.bind(this, i));
			// Render page
			this.callRenderHandler(i, this.pageZoom, this.pagePrerendered.bind(this, i));
		}
		this.checkPreloadFinished();
	},
	
	checkPreloadFinished: function() {
		if (this.service.getQueue().length === 0) {
			this.getDocAttributes().pagesRendered = true;
			this.doc.setMerge(true);
		} else {
		  setTimeout(this.checkPreloadFinished.bind(this), 5000);
		}
	},
	
	thumbPrerendered: function(index) {
		// Caled when a thumbnail is prerendered
		this.doThumbLoaded(index);
	},
	
	pagePrerendered: function(index) {
		if (this.cached[index] === undefined) {
			this.setupImage(index);
			if (index % 10 === 0) {
				this.getDocAttributes().lastPageRendered = index;
				this.doc.setMerge(true);
			}
		}
	},
	
	callRenderHandler: function(page, zoom, callback) {
		this.service.handleQueue({
				cmd: PDFService.render.op,
				from: page,
				count: 1,
				zoom: zoom,
				dir: this.imageDir + this.file.filename + "/",
				prefix: 'page-',
				response: callback
			});
	},

	resizeHandler: function () {
		// We need to override this so that the image view doesn't resize unless the screen was rotated
		if (this.resizeScreen === true || enyo.getWindowOrientation() !== this.getOrientation()) {
			this.setOrientation(enyo.getWindowOrientation());
			this.inherited(arguments);
			this.resizeScreen = false;
			this.resetZoom();
		}
	},

	toggleScrollLock: function (lock) {
		if (lock === true) {
			this.scrollLeft = this.$.onePageView.fetchView("center").$.scroller.getScrollLeft();
		}
		this.setScrollLocked(lock);
	},

	scrollLockedChanged: function () {
		var c = this.$.onePageView.fetchView("center").$.scroller;
		c.setHorizontal(this.scrollLocked === false);
		c.setAutoHorizontal(this.scrollLocked === false);
		c.setScrollLeft(this.scrollLeft);

		if (this.$.onePageView.fetchView("left") !== undefined)
			var l = this.$.onePageView.fetchView("left").$.scroller;
		if (l !== undefined) {
			l.setHorizontal(this.scrollLocked === false);
			l.setAutoHorizontal(this.scrollLocked === false);
		}
		
		if (this.$.onePageView.fetchView("right") !== undefined)
			var r = this.$.onePageView.fetchView("right").$.scroller;
		if (r !== undefined) {
			r.setHorizontal(this.scrollLocked === false);
			r.setAutoHorizontal(this.scrollLocked === false);
		}
	},

	// This is going to handle Zoom gestures
	gestureendHandler: function (x, event) {
		if (event.type === "gestureend") {
			var z = this.$.onePageView.fetchCurrentView().getZoom();
			this.getDocAttributes().zoomLevel = z;
			if (this.$.onePageView.fetchView('left'))
				this.$.onePageView.fetchView('left').setZoom(z);
			if (this.$.onePageView.fetchView('right'))
				this.$.onePageView.fetchView('right').setZoom(z);
			// Save the change to the DB
			this.doc.setMerge(true);
		}
	},

	fileChanged: function () {
		if (this.file.filename === undefined) {
			this.file.filename = this.file.path.split('/').pop();
		}
		var fileNameSplit = this.file.filename.split(".");
		this.nameonly = fileNameSplit.join(".");
		this.doTitleUpdate(enyo.string.escapeHtml(this.nameonly));
		this.openFile(this.file.path, this.nameonly);
	},

	currentPageChanged: function () {
		this.showPDFOverlay();
		this.doPageChange({
			currentPage: (this.currentPage + 1),
			totalPages: this.pages
		});

		this.requestCurrentPage();

		if (this.currentPage > 0)
			this.requestPage(this.currentPage - 1, this.pageZoom);

		if (this.currentPage + 1 < this.pages)
			this.requestPage(this.currentPage + 1, this.pageZoom);
			
		setTimeout(this.resetZoom.bind(this), 0);
	},

	resetZoom: function () {
		if (this.doc !== undefined && this.doc !== null && this.$.onePageView.fetchCurrentView().imageZoom == this.pageZoom) {
			var cv = this.$.onePageView.fetchView('center');
			var rv = this.$.onePageView.fetchView('right');
			var zoom = this.getDocAttributes().zoomLevel;
			if (cv) {
				setTimeout(cv.setZoom(zoom), 100);
			}
			if (rv) {
				setTimeout(rv.setMaxZoomRatio(this.getDocAttributes().zoomRatio), 100);
				setTimeout(rv.setZoom(zoom), 100);
			}

			setTimeout(this.resetPosition.bind(this), 0);
		}
	},

	resetPosition: function () {
		setTimeout(this.scrollLockedChanged.bind(this), 0);
		setTimeout(this.hidePDFOverlay.bind(this), 700);
	},
	
	showPDFOverlay: function() {
		this.$.viewOverlay.addClass("viewOverlayShow");
	},
	
	hidePDFOverlay: function() {
		this.$.viewOverlay.removeClass("viewOverlayShow");
	},

	requestCurrentPage: function () {
		if (this.currentPage >= 0 && this.currentPage < this.pages) {
			this.requestPage(this.currentPage, this.pageZoom);
			// Set the value for the database and merge
			this.getDocAttributes().currentPage = this.currentPage;
			this.doc.setMerge(true);
		}
	},

	requestPage: function (index, zoom) {
		if (this.cached[index] === undefined) {
			this.callRenderHandler(index, zoom, this.requestPageCallback.bind(this, zoom));
			this.cached[index] = zoom;
		} else {
			this.updateAllViewsIfNeeded(this.$.onePageView.images[index]);
		}
	},

	requestPageCallback: function (zoom, response) {
		var r = JSON.parse(response);
		var index = r.from !== undefined ? r.from : (r.slideNumber - 1);
		this.updateImage(index, r.image, zoom);
		if (index + 1 < this.pages && index === this.currentPage)
			this.requestPage(index + 1, this.pageZoom);
	},

	updateImage: function (imageIndex, newImageSrc, zoom) {

		if (imageIndex < 0 || imageIndex >= this.pages) {
			throw ("Invalid page index");
		}

		var changedImage = this.$.onePageView.images[imageIndex];

		if (changedImage.imageZoom < zoom) {

			changedImage.src = newImageSrc;
			changedImage.imageZoom = zoom;

			this.updateAllViewsIfNeeded(changedImage);
		}
	},

	updateAllViewsIfNeeded: function (newImage) {
		var leftViewImage = this.$.onePageView.fetchView('left');
		this.updateViewIfNeeded(leftViewImage, newImage);

		var centerViewImage = this.$.onePageView.fetchView('center');
		this.updateViewIfNeeded(centerViewImage, newImage);

		var rightViewImage = this.$.onePageView.fetchView('right');
		this.updateViewIfNeeded(rightViewImage, newImage);
	},

	updateViewIfNeeded: function (oldImage, newImage) {
		if (oldImage && oldImage.uid === newImage.uid && oldImage.src !== newImage.src && oldImage.imageZoom < newImage.imageZoom) {
			oldImage.imageZoom = newImage.imageZoom;
			oldImage.setSrc(newImage.src);
			oldImage.imageLoaded();
		}
		setTimeout(this.resetZoom.bind(this), 1000);
	},

	goToPage: function (page) {
		this.setCurrentPage(page - 1);
		this.$.onePageView.setCenterView(this.$.onePageView.images[page - 1]);
	},

	goPrev: function () {
		if (this.currentPage > 0) this.goToPage(this.currentPage);
	},

	goNext: function () {
		if (this.currentPage + 1 < this.pages) this.goToPage(this.currentPage + 2);
	},

	getPrevPage: function (inSender, inSnap) {
		if (inSnap && this.currentPage > 0) this.setCurrentPage(this.currentPage - 1);
		return this.$.onePageView.images[this.currentPage - 1];
	},

	getNextPage: function (inSender, inSnap) {
		if (inSnap && this.currentPage + 1 < this.pages) this.setCurrentPage(this.currentPage + 1);
		return this.$.onePageView.images[this.currentPage + 1];
	},

	calculateImageZoom: function (imageWidth, imageHeight) {
		var width = imageWidth / imageHeight >= 1 ? 1500 : imageWidth * 1500 / imageHeight;
		return Math.max(Math.min(Math.ceil(width * 100 / imageWidth), 500), 5);
	},

	getDocAttributes: function () {
		return this.doc.getAttributes();
	}
});