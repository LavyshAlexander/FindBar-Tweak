Modules.VERSION = '1.0.0';

this.counter = {
	redoing: false,
	current: 0,
	
	onPDFMatches: function() {
		this.fill();
	},
	
	onCleanUpHighlights: function() {
		this.clear();
	},
	
	onWillHighlight: function() {
		this.clear();
	},
	
	onHighlightFinished: function() {
		this.fill();
	},
	
	onFindAgain: function() {
		this.fill();
	},
	
	clear: function() {
		this.current = 0;
	},
	
	fill: function() {
		// Special routine for PDF.JS
		if(isPDFJS) {
			this.redoing = false;
			
			// I hope adding this doesn't break anything else.
			if(document.readyState != 'complete' && document.readyState != 'interactive') {
				message('Counter:Result');
				return;
			}
			
			let selected = 0;
			if(PDFJS.findController.selected.pageIdx > -1 && PDFJS.findController.selected.matchIdx > -1) {
				let total = 0;
				for(let pIdx in PDFJS.findController.pageMatches) {
					if(PDFJS.findController.selected.pageIdx == pIdx) {
						selected = total +PDFJS.findController.selected.matchIdx +1;
						break;
					}
					total += PDFJS.findController.pageMatches[pIdx].length;
				}
			}
			
			let str = '';
			if(Finder.matchesPDF > 0) {
				if(selected > 0) {
					str = Strings.get('counter', 'counterFormat', [ ["$hit$", selected], ["$total$", Finder.matchesPDF] ], Finder.matchesPDF);
				} else {
					str = Strings.get('counter', 'counterSimple', [ ["$total$", Finder.matchesPDF] ], Finder.matchesPDF);
				}
			}
			
			message('Counter:Result', str);
			return;
		}
		
		// Normal HTML files
		if(Finder._lastFindResult == Ci.nsITypeAheadFind.FIND_NOTFOUND
		|| !Finder.searchString
		|| !Finder._highlights) {
			message('Counter:Result');
			return;
		}
		
		var hit = 0;
		var length = Finder._highlights.all.length;
		
		var sel = Finder.currentTextSelection;
		if(sel.rangeCount == 1) {
			var cRange = sel.getRangeAt(0);
			var i = 0;
			
			// Most times we don't need to start from the beginning of the array, it's faster to resume from a previous point
			var c = this.current || 0;
			if(c >= length) {
				c = 0;
			}
			this.current = 0;
			
			// loop forward (increment) when finding ahead; loop backward (decrement) when finding behind
			// conditionally setting a method like this is probably more efficient (especially on large pages with tons of highlights) than checking on each loop for this
			if(!Finder._lastFindPrevious) {
				function loopCurrent() {
					c++;
					if(c == length) { c = 0; }
				};
			} else {
				function loopCurrent() {
					c--;
					if(c < 0) { c = length -1; }
				};
			}
			
			while(i < length) {
				if(Finder.compareRanges(cRange, Finder._highlights.all[c].range)) {
					hit = c +1;
					this.current = c;
					break;
				}
				
				loopCurrent();
				i++;
			}
			
			if(!this.redoing && hit == 0 && length > 0 && cRange.toString() == findQuery) {
				this.redoing = true;
				highlights.apply(documentHighlighted);
				return;
			}
		}
		
		this.redoing = false;
		if(hit > 0) {
			message('Counter:Result', Strings.get('counter', 'counterFormat', [ ["$hit$", hit], ["$total$", length] ], length));
		} else {
			message('Counter:Result', Strings.get('counter', 'counterSimple', [ ["$total$", length] ], length));
		}
	}
};

Modules.LOADMODULE = function() {
	Finder.buildHighlights.add('counter');
	Finder.addResultListener(counter);
};

Modules.UNLOADMODULE = function() {
	Finder.removeResultListener(counter);
	Finder.buildHighlights.delete('counter');
};