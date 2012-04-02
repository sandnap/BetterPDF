enyo.kind({
	name: "PDFService",
	kind: "enyo.Control",

	published: {
		loaded: false,
		plugin: null,
		queue: []
	},
	
	statics: {
		idle: {op: 'idle', cb: 'IdleCallback'},
		shell: {op: 'shell', cb: 'ShellCallback'},
		open: {op: 'open', cb: 'OpenCallback'},
		cover: {op: 'cover', cb: 'CoverCallback'},
		toc: {op: 'toc', cb: 'TocCallback'},
		render: {op: 'render', cb: 'RenderCallback'},
		delete: {op: 'delete', cb: 'DeleteCallback'},
		find: {op: 'find', cb: 'FindCallback'},
		saveAs: {op: 'saveas', cb: 'SaveAsCallback'}
	},

	components: [
		{
			kind: "enyo.Hybrid",
			executable: "import/pdfservice",
			className: "serviceDiv",
			onPluginReady: "pluginReady",
			onPluginConnected: "pluginConnected",
			onPluginDisconnected: "pluginDisconnected"
		}
	],

	pluginReady: function (p) {
		this.loaded = true;
	},

	pluginConnected: function (p) {
		this.plugin = p;
	},

	pluginDisconnected: function () {
		this.loaded = false;
		this.plugin = null;
	},

	resetTimer: function () {
		this.timer === undefined || clearTimeout(this.timer);
		this.timer = setTimeout(this.handleQueue.bind(this), 100);
	},

	handleQueue: function (inOp) {
		if (this.plugin === null || this.loaded === false || this.working) {
			if (inOp !== undefined) this.queue.push(inOp);
			this.resetTimer();
			return;
		}
		var op = inOp === undefined ? ((this.queue && this.queue.length) ? this.queue.shift() : {
			cmd: PDFService.idle.op
		}) : inOp;
		this.working = (op.cmd !== PDFService.idle.op);
		var cb = (this.handleCallback !== undefined && op.response !== undefined) ? this.handleCallback.bind(this, op.response) : null;
		if (op.cmd === PDFService.shell.op) {
			this.plugin.addCallback(PDFService.shell.cb, cb, true);
			this.plugin.callPluginMethodDeferred(null, 'Handler', PDFService.shell.op, op.args);
		} else if (op.cmd === PDFService.open.op) {
			this.plugin.addCallback(PDFService.open.cb, cb, true);
			this.plugin.callPluginMethodDeferred(null, 'Handler', PDFService.open.op, op.src);
		} else if (op.cmd === PDFService.cover.op) {
			this.plugin.addCallback(PDFService.cover.cb, cb, true);
			this.plugin.callPluginMethodDeferred(null, 'Handler', PDFService.cover.op, op.src, op.imageDir, op.width, op.height, op.index);
		} else if (op.cmd === PDFService.toc.op) {
			this.plugin.addCallback(PDFService.toc.cb, cb, true);
			this.plugin.callPluginMethodDeferred(null, 'Handler', PDFService.toc.op);
		} else if (op.cmd === PDFService.render.op) {
			this.plugin.addCallback(PDFService.render.cb, cb, true);
			this.plugin.callPluginMethodDeferred(null, 'Handler', PDFService.render.op, op.from, op.count, op.zoom, op.dir, op.prefix, op.suffix);
		} else if (op.cmd === PDFService.delete.op) {
			this.plugin.addCallback(PDFService.delete.cb, cb, true);
			this.plugin.callPluginMethodDeferred(null, 'Handler', PDFService.delete.op, op.imageDir);
		} else if (op.cmd === PDFService.find.op) {
			this.plugin.addCallback(PDFService.find.cb, cb, true);
			this.plugin.callPluginMethodDeferred(null, 'Handler', PDFService.find.op, op.from, op.count, op.zoom, op.text, op.dir, op.prefix, op.suffix, op.highlight);
		} else if (op.cmd === PDFService.saveAs.op) {
			this.plugin.addCallback(PDFService.saveAs.cb, cb, true);
			this.plugin.callPluginMethodDeferred(null, 'Handler', PDFService.saveAs.op, op.src, op.imageDir, op.overwrite);
		}
	},

	handleCallback: function (cb, response) {
		cb.call(null, response);
		this.working = false;
		this.resetTimer();
	}
});