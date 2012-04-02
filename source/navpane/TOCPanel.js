enyo.kind({
	name: "TOCPanel",
	kind: enyo.Control,
	layoutKind: enyo.VFlexLayout,
	className: "tabPanel",

	published: {
		toc: [{p: 0, l: -1, c: 'Table of Contents Not Available'}]
	},

	events: {
		onPageSelect: "",
		onCloseNavPane: "",
		onRender: ""
	},

	components: [
		{name: "tocList", kind: "VirtualList", flex: 1, className: "toc", onSetupRow: "tocSetupRow", components: [
			{kind: "VFlexBox", onclick: "tocRowSelect", components: [
				{name: "link", className: "tocLink"}
			]}
		]
	}],
	
	callTocService: function (service) {
		service.handleQueue({
			cmd: PDFService.toc.op,
			response: this.tocCallback.bind(this)
		});
	},

	tocCallback: function (response) {
		var r = JSON.parse(response);
		if (r.toc !== undefined && r.toc.length > 0) {
			this.toc = r.toc;
			this.$.tocList.reset();
		}
	},

	updateToc: function (toc) {
		if (toc !== null && toc.length > 0) this.toc = toc;
		if (this.$.tocList !== undefined) this.$.tocList.reset();
	},

	tocSetupRow: function (inSender, inIndex) {
		if(this.toc.length === 1)  {
			this.doRender();
			return false;
		}
		if (inIndex >= 0 && this.toc && inIndex < this.toc.length) {
			var i = inIndex;
			this.$.link.addClass('tocLink' + Math.min(this.toc[i].l, 5));
			this.$.link.setContent(this.toc[i].c);
			return true;
		}
	},

	tocRowSelect: function (inSender, event) {
		var index = this.toc[event.rowIndex].p;
		this.doPageSelect(index + 1);
		this.doCloseNavPane();
	}
});