enyo.kind({
	name: "PDFDocument",
	kind: "Control",
	
	published: {
		id: "",
		attributes: {
			_kind: "net.better-apps.betterpdf.pdf.db:1",
			fileName: "",
			path: "",
			bookmarks: [],
			currentPage: 0,
			tocPageOne: 1,
			rotated: false,
			twoPageView: false,
			keepPositionY: false,
			keepPositionX: false,
			positionEvenX: 0,
			positionEvenY: 0,
			positionOddX: 0,
			positionOddY: 0,
			zoomLevel: 0,
			zoomRatio: 10,
			pagesRendered: false,
			lastPageRendered: 0
		},
		put: false,
		merge: false,
		loaded: false
	},
	
	components: [
		{
			kind: "DbService", dbKind: "net.better-apps.betterpdf.pdf.db:1", onFailure: "dbFailure",
			components: [
				{name: "putKind", method: "put", onSuccess: "putSuccess"},
				{name: "getKind", method: "get", onSuccess: "getSuccess"},
				{name: "findKind", method: "find", onSuccess: "findSuccess"},
				{name: "mergeKind", method: "merge", onSuccess: "mergeSuccess"}
			]
		},
	],
	
	addBookmark: function(comment) {
		var bm = {page: this.getAttributes().currentPage, comment: comment};
		this.getAttributes().bookmarks.push(bm);
		this.setMerge(true);
	},
	
	removeBookmark: function(id) {
		for (var i=0;i<this.getAttributes().bookmarks.length;i++) {
			if (this.getAttributes().bookmarks[i]._id === id) {
				this.getAttributes().bookmarks.splice(i, 1);
				this.setMerge(true);
				break;
			}
		}
	},
	
	findDocument: function(filename, callback) {
		this.findCallback = callback;
		this.getAttributes().fileName=filename;
		var fquery = {"from":"net.better-apps.betterpdf.pdf.db:1",
				   "where":[{"prop":"fileName","op":"=","val":filename}]};
		this.$.findKind.call({query:fquery});
	},
	
	putChanged: function() {
		var objs = [
			this.attributes
		];
		this.$.putKind.call({objects: objs});
		
		this.put = false;
	},
	
	mergeChanged: function() {
		this.getAttributes()._id = this.id;
		var objs = [
			this.attributes
		];
		this.$.mergeKind.call({objects: objs});
		
		this.merge = false; // Make sure this doesn't create a loop
	},
	
	findSuccess: function(event, result) {
		if (result.results.length == 0) {
			this.setPut(true);
			return;
		}
		this.id=result.results[0]._id;
		this.getAttributes().fileName=result.results[0].fileName;
		this.getAttributes().path=result.results[0].path;
		this.getAttributes().bookmarks=result.results[0].bookmarks;
		this.getAttributes().currentPage=result.results[0].currentPage;
		this.getAttributes().keepPositionY=result.results[0].keepPositionY;
		this.getAttributes().keepPositionX=result.results[0].keepPositionX;
		this.getAttributes().tocPageOne=result.results[0].tocPageOne;
		this.getAttributes().rotated=result.results[0].rotated;
		this.getAttributes().twoPageView=result.results[0].twoPageView;
		this.getAttributes().positionEvenY=result.results[0].positionEvenY;
		this.getAttributes().positionEvenX=result.results[0].positionEvenX;
		this.getAttributes().positionOddY=result.results[0].positionOddY;
		this.getAttributes().positionOddX=result.results[0].positionOddX;
		this.getAttributes().zoomLevel=result.results[0].zoomLevel;
		this.getAttributes().zoomRatio=result.results[0].zoomRatio;
		this.getAttributes().pagesRendered=result.results[0].pagesRendered;
		this.getAttributes().lastPageRendered=result.results[0].lastPageRendered;
		this.findCallback();
	},
	
	putSuccess: function(event, result) {
		this.findDocument(this.getAttributes().fileName, this.findCallback);
	},
	
	getSuccess: function(event, result) {},
	
	mergeSuccess: function(event, result) {},
	
	dbFailure: function(event, result) {
		enyo.error("Database Call Error: " + enyo.json.stringify(result));
	}
});