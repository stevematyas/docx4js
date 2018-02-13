"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.OfficeDocument = undefined;

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


var identities = {
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
				}
			}
		}

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
		var url = officeDocument.getRel(wXml.attribs["r:id"]);
		return { type: "hyperlink", url: url };
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9vcGVueG1sL2RvY3gvb2ZmaWNlRG9jdW1lbnQuanMiXSwibmFtZXMiOlsiT2ZmaWNlRG9jdW1lbnQiLCJzdXBwb3J0ZWQiLCJzcGxpdCIsInJlbHMiLCJlYWNoIiwiaSIsInJlbCIsIiQiLCJ0eXBlIiwiYXR0ciIsInBvcCIsImluZGV4T2YiLCJ0YXJnZXQiLCJPYmplY3QiLCJkZWZpbmVQcm9wZXJ0eSIsImdldCIsImdldFJlbE9iamVjdCIsImNyZWF0ZUVsZW1lbnQiLCJpZGVudGlmeSIsInN0eWxlcyIsInJlbmRlck5vZGUiLCJudW1iZXJpbmciLCJjb250ZW50IiwiZG9tSGFuZGxlciIsImRvYyIsImJpbmQiLCJfaWRlbnRpZnkiLCJtb2RlbCIsImFyZ3VtZW50cyIsImVtaXQiLCJkb2N1bWVudCIsIndYbWwiLCJvZmZpY2VEb2N1bWVudCIsInRhZyIsIm5hbWUiLCJpZGVudGl0aWVzIiwiY3VycmVudCIsImNoaWxkcmVuIiwic2VjdCIsImVuZCIsImNsb3Nlc3QiLCJwcmV2VW50aWwiLCJ0b0FycmF5IiwicmV2ZXJzZSIsImlzIiwicHVzaCIsInNlY3RQciIsImhmIiwiZmlsdGVyIiwiYSIsInJlZHVjZSIsImhlYWRlcnMiLCJzZXQiLCJhdHRyaWJzIiwiZ2V0UmVsIiwiTWFwIiwiZm9vdGVycyIsImhhc1RpdGxlUGFnZSIsImZpbmQiLCJwIiwiaWRlbnRpdHkiLCJwciIsInBQciIsImxlbmd0aCIsInN0eWxlSWQiLCJudW1QciIsIm51bUlkIiwibGV2ZWwiLCJvdXRsaW5lTHZsIiwicGFyc2VJbnQiLCJyIiwiZmxkQ2hhciIsImlubGluZSIsImFuY2hvciIsImdyYXBoaWNEYXRhIiwicGljIiwiYmxpcCIsInJpZCIsIndzcCIsIkZhbGxiYWNrIiwic2R0IiwiZWxCaW5kaW5nIiwicGF0aCIsImQiLCJ2YWx1ZSIsInRleHQiLCJwckNoaWxkcmVuIiwiZWxUeXBlIiwic2VsZWN0ZWQiLCJvcHRpb25zIiwibWFwIiwibGkiLCJkaXNwbGF5VGV4dCIsIm5zIiwiY2hlY2tlZCIsIkRhdGUiLCJmb3JtYXQiLCJsb2NhbGUiLCJoeXBlcmxpbmsiLCJ1cmwiLCJ0YmwiLCJzdGF0ZSIsIm5vZGUiLCJjb2xzIiwidHIiLCJpc0hlYWRlciIsInRjIiwiYWx0Q2h1bmsiLCJySWQiLCJkYXRhIiwicGFydE5hbWUiLCJmb2xkZXIiLCJjb250ZW50VHlwZSIsImNvbnRlbnRUeXBlcyIsImRvY0RlZmF1bHRzIiwic3R5bGUiLCJpZCIsImFic3RyYWN0TnVtIiwibnVtIiwibGF0ZW50U3R5bGVzIiwib2JqZWN0Iiwib2xlIiwiZW1iZWQiLCJwcm9nIiwiZ2V0UmVsT2xlT2JqZWN0Il0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFBQTs7Ozs7Ozs7Ozs7O0lBRWFBLGMsV0FBQUEsYzs7Ozs7Ozs7Ozs7MEJBQ0w7QUFBQTs7QUFDTjtBQUNBLE9BQU1DLFlBQVUsa0NBQWtDQyxLQUFsQyxDQUF3QyxHQUF4QyxDQUFoQjtBQUNBLFFBQUtDLElBQUwsbUNBQTBDQyxJQUExQyxDQUErQyxVQUFDQyxDQUFELEVBQUdDLEdBQUgsRUFBUztBQUN2RCxRQUFJQyxJQUFFLE9BQUtKLElBQUwsQ0FBVUcsR0FBVixDQUFOO0FBQ0EsUUFBSUUsT0FBS0QsRUFBRUUsSUFBRixDQUFPLE1BQVAsRUFBZVAsS0FBZixDQUFxQixHQUFyQixFQUEwQlEsR0FBMUIsRUFBVDtBQUNBLFFBQUdULFVBQVVVLE9BQVYsQ0FBa0JILElBQWxCLEtBQXlCLENBQUMsQ0FBN0IsRUFBK0I7QUFDOUIsU0FBSUksU0FBT0wsRUFBRUUsSUFBRixDQUFPLFFBQVAsQ0FBWDtBQUNBSSxZQUFPQyxjQUFQLFNBQTJCTixJQUEzQixFQUFnQztBQUMvQk8sU0FEK0IsaUJBQzFCO0FBQ0osY0FBTyxLQUFLQyxZQUFMLENBQWtCSixNQUFsQixDQUFQO0FBQ0E7QUFIOEIsTUFBaEM7QUFLQTtBQUNELElBWEQ7QUFZQTs7O3lCQUVNSyxhLEVBQWdEO0FBQUEsT0FBakNDLFFBQWlDLHVFQUF4QmxC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TUFBSyxLQUFOLEVBQVk0RyxJQUFHckYsS0FBS3NCLE9BQUwsQ0FBYSxTQUFiLENBQWYsRUFBdUNnRSxhQUFZdEYsS0FBS00sUUFBTCxDQUFjcUIsSUFBZCxDQUFtQjtBQUFBLFdBQUdULEVBQUVmLElBQUYsSUFBUSxpQkFBWDtBQUFBLElBQW5CLEVBQWlEbUIsT0FBakQsQ0FBeUQsT0FBekQsQ0FBbkQsRUFBUDtBQUNBLEVBN05lO0FBOE5oQmtFLGFBOU5nQiwwQkE4TkY7QUFDYixTQUFPLElBQVA7QUFDQSxFQWhPZTtBQWlPaEJDLE9Bak9nQixrQkFpT1R6RixJQWpPUyxFQWlPSkMsY0FqT0ksRUFpT1c7QUFDMUIsTUFBSXlGLE1BQUl6RixlQUFlVixPQUFmLENBQXVCUyxJQUF2QixFQUE2QjJCLElBQTdCLENBQWtDLGVBQWxDLENBQVI7QUFDQSxNQUFJbEQsT0FBS2lILElBQUloSCxJQUFKLENBQVMsUUFBVCxDQUFUO0FBQ0EsTUFBSWlILFFBQU1ELElBQUloSCxJQUFKLENBQVMsTUFBVCxNQUFtQixPQUE3QjtBQUNBLE1BQUltRyxNQUFJYSxJQUFJaEgsSUFBSixDQUFTLE1BQVQsQ0FBUjtBQUNBLFNBQU8sRUFBQ0QsTUFBSyxRQUFOLEVBQWVrSCxZQUFmLEVBQXNCQyxNQUFNbkgsSUFBNUIsRUFBa0NxRyxNQUFLN0UsZUFBZTRGLGVBQWYsQ0FBK0JoQixHQUEvQixDQUF2QyxFQUFQO0FBQ0E7QUF2T2UsQ0FBakIiLCJmaWxlIjoib2ZmaWNlRG9jdW1lbnQuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUGFydCBmcm9tIFwiLi4vcGFydFwiXHJcblxyXG5leHBvcnQgY2xhc3MgT2ZmaWNlRG9jdW1lbnQgZXh0ZW5kcyBQYXJ0e1xyXG5cdF9pbml0KCl7XHJcblx0XHRzdXBlci5faW5pdCgpXHJcblx0XHRjb25zdCBzdXBwb3J0ZWQ9XCJzdHlsZXMsbnVtYmVyaW5nLHRoZW1lLHNldHRpbmdzXCIuc3BsaXQoXCIsXCIpXHJcblx0XHR0aGlzLnJlbHMoYFJlbGF0aW9uc2hpcFtUYXJnZXQkPVwiLnhtbFwiXWApLmVhY2goKGkscmVsKT0+e1xyXG5cdFx0XHRsZXQgJD10aGlzLnJlbHMocmVsKVxyXG5cdFx0XHRsZXQgdHlwZT0kLmF0dHIoXCJUeXBlXCIpLnNwbGl0KFwiL1wiKS5wb3AoKVxyXG5cdFx0XHRpZihzdXBwb3J0ZWQuaW5kZXhPZih0eXBlKSE9LTEpe1xyXG5cdFx0XHRcdGxldCB0YXJnZXQ9JC5hdHRyKFwiVGFyZ2V0XCIpXHJcblx0XHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsdHlwZSx7XHJcblx0XHRcdFx0XHRnZXQoKXtcclxuXHRcdFx0XHRcdFx0cmV0dXJuIHRoaXMuZ2V0UmVsT2JqZWN0KHRhcmdldClcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9KVxyXG5cdFx0XHR9XHJcblx0XHR9KVxyXG5cdH1cclxuXHJcblx0cmVuZGVyKGNyZWF0ZUVsZW1lbnQsIGlkZW50aWZ5PU9mZmljZURvY3VtZW50LmlkZW50aWZ5KXtcclxuXHRcdGlmKHRoaXMuc3R5bGVzKVxyXG5cdFx0XHR0aGlzLnJlbmRlck5vZGUodGhpcy5zdHlsZXMoXCJ3XFxcXDpzdHlsZXNcIikuZ2V0KDApLGNyZWF0ZUVsZW1lbnQsaWRlbnRpZnkpXHJcblx0XHRpZih0aGlzLm51bWJlcmluZylcclxuXHRcdFx0dGhpcy5yZW5kZXJOb2RlKHRoaXMubnVtYmVyaW5nKFwid1xcXFw6bnVtYmVyaW5nXCIpLmdldCgwKSxjcmVhdGVFbGVtZW50LGlkZW50aWZ5KVxyXG5cdFx0cmV0dXJuIHRoaXMucmVuZGVyTm9kZSh0aGlzLmNvbnRlbnQoXCJ3XFxcXDpkb2N1bWVudFwiKS5nZXQoMCksY3JlYXRlRWxlbWVudCwgaWRlbnRpZnkpXHJcblx0fVxyXG5cclxuXHRwYXJzZShkb21IYW5kbGVyLGlkZW50aWZ5PU9mZmljZURvY3VtZW50LmlkZW50aWZ5KXtcclxuXHRcdGNvbnN0IGRvYz17fVxyXG5cdFx0Y29uc3QgY3JlYXRlRWxlbWVudD1kb21IYW5kbGVyLmNyZWF0ZUVsZW1lbnQuYmluZChkb21IYW5kbGVyKVxyXG5cdFx0ZnVuY3Rpb24gX2lkZW50aWZ5KCl7XHJcblx0XHRcdGxldCBtb2RlbD1pZGVudGlmeSguLi5hcmd1bWVudHMpXHJcblx0XHRcdGlmKG1vZGVsICYmIHR5cGVvZihtb2RlbCk9PVwib2JqZWN0XCIpe1xyXG5cdFx0XHRcdGRvbUhhbmRsZXIuZW1pdChcIipcIixtb2RlbCwuLi5hcmd1bWVudHMpXHJcblx0XHRcdFx0ZG9tSGFuZGxlci5lbWl0KG1vZGVsLnR5cGUsIG1vZGVsLC4uLmFyZ3VtZW50cylcclxuXHRcdFx0XHRpZihkb21IYW5kbGVyW2BvbiR7bW9kZWwudHlwZX1gXSlcclxuXHRcdFx0XHRcdGRvbUhhbmRsZXJbYG9uJHttb2RlbC50eXBlfWBdKG1vZGVsLC4uLmFyZ3VtZW50cylcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4gbW9kZWxcclxuXHRcdH1cclxuXHJcblx0XHRpZih0aGlzLnN0eWxlcylcclxuXHRcdFx0ZG9jLnN0eWxlcz10aGlzLnJlbmRlck5vZGUodGhpcy5zdHlsZXMoXCJ3XFxcXDpzdHlsZXNcIikuZ2V0KDApLGNyZWF0ZUVsZW1lbnQsX2lkZW50aWZ5KVxyXG5cdFx0aWYodGhpcy5udW1iZXJpbmcpXHJcblx0XHRcdGRvYy5udW1iZXJpbmc9dGhpcy5yZW5kZXJOb2RlKHRoaXMubnVtYmVyaW5nKFwid1xcXFw6bnVtYmVyaW5nXCIpLmdldCgwKSxjcmVhdGVFbGVtZW50LF9pZGVudGlmeSlcclxuXHRcdGRvYy5kb2N1bWVudD10aGlzLnJlbmRlck5vZGUodGhpcy5jb250ZW50KFwid1xcXFw6ZG9jdW1lbnRcIikuZ2V0KDApLGNyZWF0ZUVsZW1lbnQsX2lkZW50aWZ5KVxyXG5cdFx0cmV0dXJuIGRvY1xyXG5cdH1cclxuXHJcblx0c3RhdGljIGlkZW50aWZ5KHdYbWwsIG9mZmljZURvY3VtZW50KXtcclxuXHRcdGNvbnN0IHRhZz13WG1sLm5hbWUuc3BsaXQoXCI6XCIpLnBvcCgpXHJcblx0XHRpZihpZGVudGl0aWVzW3RhZ10pXHJcblx0XHRcdHJldHVybiBpZGVudGl0aWVzW3RhZ10oLi4uYXJndW1lbnRzKVxyXG5cclxuXHRcdHJldHVybiB0YWdcclxuXHR9XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IE9mZmljZURvY3VtZW50XHJcblxyXG5jb25zdCBpZGVudGl0aWVzPXtcclxuXHRkb2N1bWVudCh3WG1sLG9mZmljZURvY3VtZW50KXtcclxuXHRcdGxldCAkPW9mZmljZURvY3VtZW50LmNvbnRlbnRcclxuXHRcdGxldCBjdXJyZW50PW51bGxcclxuXHRcdGxldCBjaGlsZHJlbj0kKFwid1xcXFw6c2VjdFByXCIpLmVhY2goKGksc2VjdCk9PntcclxuXHRcdFx0bGV0IGVuZD0kKHNlY3QpLmNsb3Nlc3QoJ3dcXFxcOmJvZHk+KicpXHJcblx0XHRcdHNlY3QuY29udGVudD1lbmQucHJldlVudGlsKGN1cnJlbnQpLnRvQXJyYXkoKS5yZXZlcnNlKClcclxuXHRcdFx0aWYoIWVuZC5pcyhzZWN0KSlcclxuXHRcdFx0XHRzZWN0LmNvbnRlbnQucHVzaChlbmQuZ2V0KDApKVxyXG5cdFx0XHRjdXJyZW50PWVuZFxyXG5cdFx0fSkudG9BcnJheSgpXHJcblx0XHRyZXR1cm4ge3R5cGU6XCJkb2N1bWVudFwiLCBjaGlsZHJlbn1cclxuXHR9LFxyXG5cdHNlY3RQcih3WG1sLG9mZmljZURvY3VtZW50KXtcclxuXHRcdGNvbnN0IGhmPXR5cGU9PndYbWwuY2hpbGRyZW4uZmlsdGVyKGE9PmEubmFtZT09YHc6JHt0eXBlfVJlZmVyZW5jZWApLnJlZHVjZSgoaGVhZGVycyxhKT0+e1xyXG5cdFx0XHRcdGhlYWRlcnMuc2V0KGEuYXR0cmlic1tcInc6dHlwZVwiXSxvZmZpY2VEb2N1bWVudC5nZXRSZWwoYS5hdHRyaWJzW1wicjppZFwiXSkpXHJcblx0XHRcdFx0cmV0dXJuIGhlYWRlcnNcclxuXHRcdFx0fSxuZXcgTWFwKCkpXHJcblxyXG5cdFx0cmV0dXJuIHtcclxuXHRcdFx0dHlwZTpcInNlY3Rpb25cIixcclxuXHRcdFx0Y2hpbGRyZW46d1htbC5jb250ZW50LFxyXG5cdFx0XHRoZWFkZXJzOmhmKFwiaGVhZGVyXCIpLFxyXG5cdFx0XHRmb290ZXJzOmhmKFwiZm9vdGVyXCIpLFxyXG5cdFx0XHRoYXNUaXRsZVBhZ2U6ICEhd1htbC5jaGlsZHJlbi5maW5kKGE9PmEubmFtZT09XCJ3OnRpdGxlUGdcIilcclxuXHRcdH1cclxuXHR9LFxyXG5cdHAod1htbCxvZmZpY2VEb2N1bWVudCl7XHJcblx0XHRsZXQgJD1vZmZpY2VEb2N1bWVudC5jb250ZW50KHdYbWwpXHJcblx0XHRsZXQgdHlwZT1cInBcIlxyXG5cclxuXHRcdGxldCBpZGVudGl0eT17dHlwZSxwcjp3WG1sLmNoaWxkcmVuLmZpbmQoKHtuYW1lfSk9Pm5hbWU9PVwidzpwUHJcIiksY2hpbGRyZW46d1htbC5jaGlsZHJlbi5maWx0ZXIoKHtuYW1lfSk9Pm5hbWUhPVwidzpwUHJcIil9XHJcblxyXG5cdFx0bGV0IHBQcj0kLmZpbmQoXCJ3XFxcXDpwUHJcIilcclxuXHRcdGlmKHBQci5sZW5ndGgpe1xyXG5cdFx0XHRsZXQgc3R5bGVJZD1wUHIuZmluZChcIndcXFxcOnBTdHlsZVwiKS5hdHRyKFwidzp2YWxcIilcclxuXHJcblx0XHRcdGxldCBudW1Qcj1wUHIuZmluZChcIndcXFxcOm51bVByPndcXFxcOm51bUlkXCIpXHJcblx0XHRcdGlmKCFudW1Qci5sZW5ndGggJiYgc3R5bGVJZCl7XHJcblx0XHRcdFx0bnVtUHI9b2ZmaWNlRG9jdW1lbnQuc3R5bGVzKGB3XFxcXDpzdHlsZVt3XFxcXDpzdHlsZUlkPVwiJHtzdHlsZUlkfVwiXSB3XFxcXDpudW1Qcj53XFxcXDpudW1JZGApXHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGlmKG51bVByLmxlbmd0aCl7XHJcblx0XHRcdFx0aWRlbnRpdHkudHlwZT1cImxpc3RcIlxyXG5cdFx0XHRcdGlkZW50aXR5Lm51bUlkPW51bVByLmZpbmQoXCJ3XFxcXDpudW1JZFwiKS5hdHRyKFwidzp2YWxcIilcclxuXHRcdFx0XHRpZGVudGl0eS5sZXZlbD1udW1Qci5maW5kKFwid1xcXFw6aWx2bFwiKS5hdHRyKFwidzp2YWxcIilcclxuXHRcdFx0fWVsc2V7XHJcblx0XHRcdFx0bGV0IG91dGxpbmVMdmw9cFByLmZpbmQoXCJ3XFxcXDpvdXRsaW5lTHZsXCIpLmF0dHIoXCJ3OnZhbFwiKVxyXG5cdFx0XHRcdGlmKCFvdXRsaW5lTHZsICYmIHN0eWxlSWQpXHJcblx0XHRcdFx0XHRvdXRsaW5lTHZsPW9mZmljZURvY3VtZW50LnN0eWxlcyhgd1xcXFw6c3R5bGVbd1xcXFw6c3R5bGVJZD1cIiR7c3R5bGVJZH1cIl0gd1xcXFw6b3V0bGluZUx2bGApLmF0dHIoXCJ3OnZhbFwiKVxyXG5cclxuXHRcdFx0XHRpZihvdXRsaW5lTHZsKXtcclxuXHRcdFx0XHRcdGlkZW50aXR5LnR5cGU9XCJoZWFkaW5nXCJcclxuXHRcdFx0XHRcdGlkZW50aXR5LmxldmVsPXBhcnNlSW50KG91dGxpbmVMdmwpKzFcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gaWRlbnRpdHlcclxuXHR9LFxyXG5cdHIod1htbCl7XHJcblx0XHRyZXR1cm4ge3R5cGU6XCJyXCIsIHByOiB3WG1sLmNoaWxkcmVuLmZpbmQoKHtuYW1lfSk9Pm5hbWU9PVwidzpyUHJcIiksIGNoaWxkcmVuOiB3WG1sLmNoaWxkcmVuLmZpbHRlcigoe25hbWV9KT0+bmFtZSE9XCJ3OnJQclwiKX1cclxuXHR9LFxyXG5cdGZsZENoYXIod1htbCl7XHJcblx0XHRyZXR1cm4gd1htbC5hdHRyaWJzW1widzpmbGRDaGFyVHlwZVwiXVxyXG5cdH0sXHJcblxyXG5cdGlubGluZSh3WG1sLG9mZmljZURvY3VtZW50KXtcclxuXHRcdGxldCAkPW9mZmljZURvY3VtZW50LmNvbnRlbnQod1htbClcclxuXHRcdHJldHVybiB7dHlwZTpgZHJhd2luZy5pbmxpbmVgLCBjaGlsZHJlbjokLmZpbmQoJ2FcXFxcOmdyYXBoaWM+YVxcXFw6Z3JhcGhpY0RhdGEnKS5jaGlsZHJlbigpLnRvQXJyYXkoKX1cclxuXHR9LFxyXG5cdGFuY2hvcih3WG1sLCBvZmZpY2VEb2N1bWVudCl7XHJcblx0XHRsZXQgJD1vZmZpY2VEb2N1bWVudC5jb250ZW50KHdYbWwpXHJcblx0XHRsZXQgZ3JhcGhpY0RhdGE9JC5maW5kKCdhXFxcXDpncmFwaGljPmFcXFxcOmdyYXBoaWNEYXRhJylcclxuXHRcdGxldCB0eXBlPWdyYXBoaWNEYXRhLmF0dHIoXCJ1cmlcIikuc3BsaXQoXCIvXCIpLnBvcCgpXHJcblx0XHRsZXQgY2hpbGRyZW49Z3JhcGhpY0RhdGEuY2hpbGRyZW4oKS50b0FycmF5KClcclxuXHRcdGlmKHR5cGU9PVwid29yZHByb2Nlc3NpbmdHcm91cFwiKVxyXG5cdFx0XHRjaGlsZHJlbj1jaGlsZHJlblswXS5jaGlsZHJlbi5maWx0ZXIoYT0+YS5uYW1lLnNwbGl0KFwiOlwiKVswXSE9XCJ3cGdcIilcclxuXHJcblx0XHRyZXR1cm4ge3R5cGU6XCJkcmF3aW5nLmFuY2hvclwiLGNoaWxkcmVufVxyXG5cdH0sXHJcblx0cGljKHdYbWwsIG9mZmljZURvY3VtZW50KXtcclxuXHRcdGxldCBibGlwPW9mZmljZURvY3VtZW50LmNvbnRlbnQod1htbCkuZmluZChcImFcXFxcOmJsaXBcIilcclxuXHRcdGxldCByaWQ9YmxpcC5hdHRyKCdyOmVtYmVkJyl8fGJsaXAuYXR0cigncjpsaW5rJylcclxuXHRcdHJldHVybiB7dHlwZTpcInBpY3R1cmVcIiwuLi5vZmZpY2VEb2N1bWVudC5nZXRSZWwocmlkKX1cclxuXHR9LFxyXG5cdHdzcCh3WG1sLCBvZmZpY2VEb2N1bWVudCl7XHJcblx0XHRyZXR1cm4ge3R5cGU6XCJzaGFwZVwiLCBjaGlsZHJlbjpvZmZpY2VEb2N1bWVudC5jb250ZW50KHdYbWwpLmZpbmQoXCI+d3BzXFxcXDp0eGJ4PndcXFxcOnR4YnhDb250ZW50XCIpLmNoaWxkcmVuKCkudG9BcnJheSgpfVxyXG5cdH0sXHJcblx0RmFsbGJhY2soKXtcclxuXHRcdHJldHVybiBudWxsXHJcblx0fSxcclxuXHRzZHQod1htbCxvZmZpY2VEb2N1bWVudCl7XHJcblx0XHRsZXQgJD1vZmZpY2VEb2N1bWVudC5jb250ZW50KHdYbWwpXHJcblx0XHRsZXQgcHI9JC5maW5kKCc+d1xcXFw6c2R0UHInKVxyXG5cdFx0bGV0IGNvbnRlbnQ9JC5maW5kKCc+d1xcXFw6c2R0Q29udGVudCcpXHJcblx0XHRsZXQgY2hpbGRyZW49Y29udGVudC5jaGlsZHJlbigpLnRvQXJyYXkoKVxyXG5cclxuXHRcdGxldCBlbEJpbmRpbmc9cHIuZmluZCgnd1xcXFw6ZGF0YUJpbmRpbmcnKS5nZXQoMClcclxuXHRcdGlmKGVsQmluZGluZyl7Ly9wcm9wZXJ0aWVzXHJcblx0XHRcdGxldCBwYXRoPWVsQmluZGluZy5hdHRyaWJzWyd3OnhwYXRoJ10sXHJcblx0XHRcdFx0ZD1wYXRoLnNwbGl0KC9bXFwvXFw6XFxbXS8pLFxyXG5cdFx0XHRcdG5hbWU9KGQucG9wKCksZC5wb3AoKSk7XHJcblx0XHRcdGxldCB2YWx1ZT1jb250ZW50LnRleHQoKVxyXG5cclxuXHRcdFx0cmV0dXJuIHt0eXBlOlwicHJvcGVydHlcIiwgbmFtZSwgdmFsdWUsIGNoaWxkcmVufVxyXG5cdFx0fWVsc2V7Ly9jb250cm9sc1xyXG5cdFx0XHRsZXQgcHJDaGlsZHJlbj1wci5nZXQoMCkuY2hpbGRyZW5cclxuXHRcdFx0bGV0IGVsVHlwZT1wckNoaWxkcmVuW3ByQ2hpbGRyZW4ubGVuZ3RoLTFdXHJcblx0XHRcdGxldCBuYW1lPWVsVHlwZS5uYW1lLnNwbGl0KFwiOlwiKS5wb3AoKVxyXG5cdFx0XHRsZXQgdHlwZT1cInRleHQscGljdHVyZSxkb2NQYXJ0TGlzdCxjb21ib0JveCxkcm9wRG93bkxpc3QsZGF0ZSxjaGVja2JveCxyZXBlYXRpbmdTZWN0aW9uLHJlcGVhdGluZ1NlY3Rpb25JdGVtXCIuc3BsaXQoXCIsXCIpXHJcblx0XHRcdFx0LmZpbmQoYT0+YT09bmFtZSlcclxuXHRcdFx0bGV0IG1vZGVsPXtjaGlsZHJlbn1cclxuXHRcdFx0aWYodHlwZSl7XHJcblx0XHRcdFx0bW9kZWwudHlwZT1gY29udHJvbC4ke3R5cGV9YFxyXG5cdFx0XHR9ZWxzZXsvL2NvbnRhaW5lclxyXG5cdFx0XHRcdGlmKGNvbnRlbnQuZmluZChcIndcXFxcOnAsd1xcXFw6dGJsLHdcXFxcOnRyLHdcXFxcOnRjXCIpLmxlbmd0aCl7XHJcblx0XHRcdFx0XHRtb2RlbC50eXBlPVwiYmxvY2tcIlxyXG5cdFx0XHRcdH1lbHNle1xyXG5cdFx0XHRcdFx0bW9kZWwudHlwZT1cImlubGluZVwiXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHRcdFxyXG5cdFx0XHQkPW9mZmljZURvY3VtZW50LmNvbnRlbnRcclxuXHRcdFx0c3dpdGNoKG1vZGVsLnR5cGUpe1xyXG5cdFx0XHRcdGNhc2UgXCJjb250cm9sLmRyb3BEb3duTGlzdFwiOlx0XHJcblx0XHRcdFx0Y2FzZSBcImNvbnRyb2wuY29tYm9Cb3hcIjp7XHJcblx0XHRcdFx0XHRsZXQgc2VsZWN0ZWQ9JChjb250ZW50KS50ZXh0KClcclxuXHRcdFx0XHRcdG1vZGVsLm9wdGlvbnM9JChlbFR5cGUpXHJcblx0XHRcdFx0XHRcdC5maW5kKFwid1xcXFw6bGlzdEl0ZW1cIilcclxuXHRcdFx0XHRcdFx0Lm1hcCgoaSxsaSk9PntcclxuXHRcdFx0XHRcdFx0XHRyZXR1cm4ge1xyXG5cdFx0XHRcdFx0XHRcdFx0ZGlzcGxheVRleHQ6IGxpLmF0dHJpYnNbXCJ3OmRpc3BsYXlUZXh0XCJdLFxyXG5cdFx0XHRcdFx0XHRcdFx0dmFsdWU6IGxpLmF0dHJpYnNbXCJ3OnZhbHVlXCJdXHJcblx0XHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHR9KVxyXG5cdFx0XHRcdFx0XHQuZ2V0KClcclxuXHRcdFx0XHRcdG1vZGVsLnZhbHVlPShtb2RlbC5vcHRpb25zLmZpbmQoYT0+YS5kaXNwbGF5VGV4dD09c2VsZWN0ZWQpfHx7fSkudmFsdWVcclxuXHRcdFx0XHRcdGJyZWFrXHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGNhc2UgXCJjb250cm9sLmNoZWNrYm94XCI6e1xyXG5cdFx0XHRcdFx0bGV0IG5zPWVsVHlwZS5uYW1lLnNwbGl0KFwiOlwiKVswXVxyXG5cdFx0XHRcdFx0bW9kZWwuY2hlY2tlZD0kKGVsVHlwZSkuZmluZChgJHtuc31cXFxcOmNoZWNrZWRgKS5hdHRyKGAke25zfTp2YWxgKT09XCIxXCJcclxuXHRcdFx0XHRcdGJyZWFrXHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGNhc2UgXCJjb250cm9sLnRleHRcIjpcclxuXHRcdFx0XHRcdGlmKGNvbnRlbnQuZmluZCgnd1xcXFw6ciBbd1xcXFw6dmFsfj1QbGFjZWhvbGRlcl0nKS5sZW5ndGg9PTApXHJcblx0XHRcdFx0XHRcdG1vZGVsLnZhbHVlPWNvbnRlbnQudGV4dCgpXHJcblx0XHRcdFx0XHRicmVha1xyXG5cdFx0XHRcdGNhc2UgXCJjb250cm9sLmRhdGVcIjpcclxuXHRcdFx0XHRcdG1vZGVsLnZhbHVlPW5ldyBEYXRlKCQoZWxUeXBlKS5hdHRyKFwidzpmdWxsRGF0ZVwiKSlcclxuXHRcdFx0XHRcdG1vZGVsLmZvcm1hdD0kKGVsVHlwZSkuZmluZChcIndcXFxcOmRhdGVGb3JtYXRcIikuYXR0cihcInc6dmFsXCIpXHJcblx0XHRcdFx0XHRtb2RlbC5sb2NhbGU9JChlbFR5cGUpLmZpbmQoXCJ3XFxcXDpsaWRcIikuYXR0cihcInc6dmFsXCIpXHJcblx0XHRcdFx0XHRicmVha1xyXG5cdFx0XHR9XHJcblx0XHRcdHJldHVybiBtb2RlbFxyXG5cdFx0fVxyXG5cdH0sXHJcblx0aHlwZXJsaW5rKHdYbWwsb2ZmaWNlRG9jdW1lbnQpe1xyXG5cdFx0bGV0IHVybD1vZmZpY2VEb2N1bWVudC5nZXRSZWwod1htbC5hdHRyaWJzW1wicjppZFwiXSlcclxuXHRcdHJldHVybiB7dHlwZTpcImh5cGVybGlua1wiLCB1cmx9XHJcblx0fSxcclxuXHR0Ymwod1htbCl7XHJcblx0XHRyZXR1cm4gd1htbC5jaGlsZHJlbi5yZWR1Y2UoKHN0YXRlLG5vZGUpPT57XHJcblx0XHRcdHN3aXRjaChub2RlLm5hbWUpe1xyXG5cdFx0XHRjYXNlIFwidzp0YmxQclwiOlxyXG5cdFx0XHRcdHN0YXRlLnByPW5vZGVcclxuXHRcdFx0YnJlYWtcclxuXHRcdFx0Y2FzZSBcInc6dGJsR3JpZFwiOlxyXG5cdFx0XHRcdHN0YXRlLmNvbHM9bm9kZS5jaGlsZHJlblxyXG5cdFx0XHRicmVha1xyXG5cdFx0XHRkZWZhdWx0OlxyXG5cdFx0XHRcdHN0YXRlLmNoaWxkcmVuLnB1c2gobm9kZSlcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4gc3RhdGVcclxuXHRcdH0se3R5cGU6XCJ0YmxcIixjaGlsZHJlbjpbXSxwcjpudWxsLGNvbHM6W119KVxyXG5cdH0sXHJcblx0dHIod1htbCl7XHJcblx0XHRyZXR1cm4gd1htbC5jaGlsZHJlbi5yZWR1Y2UoKHN0YXRlLG5vZGUpPT57XHJcblx0XHRcdHN3aXRjaChub2RlLm5hbWUpe1xyXG5cdFx0XHRjYXNlIFwidzp0clByXCI6XHJcblx0XHRcdFx0c3RhdGUucHI9bm9kZVxyXG5cdFx0XHRcdHN0YXRlLmlzSGVhZGVyPSEhbm9kZS5jaGlsZHJlbi5maW5kKGE9PmEubmFtZT09XCJ3OnRibEhlYWRlclwiKVxyXG5cdFx0XHRicmVha1xyXG5cdFx0XHRkZWZhdWx0OlxyXG5cdFx0XHRcdHN0YXRlLmNoaWxkcmVuLnB1c2gobm9kZSlcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4gc3RhdGVcclxuXHRcdH0se3R5cGU6XCJ0clwiLGNoaWxkcmVuOltdLHByOm51bGx9KVxyXG5cdH0sXHJcblx0dGMod1htbCl7XHJcblx0XHRyZXR1cm4gd1htbC5jaGlsZHJlbi5yZWR1Y2UoKHN0YXRlLG5vZGUpPT57XHJcblx0XHRcdHN3aXRjaChub2RlLm5hbWUpe1xyXG5cdFx0XHRjYXNlIFwidzp0Y1ByXCI6XHJcblx0XHRcdFx0c3RhdGUucHI9bm9kZVxyXG5cdFx0XHRicmVha1xyXG5cdFx0XHRkZWZhdWx0OlxyXG5cdFx0XHRcdHN0YXRlLmNoaWxkcmVuLnB1c2gobm9kZSlcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4gc3RhdGVcclxuXHRcdH0se3R5cGU6XCJ0Y1wiLGNoaWxkcmVuOltdLHByOm51bGx9KVxyXG5cdH0sXHJcblx0YWx0Q2h1bmsod1htbCwgb2ZmaWNlRG9jdW1lbnQpe1xyXG5cdFx0bGV0IHJJZD13WG1sLmF0dHJpYnNbJ3I6aWQnXVxyXG5cdFx0bGV0IGRhdGE9b2ZmaWNlRG9jdW1lbnQuZ2V0UmVsKHJJZClcclxuXHJcblx0XHRsZXQgcGFydE5hbWU9b2ZmaWNlRG9jdW1lbnQuZm9sZGVyK29mZmljZURvY3VtZW50LnJlbHMoYFtJZD0ke3JJZH1dYCkuYXR0cihcIlRhcmdldFwiKVxyXG5cdFx0bGV0IGNvbnRlbnRUeXBlPW9mZmljZURvY3VtZW50LmRvYy5jb250ZW50VHlwZXMoYE92ZXJyaWRlW1BhcnROYW1lPScke3BhcnROYW1lfSddYCkuYXR0cihcIkNvbnRlbnRUeXBlXCIpXHJcblx0XHRyZXR1cm4ge3R5cGU6XCJjaHVua1wiLCBkYXRhLCBjb250ZW50VHlwZX1cclxuXHR9LFxyXG5cdGRvY0RlZmF1bHRzKHdYbWwpe1xyXG5cdFx0cmV0dXJuIHt0eXBlOlwic3R5bGVcIn1cclxuXHR9LFxyXG5cdHN0eWxlKHdYbWwpe1xyXG5cdFx0cmV0dXJuIHt0eXBlOlwic3R5bGVcIiwgaWQ6d1htbC5hdHRyaWJzWyd3OnN0eWxlSWQnXX1cclxuXHR9LFxyXG5cdGFic3RyYWN0TnVtKHdYbWwpe1xyXG5cdFx0cmV0dXJuIHt0eXBlOlwiYWJzdHJhY3ROdW1cIixpZDp3WG1sLmF0dHJpYnNbXCJ3OmFic3RyYWN0TnVtSWRcIl19XHJcblx0fSxcclxuXHRudW0od1htbCl7XHJcblx0XHRyZXR1cm4ge3R5cGU6XCJudW1cIixpZDp3WG1sLmF0dHJpYnNbXCJ3Om51bUlkXCJdLGFic3RyYWN0TnVtOndYbWwuY2hpbGRyZW4uZmluZChhPT5hLm5hbWU9PVwidzphYnN0cmFjdE51bUlkXCIpLmF0dHJpYnNbXCJ3OnZhbFwiXX1cclxuXHR9LFxyXG5cdGxhdGVudFN0eWxlcygpe1xyXG5cdFx0cmV0dXJuIG51bGxcclxuXHR9LFxyXG5cdG9iamVjdCh3WG1sLG9mZmljZURvY3VtZW50KXtcclxuXHRcdGxldCBvbGU9b2ZmaWNlRG9jdW1lbnQuY29udGVudCh3WG1sKS5maW5kKFwib1xcXFw6T0xFT2JqZWN0XCIpXHJcblx0XHRsZXQgdHlwZT1vbGUuYXR0cihcIlByb2dJRFwiKVxyXG5cdFx0bGV0IGVtYmVkPW9sZS5hdHRyKFwiVHlwZVwiKT09PVwiRW1iZWRcIlxyXG5cdFx0bGV0IHJJZD1vbGUuYXR0cihcInI6aWRcIilcclxuXHRcdHJldHVybiB7dHlwZTpcIm9iamVjdFwiLGVtYmVkLCBwcm9nOiB0eXBlLCBkYXRhOm9mZmljZURvY3VtZW50LmdldFJlbE9sZU9iamVjdChySWQpfVxyXG5cdH1cclxufVxyXG4iXX0=