"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.identities = exports.OfficeDocument = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _part = require("../part");

var _part2 = _interopRequireDefault(_part);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var OfficeDocument = exports.OfficeDocument = function (_Part) {
	_inherits(OfficeDocument, _Part);

	function OfficeDocument() {
		_classCallCheck(this, OfficeDocument);

		return _possibleConstructorReturn(this, (OfficeDocument.__proto__ || Object.getPrototypeOf(OfficeDocument)).apply(this, arguments));
	}

	_createClass(OfficeDocument, [{
		key: "_init",
		value: function _init() {
			var _this2 = this;

			_get(OfficeDocument.prototype.__proto__ || Object.getPrototypeOf(OfficeDocument.prototype), "_init", this).call(this);
			var supported = "styles,numbering,theme,settings".split(",");
			this.rels("Relationship[Target$=\".xml\"]").each(function (i, rel) {
				var $ = _this2.rels(rel);
				var type = $.attr("Type").split("/").pop();
				if (supported.indexOf(type) != -1) {
					var target = $.attr("Target");
					Object.defineProperty(_this2, type, {
						get: function get() {
							return this.getRelObject(target);
						}
					});
				}
			});
		}
	}, {
		key: "render",
		value: function render(createElement) {
			var identify = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : OfficeDocument.identify;

			if (this.styles) this.renderNode(this.styles("w\\:styles").get(0), createElement, identify);
			if (this.numbering) this.renderNode(this.numbering("w\\:numbering").get(0), createElement, identify);
			return this.renderNode(this.content("w\\:document").get(0), createElement, identify);
		}
	}, {
		key: "parse",
		value: function parse(domHandler) {
			var identify = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : OfficeDocument.identify;

			var doc = {};
			var createElement = domHandler.createElement.bind(domHandler);
			function _identify() {
				var model = identify.apply(undefined, arguments);
				if (model && (typeof model === "undefined" ? "undefined" : _typeof(model)) == "object") {
					domHandler.emit.apply(domHandler, ["*", model].concat(Array.prototype.slice.call(arguments)));
					domHandler.emit.apply(domHandler, [model.type, model].concat(Array.prototype.slice.call(arguments)));
					if (domHandler["on" + model.type]) domHandler["on" + model.type].apply(domHandler, [model].concat(Array.prototype.slice.call(arguments)));
				}
				return model;
			}

			if (this.styles) doc.styles = this.renderNode(this.styles("w\\:styles").get(0), createElement, _identify);
			if (this.numbering) doc.numbering = this.renderNode(this.numbering("w\\:numbering").get(0), createElement, _identify);
			doc.document = this.renderNode(this.content("w\\:document").get(0), createElement, _identify);
			return doc;
		}
	}], [{
		key: "identify",
		value: function identify(wXml, officeDocument) {
			var tag = wXml.name.split(":").pop();
			if (identities[tag]) return identities[tag].apply(identities, arguments);

			return tag;
		}
	}]);

	return OfficeDocument;
}(_part2.default);

exports.default = OfficeDocument;
var identities = exports.identities = {
	document: function document(wXml, officeDocument) {
		var $ = officeDocument.content;
		var current = null;
		var children = $("w\\:sectPr").each(function (i, sect) {
			var end = $(sect).closest('w\\:body>*');
			sect.content = end.prevUntil(current).toArray().reverse();
			if (!end.is(sect)) sect.content.push(end.get(0));
			current = end;
		}).toArray();
		return { type: "document", children: children };
	},
	sectPr: function sectPr(wXml, officeDocument) {
		var hf = function hf(type) {
			return wXml.children.filter(function (a) {
				return a.name == "w:" + type + "Reference";
			}).reduce(function (headers, a) {
				headers.set(a.attribs["w:type"], officeDocument.getRel(a.attribs["r:id"]));
				return headers;
			}, new Map());
		};

		return {
			type: "section",
			children: wXml.content,
			headers: hf("header"),
			footers: hf("footer"),
			hasTitlePage: !!wXml.children.find(function (a) {
				return a.name == "w:titlePg";
			})
		};
	},
	p: function p(wXml, officeDocument) {
		var $ = officeDocument.content(wXml);
		var type = "p";

		var identity = { type: type, pr: wXml.children.find(function (_ref) {
				var name = _ref.name;
				return name == "w:pPr";
			}), children: wXml.children.filter(function (_ref2) {
				var name = _ref2.name;
				return name != "w:pPr";
			}) };

		var pPr = $.find("w\\:pPr");
		if (pPr.length) {
			var styleId = pPr.find("w\\:pStyle").attr("w:val");

			var numPr = pPr.find("w\\:numPr>w\\:numId");
			if (!numPr.length && styleId) {
				numPr = officeDocument.styles("w\\:style[w\\:styleId=\"" + styleId + "\"] w\\:numPr>w\\:numId");
			}

			if (numPr.length) {
				identity.type = "list";
				identity.numId = numPr.find("w\\:numId").attr("w:val");
				identity.level = numPr.find("w\\:ilvl").attr("w:val");
			} else {
				var outlineLvl = pPr.find("w\\:outlineLvl").attr("w:val");
				if (!outlineLvl && styleId) outlineLvl = officeDocument.styles("w\\:style[w\\:styleId=\"" + styleId + "\"] w\\:outlineLvl").attr("w:val");

				if (outlineLvl) {
					identity.type = "heading";
					identity.level = parseInt(outlineLvl) + 1;
					identity.styleId = styleId;
				}
			}
		}
		identity.wt = function () {
			return $.find('w\\:t').map(function (index, element) {
				return element.children;
			}).get();
		};

		return identity;
	},
	r: function r(wXml) {
		return { type: "r", pr: wXml.children.find(function (_ref3) {
				var name = _ref3.name;
				return name == "w:rPr";
			}), children: wXml.children.filter(function (_ref4) {
				var name = _ref4.name;
				return name != "w:rPr";
			}) };
	},
	fldChar: function fldChar(wXml) {
		return wXml.attribs["w:fldCharType"];
	},
	inline: function inline(wXml, officeDocument) {
		var $ = officeDocument.content(wXml);
		return { type: "drawing.inline", children: $.find('a\\:graphic>a\\:graphicData').children().toArray() };
	},
	anchor: function anchor(wXml, officeDocument) {
		var $ = officeDocument.content(wXml);
		var graphicData = $.find('a\\:graphic>a\\:graphicData');
		var type = graphicData.attr("uri").split("/").pop();
		var children = graphicData.children().toArray();
		if (type == "wordprocessingGroup") children = children[0].children.filter(function (a) {
			return a.name.split(":")[0] != "wpg";
		});

		return { type: "drawing.anchor", children: children };
	},
	pic: function pic(wXml, officeDocument) {
		var blip = officeDocument.content(wXml).find("a\\:blip");
		var rid = blip.attr('r:embed') || blip.attr('r:link');
		return _extends({ type: "picture" }, officeDocument.getRel(rid));
	},
	wsp: function wsp(wXml, officeDocument) {
		return { type: "shape", children: officeDocument.content(wXml).find(">wps\\:txbx>w\\:txbxContent").children().toArray() };
	},
	Fallback: function Fallback() {
		return null;
	},
	sdt: function sdt(wXml, officeDocument) {
		var $ = officeDocument.content(wXml);
		var pr = $.find('>w\\:sdtPr');
		var content = $.find('>w\\:sdtContent');
		var children = content.children().toArray();

		var elBinding = pr.find('w\\:dataBinding').get(0);
		if (elBinding) {
			//properties
			var path = elBinding.attribs['w:xpath'],
			    d = path.split(/[\/\:\[]/),
			    name = (d.pop(), d.pop());
			var value = content.text();

			return { type: "property", name: name, value: value, children: children };
		} else {
			//controls
			var prChildren = pr.get(0).children;
			var elType = prChildren[prChildren.length - 1];
			var _name = elType.name.split(":").pop();
			var type = "text,picture,docPartList,comboBox,dropDownList,date,checkbox,repeatingSection,repeatingSectionItem".split(",").find(function (a) {
				return a == _name;
			});
			var model = { children: children };
			if (type) {
				model.type = "control." + type;
			} else {
				//container
				if (content.find("w\\:p,w\\:tbl,w\\:tr,w\\:tc").length) {
					model.type = "block";
				} else {
					model.type = "inline";
				}
			}

			$ = officeDocument.content;
			switch (model.type) {
				case "control.dropDownList":
				case "control.comboBox":
					{
						var selected = $(content).text();
						model.options = $(elType).find("w\\:listItem").map(function (i, li) {
							return {
								displayText: li.attribs["w:displayText"],
								value: li.attribs["w:value"]
							};
						}).get();
						model.value = (model.options.find(function (a) {
							return a.displayText == selected;
						}) || {}).value;
						break;
					}
				case "control.checkbox":
					{
						var ns = elType.name.split(":")[0];
						model.checked = $(elType).find(ns + "\\:checked").attr(ns + ":val") == "1";
						break;
					}
				case "control.text":
					if (content.find('w\\:r [w\\:val~=Placeholder]').length == 0) model.value = content.text();
					break;
				case "control.date":
					model.value = new Date($(elType).attr("w:fullDate"));
					model.format = $(elType).find("w\\:dateFormat").attr("w:val");
					model.locale = $(elType).find("w\\:lid").attr("w:val");
					break;
			}
			return model;
		}
	},
	hyperlink: function hyperlink(wXml, officeDocument) {
		if (wXml.attribs["r:id"]) {
			var url = officeDocument.getRel(wXml.attribs["r:id"]);
			return { type: "hyperlink", url: url };
		} else if (wXml.attribs['w:anchor']) {
			var name = wXml.attribs['w:anchor']; //TODO
			return { type: 'anchor', name: name };
		}
	},
	tbl: function tbl(wXml) {
		return wXml.children.reduce(function (state, node) {
			switch (node.name) {
				case "w:tblPr":
					state.pr = node;
					break;
				case "w:tblGrid":
					state.cols = node.children;
					break;
				default:
					state.children.push(node);
			}
			return state;
		}, { type: "tbl", children: [], pr: null, cols: [] });
	},
	tr: function tr(wXml) {
		return wXml.children.reduce(function (state, node) {
			switch (node.name) {
				case "w:trPr":
					state.pr = node;
					state.isHeader = !!node.children.find(function (a) {
						return a.name == "w:tblHeader";
					});
					break;
				default:
					state.children.push(node);
			}
			return state;
		}, { type: "tr", children: [], pr: null });
	},
	tc: function tc(wXml) {
		return wXml.children.reduce(function (state, node) {
			switch (node.name) {
				case "w:tcPr":
					state.pr = node;
					break;
				default:
					state.children.push(node);
			}
			return state;
		}, { type: "tc", children: [], pr: null });
	},
	altChunk: function altChunk(wXml, officeDocument) {
		var rId = wXml.attribs['r:id'];
		var data = officeDocument.getRel(rId);

		var partName = officeDocument.folder + officeDocument.rels("[Id=" + rId + "]").attr("Target");
		var contentType = officeDocument.doc.contentTypes("Override[PartName='" + partName + "']").attr("ContentType");
		return { type: "chunk", data: data, contentType: contentType };
	},
	docDefaults: function docDefaults(wXml) {
		return { type: "style" };
	},
	style: function style(wXml) {
		return { type: "style", id: wXml.attribs['w:styleId'] };
	},
	abstractNum: function abstractNum(wXml) {
		return { type: "abstractNum", id: wXml.attribs["w:abstractNumId"] };
	},
	num: function num(wXml) {
		return { type: "num", id: wXml.attribs["w:numId"], abstractNum: wXml.children.find(function (a) {
				return a.name == "w:abstractNumId";
			}).attribs["w:val"] };
	},
	latentStyles: function latentStyles() {
		return null;
	},
	object: function object(wXml, officeDocument) {
		var ole = officeDocument.content(wXml).find("o\\:OLEObject");
		var type = ole.attr("ProgID");
		var embed = ole.attr("Type") === "Embed";
		var rId = ole.attr("r:id");
		return { type: "object", embed: embed, prog: type, data: officeDocument.getRelOleObject(rId) };
	}
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9vcGVueG1sL2RvY3gvb2ZmaWNlRG9jdW1lbnQuanMiXSwibmFtZXMiOlsiT2ZmaWNlRG9jdW1lbnQiLCJzdXBwb3J0ZWQiLCJzcGxpdCIsInJlbHMiLCJlYWNoIiwiaSIsInJlbCIsIiQiLCJ0eXBlIiwiYXR0ciIsInBvcCIsImluZGV4T2YiLCJ0YXJnZXQiLCJPYmplY3QiLCJkZWZpbmVQcm9wZXJ0eSIsImdldCIsImdldFJlbE9iamVjdCIsImNyZWF0ZUVsZW1lbnQiLCJpZGVudGlmeSIsInN0eWxlcyIsInJlbmRlck5vZGUiLCJudW1iZXJpbmciLCJjb250ZW50IiwiZG9tSGFuZGxlciIsImRvYyIsImJpbmQiLCJfaWRlbnRpZnkiLCJtb2RlbCIsImFyZ3VtZW50cyIsImVtaXQiLCJkb2N1bWVudCIsIndYbWwiLCJvZmZpY2VEb2N1bWVudCIsInRhZyIsIm5hbWUiLCJpZGVudGl0aWVzIiwiY3VycmVudCIsImNoaWxkcmVuIiwic2VjdCIsImVuZCIsImNsb3Nlc3QiLCJwcmV2VW50aWwiLCJ0b0FycmF5IiwicmV2ZXJzZSIsImlzIiwicHVzaCIsInNlY3RQciIsImhmIiwiZmlsdGVyIiwiYSIsInJlZHVjZSIsImhlYWRlcnMiLCJzZXQiLCJhdHRyaWJzIiwiZ2V0UmVsIiwiTWFwIiwiZm9vdGVycyIsImhhc1RpdGxlUGFnZSIsImZpbmQiLCJwIiwiaWRlbnRpdHkiLCJwciIsInBQciIsImxlbmd0aCIsInN0eWxlSWQiLCJudW1QciIsIm51bUlkIiwibGV2ZWwiLCJvdXRsaW5lTHZsIiwicGFyc2VJbnQiLCJ3dCIsIm1hcCIsImluZGV4IiwiZWxlbWVudCIsInIiLCJmbGRDaGFyIiwiaW5saW5lIiwiYW5jaG9yIiwiZ3JhcGhpY0RhdGEiLCJwaWMiLCJibGlwIiwicmlkIiwid3NwIiwiRmFsbGJhY2siLCJzZHQiLCJlbEJpbmRpbmciLCJwYXRoIiwiZCIsInZhbHVlIiwidGV4dCIsInByQ2hpbGRyZW4iLCJlbFR5cGUiLCJzZWxlY3RlZCIsIm9wdGlvbnMiLCJsaSIsImRpc3BsYXlUZXh0IiwibnMiLCJjaGVja2VkIiwiRGF0ZSIsImZvcm1hdCIsImxvY2FsZSIsImh5cGVybGluayIsInVybCIsInRibCIsInN0YXRlIiwibm9kZSIsImNvbHMiLCJ0ciIsImlzSGVhZGVyIiwidGMiLCJhbHRDaHVuayIsInJJZCIsImRhdGEiLCJwYXJ0TmFtZSIsImZvbGRlciIsImNvbnRlbnRUeXBlIiwiY29udGVudFR5cGVzIiwiZG9jRGVmYXVsdHMiLCJzdHlsZSIsImlkIiwiYWJzdHJhY3ROdW0iLCJudW0iLCJsYXRlbnRTdHlsZXMiLCJvYmplY3QiLCJvbGUiLCJlbWJlZCIsInByb2ciLCJnZXRSZWxPbGVPYmplY3QiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQUFBOzs7Ozs7Ozs7Ozs7SUFFYUEsYyxXQUFBQSxjOzs7Ozs7Ozs7OzswQkFDTDtBQUFBOztBQUNOO0FBQ0EsT0FBTUMsWUFBVSxrQ0FBa0NDLEtBQWxDLENBQXdDLEdBQXhDLENBQWhCO0FBQ0EsUUFBS0MsSUFBTCxtQ0FBMENDLElBQTFDLENBQStDLFVBQUNDLENBQUQsRUFBR0MsR0FBSCxFQUFTO0FBQ3ZELFFBQUlDLElBQUUsT0FBS0osSUFBTCxDQUFVRyxHQUFWLENBQU47QUFDQSxRQUFJRSxPQUFLRCxFQUFFRSxJQUFGLENBQU8sTUFBUCxFQUFlUCxLQUFmLENBQXFCLEdBQXJCLEVBQTBCUSxHQUExQixFQUFUO0FBQ0EsUUFBR1QsVUFBVVUsT0FBVixDQUFrQkgsSUFBbEIsS0FBeUIsQ0FBQyxDQUE3QixFQUErQjtBQUM5QixTQUFJSSxTQUFPTCxFQUFFRSxJQUFGLENBQU8sUUFBUCxDQUFYO0FBQ0FJLFlBQU9DLGNBQVAsU0FBMkJOLElBQTNCLEVBQWdDO0FBQy9CTyxTQUQrQixpQkFDMUI7QUFDSixjQUFPLEtBQUtDLFlBQUwsQ0FBa0JKLE1BQWxCLENBQVA7QUFDQTtBQUg4QixNQUFoQztBQUtBO0FBQ0QsSUFYRDtBQVlBOzs7eUJBRU1LLGEsRUFBZ0Q7QUFB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SW9ILFFBQU1ELElBQUluSCxJQUFKLENBQVMsTUFBVCxNQUFtQixPQUE3QjtBQUNBLE1BQUlzRyxNQUFJYSxJQUFJbkgsSUFBSixDQUFTLE1BQVQsQ0FBUjtBQUNBLFNBQU8sRUFBQ0QsTUFBSyxRQUFOLEVBQWVxSCxZQUFmLEVBQXNCQyxNQUFNdEgsSUFBNUIsRUFBa0N3RyxNQUFLaEYsZUFBZStGLGVBQWYsQ0FBK0JoQixHQUEvQixDQUF2QyxFQUFQO0FBQ0E7QUFsUHNCLENBQWpCIiwiZmlsZSI6Im9mZmljZURvY3VtZW50LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFBhcnQgZnJvbSBcIi4uL3BhcnRcIlxyXG5cclxuZXhwb3J0IGNsYXNzIE9mZmljZURvY3VtZW50IGV4dGVuZHMgUGFydHtcclxuXHRfaW5pdCgpe1xyXG5cdFx0c3VwZXIuX2luaXQoKVxyXG5cdFx0Y29uc3Qgc3VwcG9ydGVkPVwic3R5bGVzLG51bWJlcmluZyx0aGVtZSxzZXR0aW5nc1wiLnNwbGl0KFwiLFwiKVxyXG5cdFx0dGhpcy5yZWxzKGBSZWxhdGlvbnNoaXBbVGFyZ2V0JD1cIi54bWxcIl1gKS5lYWNoKChpLHJlbCk9PntcclxuXHRcdFx0bGV0ICQ9dGhpcy5yZWxzKHJlbClcclxuXHRcdFx0bGV0IHR5cGU9JC5hdHRyKFwiVHlwZVwiKS5zcGxpdChcIi9cIikucG9wKClcclxuXHRcdFx0aWYoc3VwcG9ydGVkLmluZGV4T2YodHlwZSkhPS0xKXtcclxuXHRcdFx0XHRsZXQgdGFyZ2V0PSQuYXR0cihcIlRhcmdldFwiKVxyXG5cdFx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLHR5cGUse1xyXG5cdFx0XHRcdFx0Z2V0KCl7XHJcblx0XHRcdFx0XHRcdHJldHVybiB0aGlzLmdldFJlbE9iamVjdCh0YXJnZXQpXHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fSlcclxuXHRcdFx0fVxyXG5cdFx0fSlcclxuXHR9XHJcblxyXG5cdHJlbmRlcihjcmVhdGVFbGVtZW50LCBpZGVudGlmeT1PZmZpY2VEb2N1bWVudC5pZGVudGlmeSl7XHJcblx0XHRpZih0aGlzLnN0eWxlcylcclxuXHRcdFx0dGhpcy5yZW5kZXJOb2RlKHRoaXMuc3R5bGVzKFwid1xcXFw6c3R5bGVzXCIpLmdldCgwKSxjcmVhdGVFbGVtZW50LGlkZW50aWZ5KVxyXG5cdFx0aWYodGhpcy5udW1iZXJpbmcpXHJcblx0XHRcdHRoaXMucmVuZGVyTm9kZSh0aGlzLm51bWJlcmluZyhcIndcXFxcOm51bWJlcmluZ1wiKS5nZXQoMCksY3JlYXRlRWxlbWVudCxpZGVudGlmeSlcclxuXHRcdHJldHVybiB0aGlzLnJlbmRlck5vZGUodGhpcy5jb250ZW50KFwid1xcXFw6ZG9jdW1lbnRcIikuZ2V0KDApLGNyZWF0ZUVsZW1lbnQsIGlkZW50aWZ5KVxyXG5cdH1cclxuXHJcblx0cGFyc2UoZG9tSGFuZGxlcixpZGVudGlmeT1PZmZpY2VEb2N1bWVudC5pZGVudGlmeSl7XHJcblx0XHRjb25zdCBkb2M9e31cclxuXHRcdGNvbnN0IGNyZWF0ZUVsZW1lbnQ9ZG9tSGFuZGxlci5jcmVhdGVFbGVtZW50LmJpbmQoZG9tSGFuZGxlcilcclxuXHRcdGZ1bmN0aW9uIF9pZGVudGlmeSgpe1xyXG5cdFx0XHRsZXQgbW9kZWw9aWRlbnRpZnkoLi4uYXJndW1lbnRzKVxyXG5cdFx0XHRpZihtb2RlbCAmJiB0eXBlb2YobW9kZWwpPT1cIm9iamVjdFwiKXtcclxuXHRcdFx0XHRkb21IYW5kbGVyLmVtaXQoXCIqXCIsbW9kZWwsLi4uYXJndW1lbnRzKVxyXG5cdFx0XHRcdGRvbUhhbmRsZXIuZW1pdChtb2RlbC50eXBlLCBtb2RlbCwuLi5hcmd1bWVudHMpXHJcblx0XHRcdFx0aWYoZG9tSGFuZGxlcltgb24ke21vZGVsLnR5cGV9YF0pXHJcblx0XHRcdFx0XHRkb21IYW5kbGVyW2BvbiR7bW9kZWwudHlwZX1gXShtb2RlbCwuLi5hcmd1bWVudHMpXHJcblx0XHRcdH1cclxuXHRcdFx0cmV0dXJuIG1vZGVsXHJcblx0XHR9XHJcblxyXG5cdFx0aWYodGhpcy5zdHlsZXMpXHJcblx0XHRcdGRvYy5zdHlsZXM9dGhpcy5yZW5kZXJOb2RlKHRoaXMuc3R5bGVzKFwid1xcXFw6c3R5bGVzXCIpLmdldCgwKSxjcmVhdGVFbGVtZW50LF9pZGVudGlmeSlcclxuXHRcdGlmKHRoaXMubnVtYmVyaW5nKVxyXG5cdFx0XHRkb2MubnVtYmVyaW5nPXRoaXMucmVuZGVyTm9kZSh0aGlzLm51bWJlcmluZyhcIndcXFxcOm51bWJlcmluZ1wiKS5nZXQoMCksY3JlYXRlRWxlbWVudCxfaWRlbnRpZnkpXHJcblx0XHRkb2MuZG9jdW1lbnQ9dGhpcy5yZW5kZXJOb2RlKHRoaXMuY29udGVudChcIndcXFxcOmRvY3VtZW50XCIpLmdldCgwKSxjcmVhdGVFbGVtZW50LF9pZGVudGlmeSlcclxuXHRcdHJldHVybiBkb2NcclxuXHR9XHJcblxyXG5cdHN0YXRpYyBpZGVudGlmeSh3WG1sLCBvZmZpY2VEb2N1bWVudCl7XHJcblx0XHRjb25zdCB0YWc9d1htbC5uYW1lLnNwbGl0KFwiOlwiKS5wb3AoKVxyXG5cdFx0aWYoaWRlbnRpdGllc1t0YWddKVxyXG5cdFx0XHRyZXR1cm4gaWRlbnRpdGllc1t0YWddKC4uLmFyZ3VtZW50cylcclxuXHJcblx0XHRyZXR1cm4gdGFnXHJcblx0fVxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBPZmZpY2VEb2N1bWVudFxyXG5cclxuZXhwb3J0IGNvbnN0IGlkZW50aXRpZXM9e1xyXG5cdGRvY3VtZW50KHdYbWwsb2ZmaWNlRG9jdW1lbnQpe1xyXG5cdFx0bGV0ICQ9b2ZmaWNlRG9jdW1lbnQuY29udGVudFxyXG5cdFx0bGV0IGN1cnJlbnQ9bnVsbFxyXG5cdFx0bGV0IGNoaWxkcmVuPSQoXCJ3XFxcXDpzZWN0UHJcIikuZWFjaCgoaSxzZWN0KT0+e1xyXG5cdFx0XHRsZXQgZW5kPSQoc2VjdCkuY2xvc2VzdCgnd1xcXFw6Ym9keT4qJylcclxuXHRcdFx0c2VjdC5jb250ZW50PWVuZC5wcmV2VW50aWwoY3VycmVudCkudG9BcnJheSgpLnJldmVyc2UoKVxyXG5cdFx0XHRpZighZW5kLmlzKHNlY3QpKVxyXG5cdFx0XHRcdHNlY3QuY29udGVudC5wdXNoKGVuZC5nZXQoMCkpXHJcblx0XHRcdGN1cnJlbnQ9ZW5kXHJcblx0XHR9KS50b0FycmF5KClcclxuXHRcdHJldHVybiB7dHlwZTpcImRvY3VtZW50XCIsIGNoaWxkcmVufVxyXG5cdH0sXHJcblx0c2VjdFByKHdYbWwsb2ZmaWNlRG9jdW1lbnQpe1xyXG5cdFx0Y29uc3QgaGY9dHlwZT0+d1htbC5jaGlsZHJlbi5maWx0ZXIoYT0+YS5uYW1lPT1gdzoke3R5cGV9UmVmZXJlbmNlYCkucmVkdWNlKChoZWFkZXJzLGEpPT57XHJcblx0XHRcdFx0aGVhZGVycy5zZXQoYS5hdHRyaWJzW1widzp0eXBlXCJdLG9mZmljZURvY3VtZW50LmdldFJlbChhLmF0dHJpYnNbXCJyOmlkXCJdKSlcclxuXHRcdFx0XHRyZXR1cm4gaGVhZGVyc1xyXG5cdFx0XHR9LG5ldyBNYXAoKSlcclxuXHJcblx0XHRyZXR1cm4ge1xyXG5cdFx0XHR0eXBlOlwic2VjdGlvblwiLFxyXG5cdFx0XHRjaGlsZHJlbjp3WG1sLmNvbnRlbnQsXHJcblx0XHRcdGhlYWRlcnM6aGYoXCJoZWFkZXJcIiksXHJcblx0XHRcdGZvb3RlcnM6aGYoXCJmb290ZXJcIiksXHJcblx0XHRcdGhhc1RpdGxlUGFnZTogISF3WG1sLmNoaWxkcmVuLmZpbmQoYT0+YS5uYW1lPT1cInc6dGl0bGVQZ1wiKVxyXG5cdFx0fVxyXG5cdH0sXHJcblx0cCh3WG1sLG9mZmljZURvY3VtZW50KXtcclxuXHRcdGxldCAkPW9mZmljZURvY3VtZW50LmNvbnRlbnQod1htbClcclxuXHRcdGxldCB0eXBlPVwicFwiXHJcblxyXG5cdFx0bGV0IGlkZW50aXR5PXt0eXBlLHByOndYbWwuY2hpbGRyZW4uZmluZCgoe25hbWV9KT0+bmFtZT09XCJ3OnBQclwiKSxjaGlsZHJlbjp3WG1sLmNoaWxkcmVuLmZpbHRlcigoe25hbWV9KT0+bmFtZSE9XCJ3OnBQclwiKX1cclxuXHJcblx0XHRsZXQgcFByPSQuZmluZChcIndcXFxcOnBQclwiKVxyXG5cdFx0aWYocFByLmxlbmd0aCl7XHJcblx0XHRcdGxldCBzdHlsZUlkPXBQci5maW5kKFwid1xcXFw6cFN0eWxlXCIpLmF0dHIoXCJ3OnZhbFwiKVxyXG5cclxuXHRcdFx0bGV0IG51bVByPXBQci5maW5kKFwid1xcXFw6bnVtUHI+d1xcXFw6bnVtSWRcIilcclxuXHRcdFx0aWYoIW51bVByLmxlbmd0aCAmJiBzdHlsZUlkKXtcclxuXHRcdFx0XHRudW1Qcj1vZmZpY2VEb2N1bWVudC5zdHlsZXMoYHdcXFxcOnN0eWxlW3dcXFxcOnN0eWxlSWQ9XCIke3N0eWxlSWR9XCJdIHdcXFxcOm51bVByPndcXFxcOm51bUlkYClcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0aWYobnVtUHIubGVuZ3RoKXtcclxuXHRcdFx0XHRpZGVudGl0eS50eXBlPVwibGlzdFwiXHJcblx0XHRcdFx0aWRlbnRpdHkubnVtSWQ9bnVtUHIuZmluZChcIndcXFxcOm51bUlkXCIpLmF0dHIoXCJ3OnZhbFwiKVxyXG5cdFx0XHRcdGlkZW50aXR5LmxldmVsPW51bVByLmZpbmQoXCJ3XFxcXDppbHZsXCIpLmF0dHIoXCJ3OnZhbFwiKVxyXG5cdFx0XHR9ZWxzZXtcclxuXHRcdFx0XHRsZXQgb3V0bGluZUx2bD1wUHIuZmluZChcIndcXFxcOm91dGxpbmVMdmxcIikuYXR0cihcInc6dmFsXCIpXHJcblx0XHRcdFx0aWYoIW91dGxpbmVMdmwgJiYgc3R5bGVJZClcclxuXHRcdFx0XHRcdG91dGxpbmVMdmw9b2ZmaWNlRG9jdW1lbnQuc3R5bGVzKGB3XFxcXDpzdHlsZVt3XFxcXDpzdHlsZUlkPVwiJHtzdHlsZUlkfVwiXSB3XFxcXDpvdXRsaW5lTHZsYCkuYXR0cihcInc6dmFsXCIpXHJcblxyXG5cdFx0XHRcdGlmKG91dGxpbmVMdmwpe1xyXG5cdFx0XHRcdFx0aWRlbnRpdHkudHlwZT1cImhlYWRpbmdcIlxyXG5cdFx0XHRcdFx0aWRlbnRpdHkubGV2ZWw9cGFyc2VJbnQob3V0bGluZUx2bCkrMVxyXG4gICAgICAgICAgICAgICAgICAgIGlkZW50aXR5LnN0eWxlSWQ9c3R5bGVJZFxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0fVxyXG4gICAgICAgIGlkZW50aXR5Lnd0ID0gZnVuY3Rpb24oKSB7XHJcblx0XHRcdHJldHVybiAkLmZpbmQoJ3dcXFxcOnQnKS5tYXAoZnVuY3Rpb24gKGluZGV4LCBlbGVtZW50KSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZWxlbWVudC5jaGlsZHJlbjtcclxuICAgICAgICAgICAgfSkuZ2V0KCk7XHJcbiAgICAgICAgfTtcclxuXHJcblx0XHRyZXR1cm4gaWRlbnRpdHlcclxuXHR9LFxyXG5cdHIod1htbCl7XHJcblx0XHRyZXR1cm4ge3R5cGU6XCJyXCIsIHByOiB3WG1sLmNoaWxkcmVuLmZpbmQoKHtuYW1lfSk9Pm5hbWU9PVwidzpyUHJcIiksIGNoaWxkcmVuOiB3WG1sLmNoaWxkcmVuLmZpbHRlcigoe25hbWV9KT0+bmFtZSE9XCJ3OnJQclwiKX1cclxuXHR9LFxyXG5cdGZsZENoYXIod1htbCl7XHJcblx0XHRyZXR1cm4gd1htbC5hdHRyaWJzW1widzpmbGRDaGFyVHlwZVwiXVxyXG5cdH0sXHJcblxyXG5cdGlubGluZSh3WG1sLG9mZmljZURvY3VtZW50KXtcclxuXHRcdGxldCAkPW9mZmljZURvY3VtZW50LmNvbnRlbnQod1htbClcclxuXHRcdHJldHVybiB7dHlwZTpgZHJhd2luZy5pbmxpbmVgLCBjaGlsZHJlbjokLmZpbmQoJ2FcXFxcOmdyYXBoaWM+YVxcXFw6Z3JhcGhpY0RhdGEnKS5jaGlsZHJlbigpLnRvQXJyYXkoKX1cclxuXHR9LFxyXG5cdGFuY2hvcih3WG1sLCBvZmZpY2VEb2N1bWVudCl7XHJcblx0XHRsZXQgJD1vZmZpY2VEb2N1bWVudC5jb250ZW50KHdYbWwpXHJcblx0XHRsZXQgZ3JhcGhpY0RhdGE9JC5maW5kKCdhXFxcXDpncmFwaGljPmFcXFxcOmdyYXBoaWNEYXRhJylcclxuXHRcdGxldCB0eXBlPWdyYXBoaWNEYXRhLmF0dHIoXCJ1cmlcIikuc3BsaXQoXCIvXCIpLnBvcCgpXHJcblx0XHRsZXQgY2hpbGRyZW49Z3JhcGhpY0RhdGEuY2hpbGRyZW4oKS50b0FycmF5KClcclxuXHRcdGlmKHR5cGU9PVwid29yZHByb2Nlc3NpbmdHcm91cFwiKVxyXG5cdFx0XHRjaGlsZHJlbj1jaGlsZHJlblswXS5jaGlsZHJlbi5maWx0ZXIoYT0+YS5uYW1lLnNwbGl0KFwiOlwiKVswXSE9XCJ3cGdcIilcclxuXHJcblx0XHRyZXR1cm4ge3R5cGU6XCJkcmF3aW5nLmFuY2hvclwiLGNoaWxkcmVufVxyXG5cdH0sXHJcblx0cGljKHdYbWwsIG9mZmljZURvY3VtZW50KXtcclxuXHRcdGxldCBibGlwPW9mZmljZURvY3VtZW50LmNvbnRlbnQod1htbCkuZmluZChcImFcXFxcOmJsaXBcIilcclxuXHRcdGxldCByaWQ9YmxpcC5hdHRyKCdyOmVtYmVkJyl8fGJsaXAuYXR0cigncjpsaW5rJylcclxuXHRcdHJldHVybiB7dHlwZTpcInBpY3R1cmVcIiwuLi5vZmZpY2VEb2N1bWVudC5nZXRSZWwocmlkKX1cclxuXHR9LFxyXG5cdHdzcCh3WG1sLCBvZmZpY2VEb2N1bWVudCl7XHJcblx0XHRyZXR1cm4ge3R5cGU6XCJzaGFwZVwiLCBjaGlsZHJlbjpvZmZpY2VEb2N1bWVudC5jb250ZW50KHdYbWwpLmZpbmQoXCI+d3BzXFxcXDp0eGJ4PndcXFxcOnR4YnhDb250ZW50XCIpLmNoaWxkcmVuKCkudG9BcnJheSgpfVxyXG5cdH0sXHJcblx0RmFsbGJhY2soKXtcclxuXHRcdHJldHVybiBudWxsXHJcblx0fSxcclxuXHRzZHQod1htbCxvZmZpY2VEb2N1bWVudCl7XHJcblx0XHRsZXQgJD1vZmZpY2VEb2N1bWVudC5jb250ZW50KHdYbWwpXHJcblx0XHRsZXQgcHI9JC5maW5kKCc+d1xcXFw6c2R0UHInKVxyXG5cdFx0bGV0IGNvbnRlbnQ9JC5maW5kKCc+d1xcXFw6c2R0Q29udGVudCcpXHJcblx0XHRsZXQgY2hpbGRyZW49Y29udGVudC5jaGlsZHJlbigpLnRvQXJyYXkoKVxyXG5cclxuXHRcdGxldCBlbEJpbmRpbmc9cHIuZmluZCgnd1xcXFw6ZGF0YUJpbmRpbmcnKS5nZXQoMClcclxuXHRcdGlmKGVsQmluZGluZyl7Ly9wcm9wZXJ0aWVzXHJcblx0XHRcdGxldCBwYXRoPWVsQmluZGluZy5hdHRyaWJzWyd3OnhwYXRoJ10sXHJcblx0XHRcdFx0ZD1wYXRoLnNwbGl0KC9bXFwvXFw6XFxbXS8pLFxyXG5cdFx0XHRcdG5hbWU9KGQucG9wKCksZC5wb3AoKSk7XHJcblx0XHRcdGxldCB2YWx1ZT1jb250ZW50LnRleHQoKVxyXG5cclxuXHRcdFx0cmV0dXJuIHt0eXBlOlwicHJvcGVydHlcIiwgbmFtZSwgdmFsdWUsIGNoaWxkcmVufVxyXG5cdFx0fWVsc2V7Ly9jb250cm9sc1xyXG5cdFx0XHRsZXQgcHJDaGlsZHJlbj1wci5nZXQoMCkuY2hpbGRyZW5cclxuXHRcdFx0bGV0IGVsVHlwZT1wckNoaWxkcmVuW3ByQ2hpbGRyZW4ubGVuZ3RoLTFdXHJcblx0XHRcdGxldCBuYW1lPWVsVHlwZS5uYW1lLnNwbGl0KFwiOlwiKS5wb3AoKVxyXG5cdFx0XHRsZXQgdHlwZT1cInRleHQscGljdHVyZSxkb2NQYXJ0TGlzdCxjb21ib0JveCxkcm9wRG93bkxpc3QsZGF0ZSxjaGVja2JveCxyZXBlYXRpbmdTZWN0aW9uLHJlcGVhdGluZ1NlY3Rpb25JdGVtXCIuc3BsaXQoXCIsXCIpXHJcblx0XHRcdFx0LmZpbmQoYT0+YT09bmFtZSlcclxuXHRcdFx0bGV0IG1vZGVsPXtjaGlsZHJlbn1cclxuXHRcdFx0aWYodHlwZSl7XHJcblx0XHRcdFx0bW9kZWwudHlwZT1gY29udHJvbC4ke3R5cGV9YFxyXG5cdFx0XHR9ZWxzZXsvL2NvbnRhaW5lclxyXG5cdFx0XHRcdGlmKGNvbnRlbnQuZmluZChcIndcXFxcOnAsd1xcXFw6dGJsLHdcXFxcOnRyLHdcXFxcOnRjXCIpLmxlbmd0aCl7XHJcblx0XHRcdFx0XHRtb2RlbC50eXBlPVwiYmxvY2tcIlxyXG5cdFx0XHRcdH1lbHNle1xyXG5cdFx0XHRcdFx0bW9kZWwudHlwZT1cImlubGluZVwiXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHRcdFxyXG5cdFx0XHQkPW9mZmljZURvY3VtZW50LmNvbnRlbnRcclxuXHRcdFx0c3dpdGNoKG1vZGVsLnR5cGUpe1xyXG5cdFx0XHRcdGNhc2UgXCJjb250cm9sLmRyb3BEb3duTGlzdFwiOlx0XHJcblx0XHRcdFx0Y2FzZSBcImNvbnRyb2wuY29tYm9Cb3hcIjp7XHJcblx0XHRcdFx0XHRsZXQgc2VsZWN0ZWQ9JChjb250ZW50KS50ZXh0KClcclxuXHRcdFx0XHRcdG1vZGVsLm9wdGlvbnM9JChlbFR5cGUpXHJcblx0XHRcdFx0XHRcdC5maW5kKFwid1xcXFw6bGlzdEl0ZW1cIilcclxuXHRcdFx0XHRcdFx0Lm1hcCgoaSxsaSk9PntcclxuXHRcdFx0XHRcdFx0XHRyZXR1cm4ge1xyXG5cdFx0XHRcdFx0XHRcdFx0ZGlzcGxheVRleHQ6IGxpLmF0dHJpYnNbXCJ3OmRpc3BsYXlUZXh0XCJdLFxyXG5cdFx0XHRcdFx0XHRcdFx0dmFsdWU6IGxpLmF0dHJpYnNbXCJ3OnZhbHVlXCJdXHJcblx0XHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHR9KVxyXG5cdFx0XHRcdFx0XHQuZ2V0KClcclxuXHRcdFx0XHRcdG1vZGVsLnZhbHVlPShtb2RlbC5vcHRpb25zLmZpbmQoYT0+YS5kaXNwbGF5VGV4dD09c2VsZWN0ZWQpfHx7fSkudmFsdWVcclxuXHRcdFx0XHRcdGJyZWFrXHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGNhc2UgXCJjb250cm9sLmNoZWNrYm94XCI6e1xyXG5cdFx0XHRcdFx0bGV0IG5zPWVsVHlwZS5uYW1lLnNwbGl0KFwiOlwiKVswXVxyXG5cdFx0XHRcdFx0bW9kZWwuY2hlY2tlZD0kKGVsVHlwZSkuZmluZChgJHtuc31cXFxcOmNoZWNrZWRgKS5hdHRyKGAke25zfTp2YWxgKT09XCIxXCJcclxuXHRcdFx0XHRcdGJyZWFrXHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGNhc2UgXCJjb250cm9sLnRleHRcIjpcclxuXHRcdFx0XHRcdGlmKGNvbnRlbnQuZmluZCgnd1xcXFw6ciBbd1xcXFw6dmFsfj1QbGFjZWhvbGRlcl0nKS5sZW5ndGg9PTApXHJcblx0XHRcdFx0XHRcdG1vZGVsLnZhbHVlPWNvbnRlbnQudGV4dCgpXHJcblx0XHRcdFx0XHRicmVha1xyXG5cdFx0XHRcdGNhc2UgXCJjb250cm9sLmRhdGVcIjpcclxuXHRcdFx0XHRcdG1vZGVsLnZhbHVlPW5ldyBEYXRlKCQoZWxUeXBlKS5hdHRyKFwidzpmdWxsRGF0ZVwiKSlcclxuXHRcdFx0XHRcdG1vZGVsLmZvcm1hdD0kKGVsVHlwZSkuZmluZChcIndcXFxcOmRhdGVGb3JtYXRcIikuYXR0cihcInc6dmFsXCIpXHJcblx0XHRcdFx0XHRtb2RlbC5sb2NhbGU9JChlbFR5cGUpLmZpbmQoXCJ3XFxcXDpsaWRcIikuYXR0cihcInc6dmFsXCIpXHJcblx0XHRcdFx0XHRicmVha1xyXG5cdFx0XHR9XHJcblx0XHRcdHJldHVybiBtb2RlbFxyXG5cdFx0fVxyXG5cdH0sXHJcblx0aHlwZXJsaW5rKHdYbWwsb2ZmaWNlRG9jdW1lbnQpe1xyXG4gICAgICAgIGlmICh3WG1sLmF0dHJpYnNbXCJyOmlkXCJdKSB7XHJcbiAgICAgICAgICAgIGxldCB1cmw9b2ZmaWNlRG9jdW1lbnQuZ2V0UmVsKHdYbWwuYXR0cmlic1tcInI6aWRcIl0pXHJcbiAgICAgICAgICAgIHJldHVybiB7dHlwZTpcImh5cGVybGlua1wiLCB1cmx9O1xyXG4gICAgICAgIH0gZWxzZSBpZiAod1htbC5hdHRyaWJzWyd3OmFuY2hvciddKSB7XHJcbiAgICAgICAgXHRsZXQgbmFtZSA9IHdYbWwuYXR0cmlic1sndzphbmNob3InXTsgLy9UT0RPXHJcbiAgICAgICAgICAgIHJldHVybiB7dHlwZTonYW5jaG9yJywgbmFtZX07XHJcbiAgICAgICAgfVxyXG5cdH0sXHJcblx0dGJsKHdYbWwpe1xyXG5cdFx0cmV0dXJuIHdYbWwuY2hpbGRyZW4ucmVkdWNlKChzdGF0ZSxub2RlKT0+e1xyXG5cdFx0XHRzd2l0Y2gobm9kZS5uYW1lKXtcclxuXHRcdFx0Y2FzZSBcInc6dGJsUHJcIjpcclxuXHRcdFx0XHRzdGF0ZS5wcj1ub2RlXHJcblx0XHRcdGJyZWFrXHJcblx0XHRcdGNhc2UgXCJ3OnRibEdyaWRcIjpcclxuXHRcdFx0XHRzdGF0ZS5jb2xzPW5vZGUuY2hpbGRyZW5cclxuXHRcdFx0YnJlYWtcclxuXHRcdFx0ZGVmYXVsdDpcclxuXHRcdFx0XHRzdGF0ZS5jaGlsZHJlbi5wdXNoKG5vZGUpXHJcblx0XHRcdH1cclxuXHRcdFx0cmV0dXJuIHN0YXRlXHJcblx0XHR9LHt0eXBlOlwidGJsXCIsY2hpbGRyZW46W10scHI6bnVsbCxjb2xzOltdfSlcclxuXHR9LFxyXG5cdHRyKHdYbWwpe1xyXG5cdFx0cmV0dXJuIHdYbWwuY2hpbGRyZW4ucmVkdWNlKChzdGF0ZSxub2RlKT0+e1xyXG5cdFx0XHRzd2l0Y2gobm9kZS5uYW1lKXtcclxuXHRcdFx0Y2FzZSBcInc6dHJQclwiOlxyXG5cdFx0XHRcdHN0YXRlLnByPW5vZGVcclxuXHRcdFx0XHRzdGF0ZS5pc0hlYWRlcj0hIW5vZGUuY2hpbGRyZW4uZmluZChhPT5hLm5hbWU9PVwidzp0YmxIZWFkZXJcIilcclxuXHRcdFx0YnJlYWtcclxuXHRcdFx0ZGVmYXVsdDpcclxuXHRcdFx0XHRzdGF0ZS5jaGlsZHJlbi5wdXNoKG5vZGUpXHJcblx0XHRcdH1cclxuXHRcdFx0cmV0dXJuIHN0YXRlXHJcblx0XHR9LHt0eXBlOlwidHJcIixjaGlsZHJlbjpbXSxwcjpudWxsfSlcclxuXHR9LFxyXG5cdHRjKHdYbWwpe1xyXG5cdFx0cmV0dXJuIHdYbWwuY2hpbGRyZW4ucmVkdWNlKChzdGF0ZSxub2RlKT0+e1xyXG5cdFx0XHRzd2l0Y2gobm9kZS5uYW1lKXtcclxuXHRcdFx0Y2FzZSBcInc6dGNQclwiOlxyXG5cdFx0XHRcdHN0YXRlLnByPW5vZGVcclxuXHRcdFx0YnJlYWtcclxuXHRcdFx0ZGVmYXVsdDpcclxuXHRcdFx0XHRzdGF0ZS5jaGlsZHJlbi5wdXNoKG5vZGUpXHJcblx0XHRcdH1cclxuXHRcdFx0cmV0dXJuIHN0YXRlXHJcblx0XHR9LHt0eXBlOlwidGNcIixjaGlsZHJlbjpbXSxwcjpudWxsfSlcclxuXHR9LFxyXG5cdGFsdENodW5rKHdYbWwsIG9mZmljZURvY3VtZW50KXtcclxuXHRcdGxldCBySWQ9d1htbC5hdHRyaWJzWydyOmlkJ11cclxuXHRcdGxldCBkYXRhPW9mZmljZURvY3VtZW50LmdldFJlbChySWQpXHJcblxyXG5cdFx0bGV0IHBhcnROYW1lPW9mZmljZURvY3VtZW50LmZvbGRlcitvZmZpY2VEb2N1bWVudC5yZWxzKGBbSWQ9JHtySWR9XWApLmF0dHIoXCJUYXJnZXRcIilcclxuXHRcdGxldCBjb250ZW50VHlwZT1vZmZpY2VEb2N1bWVudC5kb2MuY29udGVudFR5cGVzKGBPdmVycmlkZVtQYXJ0TmFtZT0nJHtwYXJ0TmFtZX0nXWApLmF0dHIoXCJDb250ZW50VHlwZVwiKVxyXG5cdFx0cmV0dXJuIHt0eXBlOlwiY2h1bmtcIiwgZGF0YSwgY29udGVudFR5cGV9XHJcblx0fSxcclxuXHRkb2NEZWZhdWx0cyh3WG1sKXtcclxuXHRcdHJldHVybiB7dHlwZTpcInN0eWxlXCJ9XHJcblx0fSxcclxuXHRzdHlsZSh3WG1sKXtcclxuXHRcdHJldHVybiB7dHlwZTpcInN0eWxlXCIsIGlkOndYbWwuYXR0cmlic1sndzpzdHlsZUlkJ119XHJcblx0fSxcclxuXHRhYnN0cmFjdE51bSh3WG1sKXtcclxuXHRcdHJldHVybiB7dHlwZTpcImFic3RyYWN0TnVtXCIsaWQ6d1htbC5hdHRyaWJzW1widzphYnN0cmFjdE51bUlkXCJdfVxyXG5cdH0sXHJcblx0bnVtKHdYbWwpe1xyXG5cdFx0cmV0dXJuIHt0eXBlOlwibnVtXCIsaWQ6d1htbC5hdHRyaWJzW1widzpudW1JZFwiXSxhYnN0cmFjdE51bTp3WG1sLmNoaWxkcmVuLmZpbmQoYT0+YS5uYW1lPT1cInc6YWJzdHJhY3ROdW1JZFwiKS5hdHRyaWJzW1widzp2YWxcIl19XHJcblx0fSxcclxuXHRsYXRlbnRTdHlsZXMoKXtcclxuXHRcdHJldHVybiBudWxsXHJcblx0fSxcclxuXHRvYmplY3Qod1htbCxvZmZpY2VEb2N1bWVudCl7XHJcblx0XHRsZXQgb2xlPW9mZmljZURvY3VtZW50LmNvbnRlbnQod1htbCkuZmluZChcIm9cXFxcOk9MRU9iamVjdFwiKVxyXG5cdFx0bGV0IHR5cGU9b2xlLmF0dHIoXCJQcm9nSURcIilcclxuXHRcdGxldCBlbWJlZD1vbGUuYXR0cihcIlR5cGVcIik9PT1cIkVtYmVkXCJcclxuXHRcdGxldCBySWQ9b2xlLmF0dHIoXCJyOmlkXCIpXHJcblx0XHRyZXR1cm4ge3R5cGU6XCJvYmplY3RcIixlbWJlZCwgcHJvZzogdHlwZSwgZGF0YTpvZmZpY2VEb2N1bWVudC5nZXRSZWxPbGVPYmplY3QocklkKX1cclxuXHR9XHJcbn1cclxuIl19