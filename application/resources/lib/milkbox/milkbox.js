/*
	Milkbox v3.0.2 - required: mootools.js v1.3 core + more (see the relative js file for details about used modules)

	by Luca Reghellin (http://www.reghellin.com) September 2011, MIT-style license.
	Inspiration Lokesh Dhakar (http://www.lokeshdhakar.com/projects/lightbox2/)
	AND OF COURSE, SPECIAL THANKS TO THE MOOTOOLS DEVELOPERS AND THE OTHER DEVELOPERS HELPING ALL AROUND THE WORLD
*/
(function () {
    var a = null;
    this.Milkbox = new Class({
        Implements: [Options, Events],
        options: {
            overlayOpacity: 0.7,
            marginTop: 50,
            initialWidth: 250,
            initialHeight: 250,
            fileboxBorderWidth: "0px",
            fileboxBorderColor: "#000000",
            fileboxPadding: "0px",
            resizeDuration: 0.5,
            resizeTransition: "sine:in:out",
            autoPlay: false,
            autoPlayDelay: 3,
            removeTitle: true,
            autoSize: true,
            autoSizeMaxHeight: 0,
            centered: false,
            imageOfText: "of",
            onXmlGalleries: function () {},
            onClosed: function () {},
            onFileReady: function () {}
        },
        initialize: function (b) {
            if (a) {
                return a
            }
            a = this;
            this.setOptions(b);
            this.autoPlayBkup = {
                autoPlayDelay: this.options.autoPlayDelay,
                autoPlay: this.options.autoPlay
            };
            this.fullOptionsBkup = {};
            this.galleries = [];
            this.formElements = [];
            this.activated;
            this.busy = false;
            this.paused = true;
            this.closed = true;
            this.intId;
            this.loadCheckerId;
            this.externalGalleries = [];
            this.singlePageLinkId = 0;
            this.currentIndex;
            this.currentGallery;
            this.fileReady;
            this.loadedImages = [];
            this.currentFile;
            this.options_bkup;
            this.display;
            this.getPageGalleries();
            if (this.galleries.length != 0) {
                this.prepare(true)
            }
        },
        prepare: function (b) {
            if (b) {
                this.checkFormElements()
            }
            this.prepareHTML();
            this.prepareEventListeners();
            this.activated = true
        },
        open: function (b, c) {
            var d;
            if (!this.activated) {
                this.prepare(true)
            }
            var f = (instanceOf(b, MilkboxGallery)) ? b : this.getGallery(b);
            if (!f) {
                return false
            }
            if (typeOf(c) !== "number") {
                d = f.get_index_of(c);
                if (d !== -1) {
                    c = d
                }
            }
            d = parseInt(c, 10);
            if (isNaN(d)) {
                d = 0
            }
            this.closed = false;
            var e = f.get_item(d);
            if (!e) {
                return false
            }
            this.currentGallery = f;
            this.currentIndex = d;
            this.hideFormElements();
            this.display.set_mode(this.currentGallery.type);
            this.display.appear();
            if (this.options.autoPlay || f.options.autoplay) {
                this.startAutoPlay(true)
            }
            this.loadFile(e, this.getPreloads());
            return true
        },
        close: function (b) {
            if (b) {
                this.display.disappear()
            }
            this.showFormElements();
            this.pauseAutoPlay();
            this.stopLoadingCheck();
            this.currentGallery = null;
            this.currentIndex = null;
            this.currentFile = null;
            this.busy = false;
            this.paused = false;
            this.fileReady = false;
            this.closed = true;
            this.fireEvent("close")
        },
        startAutoPlay: function (b) {
            var e = this.currentGallery.options.autoplay_delay || this.options.autoPlayDelay;
            if (e < this.options.resizeDuration * 2) {
                e = this.options.resizeDuration * 2
            }
            var c = function () {
                    this.removeEvent("fileReady", c);
                    this.intId = this.navAux.periodical(e * 1000, this, [null, "next"])
                };
            if (b) {
                this.addEvent("fileReady", c)
            } else {
                this.intId = this.navAux.periodical(e * 1000, this, [null, "next"])
            }
            this.paused = false
        },
        pauseAutoPlay: function () {
            if (this.intId) {
                clearInterval(this.intId);
                this.intId = null
            }
            this.paused = true
        },
        setAutoPlay: function (c) {
            var b = (typeOf(c) == "object") ? [c] : c;
            b.each(function (h) {
                var f = this.getGallery(h.gallery);
                if (!f) {
                    return
                }
                var e = (h.autoplay == true) ? h.autoplay : false;
                var i = (h.delay && e) ? h.delay : this.options.autoPlayDelay;
                f.setOptions({
                    autoplay: e,
                    autoplay_delay: i
                }).refresh()
            }, this)
            
            return true;
        },
        openWithFile: function (c, b) {
            if (!this.activated) {
                this.prepare()
            }
            if (b) {
                this.refreshDisplay(b, true)
            }
            var d = new MilkboxGallery([c], {
                remove_title: this.options.removeTitle
            });
            this.open(d, 0)
        },
        getPreloads: function () {
            var b = this.currentGallery.items;
            var c = this.currentIndex;
            if (b.length == 1) {
                return null
            }
            var e = (c != b.length - 1) ? b[c + 1] : b[0];
            var f = (c != 0) ? b[c - 1] : b[b.length - 1];
            var d = (f == e) ? [f] : [f, e];
            return d
        },
        loadFile: function (c, b) {
            this.fileReady = false;
            this.display.clear_content();
            this.display.hide_bottom();
            if (this.checkFileType(c, "swf")) {
                this.loadSwf(c)
            } else {
                if (this.checkFileType(c, "html")) {
                    this.loadHtml(c)
                } else {
                    this.loadImage(c)
                }
            }
            if (!this.checkFileType(c, "swf")) {
                this.startLoadingCheck()
            }
            if (b) {
                this.preloadFiles(b)
            }
        },
        startLoadingCheck: function () {
            var b = 0;
            if (!this.loadCheckerId) {
                this.loadCheckerId = (function () {
                    b += 1;
                    if (b > 5) {
                        if (this.loadCheckerId) {
                            this.display.show_loader()
                        }
                        this.stopLoadingCheck()
                    }
                }).periodical(100, this)
            }
        },
        stopLoadingCheck: function () {
            clearInterval(this.loadCheckerId)
        },
        preloadFiles: function (b) {
            b.each(function (d, c) {
                if (!this.checkFileType(d, "swf") && !this.checkFileType(d, "html")) {
                    this.preloadImage(d.href)
                }
            }, this)
        },
        preloadImage: function (c) {
            if (!this.loadedImages.contains(c)) {
                var b = new Asset.image(c, {
                    onLoad: function () {
                        this.loadedImages.push(c)
                    }.bind(this)
                })
            }
        },
        loadImage: function (d) {
            var c = d.href;
            var b = new Asset.image(c, {
                onLoad: function (e) {
                    if (!this.loadedImages.contains(c)) {
                        this.loadedImages.push(c)
                    }
                    this.loadComplete(e, d.caption)
                }.bind(this)
            })
        },
        loadSwf: function (c) {
            var b = new Swiff(c.href, {
                width: c.size.width,
                height: c.size.height,
                vars: c.vars,
                params: {
                    wMode: "opaque",
                    swLiveConnect: "false"
                }
            });
            this.loadComplete($(b), c.caption)
        },
        loadHtml: function (c) {
            var d = (c.vars ? "?" + Object.toQueryString(c.vars) : "");
            var b = new Element("iframe", {
                src: c.href + d,
                frameborder: 0,
                styles: {
                    border: "none"
                }
            });
            if (c.size) {
                b.set({
                    width: c.size.width,
                    height: c.size.height
                })
            }
            this.loadComplete(b, c.caption)
        },
        loadComplete: function (c, b) {
            if (this.closed) {
                return
            }
            this.fileReady = true;
            this.stopLoadingCheck();
            this.currentFile = c;
            var d;
            d = (function () {
                if (this.display.ready) {
                    if (this.currentGallery.items != null) {
                        this.display.show_file(c, b, this.currentIndex + 1, this.currentGallery.items.length)
                    }
                    clearInterval(d)
                }
            }).periodical(100, this);
        
            
            this.fireEvent("fileReady", [c, b]);
        },
        checkFileType: function (c, d) {
            var b = (typeOf(c) != "string") ? c.href : c;
            var e = new RegExp(".(" + d + ")$", "i");
            return b.split("?")[0].test(e)
        },
        getPageGalleries: function () {
            var c = [];
            var b = $$("a[data-milkbox]");
            b.each(function (e) {
                var d = e.get("data-milkbox");
                if (d == "single") {
                    this.galleries.push(new MilkboxGallery(e, {
                        name: "single" + this.singlePageLinkId++,
                        remove_title: this.options.removeTitle
                    }))
                } else {
                    if (!c.contains(d)) {
                        c.push(d)
                    }
                }
            }, this);
            c.each(function (d) {
                this.galleries.push(new MilkboxGallery($$("a[data-milkbox=" + d + "]"), {
                    name: d,
                    remove_title: this.options.removeTitle
                }))
            }, this);
            if (this.options.autoPlay) {
                this.galleries.each(function (d) {
                    d.setOptions({
                        autoplay: this.options.autoPlay,
                        autoplay_delay: this.options.autoPlayDelay
                    })
                })
            }
        },
        reloadPageGalleries: function () {
            this.removePageGalleryEvents();
            this.galleries = this.galleries.filter(function (b) {
                if (!b.external) {
                    b.clear()
                }
                return b.external
            });
            this.getPageGalleries();
            this.addPageGalleriesEvents();
            if (!this.activated) {
                this.prepare(true)
            }
        },
        resetExternalGalleries: function (b) {
            this.galleries = this.galleries.filter(function (d) {
                if (d.external) {
                    d.clear()
                }
                return !d.external
            });
            if (!b) {
                return
            }
            var c = (typeOf(b) == "array") ? b : [b];
            c.each(function (d) {
                this.addGalleries(d)
            }, this)
        },
        addGalleries: function (b) {
            if (!this.activated) {
                this.prepare(true)
            }
            if (typeOf(b) == "string" && b.split("?")[0].test(/\.(xml)$/i)) {
                this.loadXml(b)
            } else {
                this.setObjectGalleries(b)
            }
            if (!this.activated) {
                this.prepare(true)
            }
        },
        loadXml: function (b) {
            var c = new Request({
                method: "get",
                autoCancel: true,
                url: b,
                onRequest: function () {}.bind(this),
                onSuccess: function (f, d) {
                    var e = f.replace(/(<a.+)\/>/gi, "$1></a>");
                    this.setXmlGalleries(new Element("div", {
                        html: e
                    }))
                }.bind(this),
                onFailure: function (d) {
                    alert("Milkbox :: loadXml: XML file path error or local Ajax test: please test xml galleries on-line")
                }
            }).send()
        },
        setXmlGalleries: function (e) {
            var g = e;
            var b = g.getElements(".gallery");
            var f;
            var d = [];
            b.each(function (k, j) {
                var h = {
                    name: k.getProperty("name"),
                    autoplay: Boolean(k.getProperty("autoplay")),
                    autoplay_delay: Number(k.getProperty("autoplay_delay"))
                };
                var c = k.getChildren("a").map(function (i) {
                    return {
                        href: i.href,
                        size: i.get("data-milkbox-size"),
                        title: i.get("title")
                    }
                }, this);
                this.galleries.push(new MilkboxGallery(c, h))
            }, this);
            this.fireEvent("xmlGalleries")
        },
        setObjectGalleries: function (b) {
            var c = (typeOf(b) == "array") ? b : [b];
            c.each(function (e) {
                var d = {
                    name: e.name,
                    autoplay: e.autoplay,
                    autoplay_delay: e.autoplay_delay
                };
                this.galleries.push(new MilkboxGallery(e.files, d))
            }, this)
        },
        getGallery: function (b) {
            var c = this.galleries.filter(function (d) {
                return d.name == b
            }, this);
            return c[0] || null
        },
        prepareHTML: function () {
            this.display = new MilkboxDisplay({
                initialWidth: this.options.initialWidth,
                initialHeight: this.options.initialHeight,
                overlayOpacity: this.options.overlayOpacity,
                marginTop: this.options.marginTop,
                fileboxBorderWidth: this.options.fileboxBorderWidth,
                fileboxBorderColor: this.options.fileboxBorderColor,
                fileboxPadding: this.options.fileboxPadding,
                resizeDuration: this.options.resizeDuration,
                resizeTransition: this.options.resizeTransition,
                centered: this.options.centered,
                autoSize: this.options.autoSize,
                autoSizeMaxHeight: this.options.autoSizeMaxHeight,
                imageOfText: this.options.imageOfText
            })
        },
        refreshDisplay: function (d, c) {
            if (!this.activated) {
                return
            }
            var b = this.display.options;
            var e = Object.merge({}, b, d);
            if (this.display) {
                this.display.clear()
            }
            this.display = new MilkboxDisplay(e);
            this.addDisplayEvents();
            if (c) {
                this.options_bkup = b
            } else {
                this.options_bkup = null
            }
        },
        checkFormElements: function () {
            this.formElements = $$("select, textarea");
            if (this.formElements.length == 0) {
                return
            }
            this.formElements = this.formElements.map(function (b) {
                b.store("visibility", b.getStyle("visibility"));
                b.store("display", b.getStyle("display"));
                return b
            })
        },
        hideFormElements: function () {
            if (this.formElements.length == 0) {
                return
            }
            this.formElements.each(function (b) {
                b.setStyle("display", "none")
            })
        },
        showFormElements: function () {
            if (this.formElements.length == 0) {
                return
            }
            this.formElements.each(function (b) {
                b.setStyle("visibility", b.retrieve("visibility"));
                b.setStyle("display", b.retrieve("display"))
            })
        },
        addPageGalleriesEvents: function () {
            var b = this.galleries.filter(function (c) {
                return !c.external
            });
            b.each(function (c) {
                c.items.each(function (d) {
                    d.element.addEvent("click", function (f) {
                        if(f.preventDefault) f.preventDefault();
                        
                        this.open(c.name, c.get_index_of(d))
                    }.bind(this))
                }, this)
            }, this)
        },
        removePageGalleryEvents: function () {
            var b = this.galleries.filter(function (c) {
                return !c.external
            });
            b.each(function (c) {
                c.items.each(function (d) {
                    d.element.removeEvents("click")
                })
            })
        },
        addDisplayEvents: function () {
            this.display.addEvent("nextClick", function () {
                this.navAux(true, "next")
            }.bind(this));
            this.display.addEvent("prevClick", function () {
                this.navAux(true, "prev")
            }.bind(this));
            this.display.addEvent("playPauseClick", function () {
                if (this.paused) {
                    this.startAutoPlay()
                } else {
                    this.pauseAutoPlay()
                }
                this.display.set_paused(this.paused)
            }.bind(this));
            this.display.addEvent("disappear", function () {
                if (this.options_bkup) {
                    this.refreshDisplay(this.options_bkup)
                }
                this.close(false)
            }.bind(this));
            this.display.addEvent("resizeComplete", function () {
                this.busy = false
            }.bind(this))
        },
        prepareEventListeners: function () {
            this.addPageGalleriesEvents();
            this.addDisplayEvents();
            window.addEvent("resize", function () {
                if (this.display.ready) {
                    this.display.resetOverlaySize()
                }
            }.bind(this));
            window.document.addEvent("keydown", function (b) {
                if (this.busy == true || this.closed) {
                    return
                }
                if (b.key == "right" || b.key == "left" || b.key == "space") {
                    b.preventDefault()
                }
                if (this.display.mode != "single") {
                    if (b.key == "right" || b.key == "space") {
                        this.navAux(b, "next")
                    } else {
                        if (b.key == "left") {
                            this.navAux(b, "prev")
                        }
                    }
                }
                if (b.key == "esc") {
                    this.display.disappear()
                }
            }.bind(this))
        },
        navAux: function (f, d) {
            if (f) {
                this.pauseAutoPlay()
            } else {
                if (this.busy || !this.fileReady) {
                    return
                }
            }
            
            
            this.busy = true;
            var b, c;
            if (d == "next") {
                b = (this.currentIndex != this.currentGallery.items.length - 1) ? this.currentIndex += 1 : this.currentIndex = 0;
                c = (this.currentIndex != this.currentGallery.items.length - 1) ? this.currentIndex + 1 : 0
            } else {
                b = (this.currentIndex != 0) ? this.currentIndex -= 1 : this.currentIndex = this.currentGallery.items.length - 1;
                c = (this.currentIndex != 0) ? this.currentIndex - 1 : this.currentGallery.items.length - 1
            }
            
            this.fireEvent("navAux", [this.currentIndex]);
            
            this.loadFile(this.currentGallery.get_item(b), [this.currentGallery.get_item(c)])
        },
        setPause: function(a){
        
        	this.display.set_paused(a);
        
        }
    })
})();
var MilkboxDisplay = new Class({
    Implements: [Options, Events],
    options: {
        initialWidth: 100,
        initialHeight: 100,
        overlayOpacity: 1,
        marginTop: 0,
        fileboxBorderWidth: "0px",
        fileboxBorderColor: "#000000",
        fileboxPadding: "0px",
        resizeDuration: 0.5,
        resizeTransition: "sine:in:out",
        centered: false,
        autoSize: false,
        autoSizeMaxHeight: 0,
        imageOfText: "of",
        onNextClick: function () {},
        onPrevClick: function () {},
        onPlayPause: function () {},
        onDisappear: function () {},
        onResizeComplete: function () {}
    },
    initialize: function (a) {
        this.setOptions(a);
        this.overlay;
        this.mainbox;
        this.filebox;
        this.bottom;
        this.controls;
        this.caption;
        this.close;
        this.next;
        this.prev;
        this.playpause;
        this.paused = false;
        this.count;
        this.mode = "standard";
        this.ready = false;
        this.overlay_show_fx;
        this.overlay_hide_fx;
        this.mainbox_show_fx;
        this.mainbox_hide_fx;
        this.mainbox_resize_fx;
        this.current_file = null;
        this.build_html();
        this.prepare_effects();
        this.prepare_events()
    },
    build_html: function () {
        this.overlay = new Element("div", {
            id: "mbox-overlay",
            styles: {
                visibility: "visible",
                position: "fixed",
                display: "none",
                left: 0,
                width: "100%",
                opacity: 0,
                height: 0,
                overflow: "hidden",
                margin: 0,
                padding: 0
            }
        }).inject($(document.body));
        this.mainbox = new Element("div", {
            id: "mbox-mainbox",
            styles: {
                position: (this.options.centered) ? "fixed" : "absolute",
                overflow: "hidden",
                display: "none",
                "z-index": 50001,
                width: this.options.initialWidth,
                height: this.options.initialHeight,
                opacity: 0,
                margin: 0,
                left: "50%",
                marginLeft: -(this.options.initialWidth / 2),
                marginTop: (this.options.centered) ? -(this.options.initialHeight / 2) : "",
                top: (this.options.centered) ? "50%" : ""
            }
        }).inject($(document.body));
        this.filebox = new Element("div", {
            id: "mbox-filebox",
            styles: {
                "border-style": "solid",
                "border-width": this.options.fileboxBorderWidth,
                "border-color": this.options.fileboxBorderColor,
                padding: this.options.fileboxPadding,
                opacity: 0
            }
        }).inject(this.mainbox);
        this.bottom = new Element("div#mbox-bottom").setStyle("visibility", "hidden").inject(this.mainbox);
        this.controls = new Element("div#mbox-controls");
        this.caption = new Element("div#mbox-caption", {
            html: "test"
        }).setStyle("display", "none");
        this.bottom.adopt(new Element("div.mbox-reset"), this.controls, this.caption, new Element("div.mbox-reset"));
        this.close = new Element("div#mbox-close");
        this.next = new Element("div#mbox-next");
        this.prev = new Element("div#mbox-prev");
        this.playpause = new Element("div#mbox-playpause");
        this.count = new Element("div#mbox-count");
        $$(this.next, this.prev, this.close, this.playpause).setStyles({
            outline: "none",
            cursor: "pointer"
        });
        this.controls.adopt(new Element("div.mbox-reset"), this.close, this.next, this.prev, this.playpause, new Element("div.mbox-reset"), this.count)
    },
    prepare_effects: function () {
        this.overlay_show_fx = new Fx.Tween(this.overlay, {
            duration: "short",
            link: "cancel",
            property: "opacity",
            onStart: function () {
                this.element.setStyles({
                    top: -window.getScroll().y,
                    height: window.getScrollSize().y + window.getScroll().y,
                    display: "block"
                })
            },
            onComplete: function () {
                this.mainbox_show_fx.start(1)
            }.bind(this)
        });
        this.overlay_hide_fx = new Fx.Tween(this.overlay, {
            duration: "short",
            link: "cancel",
            property: "opacity",
            onStart: function () {},
            onComplete: function () {
                this.overlay.setStyle("display", "none");
                this.fireEvent("disappear")
            }.bind(this)
        });
        this.mainbox_show_fx = new Fx.Tween(this.mainbox, {
            duration: "short",
            link: "cancel",
            property: "opacity",
            onStart: function () {
                this.mainbox.setStyle("display", "block")
            }.bind(this),
            onComplete: function () {
                this.ready = true
            }.bind(this)
        });
        this.mainbox_hide_fx = new Fx.Tween(this.mainbox, {
            duration: "short",
            link: "cancel",
            property: "opacity",
            onStart: function () {
                this.ready = false
            }.bind(this),
            onComplete: function () {
                this.overlay.setStyle("display", "none")
            }.bind(this)
        });
        this.mainbox_resize_fx = new Fx.Morph(this.mainbox, {
            duration: this.options.resizeDuration * 1000,
            transition: this.options.resizeTransition,
            link: "cancel",
            onStart: function () {
                this.filebox.setStyle("opacity", 0)
            }.bind(this),
            onComplete: function () {
                this.show_bottom();
                this.filebox.setStyle("height", this.current_file.height + "px");
                this.filebox.grab(this.current_file).tween("opacity", 1);
                this.fireEvent("resizeComplete")
            }.bind(this)
        });
        this.filebox.set("tween", {
            duration: "short",
            link: "chain"
        })
    },
    prepare_events: function () {
        $$(this.overlay, this.close).addEvent("click", function () {
            this.disappear()
        }.bind(this));
        this.prev.addEvent("click", function () {
            this.fireEvent("prevClick")
        }.bind(this));
        this.next.addEvent("click", function () {
            this.fireEvent("nextClick")
        }.bind(this));
        this.playpause.addEvent("click", function () {
            this.fireEvent("playPauseClick")
        }.bind(this))
    },
    show_file: function (c, k, f, b) {
        this.hide_loader();
        if (c.match && c.match("img") && (this.options.autoSize || this.options.centered)) {
            var c = this.get_resized_image(c)
        }
        var g = {
            w: c.width.toInt(),
            h: c.height.toInt()
        };
        if (!g.w || !g.h) {
            alert("Milkbox error: you must pass size values if the file is swf or html or a free file (openWithFile)");
            return
        }
        g = Object.map(g, function (l) {
            return l.toInt()
        });
        this.caption.innerHTML = (k) ? k : "";
        this.update_count(f, b);
        var h = this.filebox.getStyle("border-width").toInt() * 2 + this.filebox.getStyle("padding").toInt() * 2;
        var i = g.w + h;
        var j = this.caption.getStyles("paddingRight", "marginRight");
        this.caption.setStyle("width", i - j.paddingRight.toInt() - j.marginRight.toInt());
        $$(this.bottom, this.controls).setStyle("height", Math.max(this.caption.getDimensions().height, this.controls.getComputedSize().totalHeight));
        var a = this.mainbox.getComputedSize();
        var e = g.h + h + this.bottom.getComputedSize().totalHeight;
        var d = {
            w: i,
            h: e,
            total_w: i + a.totalWidth - a.width,
            total_h: e + a.totalHeight - a.height
        };
        this.current_file = c;
        this.resize_to(d)
    },
    get_resized_image: function (f) {
        var e;
        var b;
        var a;
        var g = {
            w: f.get("width").toInt(),
            h: f.get("height").toInt()
        };
        var c = window.getSize();
        var e = {
            w: c.x - 60,
            h: c.y - 68 - this.options.marginTop * 2
        };
        var d = Math.max(e.h, e.w);
        if (d == e.w) {
            b = d / g.w;
            a = "h"
        } else {
            b = d / g.h;
            a = "w"
        }
        b = (b <= 1) ? b : 1;
        g = Object.map(g, function (h) {
            return Math.floor(h * b)
        });
        b = (e[a] / g[a] <= 1) ? e[a] / g[a] : 1;
        g = Object.map(g, function (h) {
            return Math.floor(h * b)
        });
        if (this.options.autoSizeMaxHeight > 0) {
            b = (this.options.autoSizeMaxHeight / g.height < 1) ? this.options.autoSizeMaxHeight / g.height : 1;
            g = Object.map(g, function (h) {
                return Math.floor(h * b)
            })
        }
        f.set({
            width: g.w,
            height: g.h
        });
        return f
    },
    resize_to: function (a) {
        this.mainbox_resize_fx.start({
            width: a.w,
            height: a.h,
            marginLeft: -(a.total_w / 2).round(),
            marginTop: (this.options.centered) ? -(a.total_h / 2).round() : ""
        })
    },
    show_loader: function () {
        this.mainbox.addClass("mbox-loading")
    },
    hide_loader: function () {
        this.mainbox.removeClass("mbox-loading")
    },
    clear_content: function () {
        this.filebox.empty();
        this.caption.empty();
        this.count.empty();
        $$(this.bottom, this.controls).setStyle("height", "")
    },
    hide_bottom: function () {
        this.caption.setStyle("display", "none");
        this.bottom.setStyle("visibility", "hidden")
    },
    show_bottom: function () {
        this.caption.setStyle("display", "block");
        this.bottom.setStyle("visibility", "visible")
    },
    appear: function () {
        if (!this.options.centered) {
            this.mainbox.setStyle("top", window.getScroll().y + this.options.marginTop)
        }
        this.overlay_show_fx.start(this.options.overlayOpacity)
    },
    disappear: function () {
        this.cancel_effects();
        this.current_file = null;
        this.ready = false;
        this.mode = "standard";
        $$(this.prev, this.next, this.playpause, this.count).setStyle("display", "none");
        this.playpause.setStyle("backgroundPosition", "0 0");
        this.count.empty();
        this.caption.setStyle("display", "none").empty();
        this.bottom.setStyle("visibility", "hidden");
        this.filebox.setStyle("height", "").empty();
        this.mainbox.setStyles({
            opacity: 0,
            display: "none",
            width: this.options.initialWidth,
            height: this.options.initialHeight,
            marginLeft: -(this.options.initialWidth / 2),
            marginTop: (this.options.centered) ? -(this.options.initialHeight / 2) : "",
            top: (this.options.centered) ? "50%" : ""
        });
        this.filebox.setStyle("opacity", 0);
        this.overlay_hide_fx.start(0)
    },
    cancel_effects: function () {
        [this.mainbox_resize_fx, this.mainbox_hide_fx, this.mainbox_show_fx, this.overlay_hide_fx, this.overlay_show_fx].each(function (a) {
            a.cancel()
        })
    },
    set_mode: function (b) {
        this.mode = b;
        var c = this.close.getComputedSize().width;
        var a = this.prev.getComputedSize().width;
        var d = this.next.getComputedSize().width;
        var f = this.playpause.getComputedSize().width;
        var e = this.mainbox.getStyle("border-right-width").toInt();
        switch (b) {
        case "autoplay":
            $$(this.playpause, this.close, this.next, this.prev, this.count).setStyle("display", "block");
            this.controls.setStyle("width", c + a + d + f + e);
            break;
        case "single":
            $$(this.playpause, this.next, this.prev, this.count).setStyle("display", "none");
            this.controls.setStyle("width", c + e);
            break;
        case "standard":
            $$(this.close, this.next, this.prev, this.count).setStyle("display", "block");
            this.playpause.setStyle("display", "none");
            this.controls.setStyle("width", c + a + d + e);
            break;
        default:
            return
        }
        this.caption.setStyle("margin-right", this.controls.getComputedSize().totalWidth)
    },
    set_paused: function (a) {
        this.paused = a;
        var b = (this.paused) ? "0 -66px" : "";
        this.playpause.setStyle("background-position", b)
    },
    update_count: function (a, b) {
        this.count.set("text", a + " " + this.options.imageOfText + " " + b)
    },
    resetOverlaySize: function () {
        if (this.overlay.getStyle("opacity") == 0) {
            return
        }
        var a = window.getSize().y;
        this.overlay.setStyles({
            height: a
        })
    },
    clear: function () {
        this.overlay.destroy();
        this.mainbox.destroy()
    }
});
var MilkboxGallery = new Class({
    Implements: [Options, Events],
    options: {
        name: null,
        autoplay: null,
        autoplay_delay: null,
        remove_title: true
    },
    initialize: function (b, a) {
        this.setOptions(a);
        this.source = b;
        this.external = false;
        this.items = null;
        this.name = this.options.name;
        this.type = null;
        this.prepare_gallery();
        this.prepare_elements()
    },
    prepare_gallery: function () {
        switch (typeOf(this.source)) {
        case "element":
            if (this.check_extension(this.source.href)) {
                this.items = [this.source]
            } else {
                alert("Wrong file extension: " + this.source.href)
            }
            break;
        case "elements":
            this.items = this.source.filter(function (a) {
                return this.check_extension(a.href)
            }, this);
            break;
        case "array":
            this.items = this.source.filter(function (a) {
                return this.check_extension(a.href)
            }, this);
            this.external = true;
            break;
        default:
            return
        }
        if (this.items.length == 0) {
            alert("Warning: gallery " + this.name + " is empty")
        }
    },
    prepare_elements: function () {
        this.items = this.items.map(function (d) {
            var b = d.href.split("?");
            var a = {};
            a.element = (typeOf(d) == "element") ? d : null;
            a.href = b[0];
            a.vars = (b[1]) ? b[1].parseQueryString() : null;
            a.size = null;
            a.caption = (a.element) ? a.element.get("title") : d.title;
            if (this.options.remove_title && a.element) {
                a.element.removeProperty("title")
            }
            var c = (a.element) ? a.element.get("data-milkbox-size") : d.size;
            if (c) {
                a.size = Object.map(this.get_item_props(c), function (f, e) {
                    return f.toInt()
                })
            }
            return a
        }, this);
        if (this.items.length == 0) {
            return
        }
        this.type = (this.items.length == 1) ? "single" : (this.options.autoplay) ? "autoplay" : "standard"
    },
    check_extension: function (a) {
        return a.split("?")[0].test(/\.(gif|jpg|jpeg|png|swf|html)$/i)
    },
    get_index_of: function (b) {
        var a = (typeOf(b) == "string") ? this.items.indexOf(this.items.filter(function (c) {
            return c.href === b
        })[0]) : this.items.indexOf(b);
        return this.items.indexOf(b)
    },
    get_item: function (a) {
        return this.items[a]
    },
    get_item_props: function (a) {
        var c = {};
        var b = a.split(",").each(function (f, e) {
            var d = f.trim().split(":");
            c[d[0].trim()] = d[1].trim()
        }, this);
        return c
    },
    refresh: function () {
        this.type = (this.items.length == 1) ? "single" : (this.options.autoplay) ? "autoplay" : "standard"
    },
    clear: function () {
        this.source = null;
        this.items = null
    }
});
