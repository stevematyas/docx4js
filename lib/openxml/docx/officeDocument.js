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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9vcGVueG1sL2RvY3gvb2ZmaWNlRG9jdW1lbnQuanMiXSwibmFtZXMiOlsiT2ZmaWNlRG9jdW1lbnQiLCJzdXBwb3J0ZWQiLCJzcGxpdCIsInJlbHMiLCJlYWNoIiwiaSIsInJlbCIsIiQiLCJ0eXBlIiwiYXR0ciIsInBvcCIsImluZGV4T2YiLCJ0YXJnZXQiLCJPYmplY3QiLCJkZWZpbmVQcm9wZXJ0eSIsImdldCIsImdldFJlbE9iamVjdCIsImNyZWF0ZUVsZW1lbnQiLCJpZGVudGlmeSIsInN0eWxlcyIsInJlbmRlck5vZGUiLCJudW1iZXJpbmciLCJjb250ZW50IiwiZG9tSGFuZGxlciIsImRvYyIsImJpbmQiLCJfaWRlbnRpZnkiLCJtb2RlbCIsImFyZ3VtZW50cyIsImVtaXQiLCJkb2N1bWVudCIsIndYbWwiLCJvZmZpY2VEb2N1bWVudCIsInRhZyIsIm5hbWUiLCJpZGVudGl0aWVzIiwiY3VycmVudCIsImNoaWxkcmVuIiwic2VjdCIsImVuZCIsImNsb3Nlc3QiLCJwcmV2VW50aWwiLCJ0b0FycmF5IiwicmV2ZXJzZSIsImlzIiwicHVzaCIsInNlY3RQciIsImhmIiwiZmlsdGVyIiwiYSIsInJlZHVjZSIsImhlYWRlcnMiLCJzZXQiLCJhdHRyaWJzIiwiZ2V0UmVsIiwiTWFwIiwiZm9vdGVycyIsImhhc1RpdGxlUGFnZSIsImZpbmQiLCJwIiwiaWRlbnRpdHkiLCJwciIsInBQciIsImxlbmd0aCIsInN0eWxlSWQiLCJudW1QciIsIm51bUlkIiwibGV2ZWwiLCJvdXRsaW5lTHZsIiwicGFyc2VJbnQiLCJyIiwiZmxkQ2hhciIsImlubGluZSIsImFuY2hvciIsImdyYXBoaWNEYXRhIiwicGljIiwiYmxpcCIsInJpZCIsIndzcCIsIkZhbGxiYWNrIiwic2R0IiwiZWxCaW5kaW5nIiwicGF0aCIsImQiLCJ2YWx1ZSIsInRleHQiLCJwckNoaWxkcmVuIiwiZWxUeXBlIiwic2VsZWN0ZWQiLCJvcHRpb25zIiwibWFwIiwibGkiLCJkaXNwbGF5VGV4dCIsIm5zIiwiY2hlY2tlZCIsIkRhdGUiLCJmb3JtYXQiLCJsb2NhbGUiLCJoeXBlcmxpbmsiLCJ1cmwiLCJ0YmwiLCJzdGF0ZSIsIm5vZGUiLCJjb2xzIiwidHIiLCJpc0hlYWRlciIsInRjIiwiYWx0Q2h1bmsiLCJySWQiLCJkYXRhIiwicGFydE5hbWUiLCJmb2xkZXIiLCJjb250ZW50VHlwZSIsImNvbnRlbnRUeXBlcyIsImRvY0RlZmF1bHRzIiwic3R5bGUiLCJpZCIsImFic3RyYWN0TnVtIiwibnVtIiwibGF0ZW50U3R5bGVzIiwib2JqZWN0Iiwib2xlIiwiZW1iZWQiLCJwcm9nIiwiZ2V0UmVsT2xlT2JqZWN0Il0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFBQTs7Ozs7Ozs7Ozs7O0lBRWFBLGMsV0FBQUEsYzs7Ozs7Ozs7Ozs7MEJBQ0w7QUFBQTs7QUFDTjtBQUNBLE9BQU1DLFlBQVUsa0NBQWtDQyxLQUFsQyxDQUF3QyxHQUF4QyxDQUFoQjtBQUNBLFFBQUtDLElBQUwsbUNBQTBDQyxJQUExQyxDQUErQyxVQUFDQyxDQUFELEVBQUdDLEdBQUgsRUFBUztBQUN2RCxRQUFJQyxJQUFFLE9BQUtKLElBQUwsQ0FBVUcsR0FBVixDQUFOO0FBQ0EsUUFBSUUsT0FBS0QsRUFBRUUsSUFBRixDQUFPLE1BQVAsRUFBZVAsS0FBZixDQUFxQixHQUFyQixFQUEwQlEsR0FBMUIsRUFBVDtBQUNBLFFBQUdULFVBQVVVLE9BQVYsQ0FBa0JILElBQWxCLEtBQXlCLENBQUMsQ0FBN0IsRUFBK0I7QUFDOUIsU0FBSUksU0FBT0wsRUFBRUUsSUFBRixDQUFPLFFBQVAsQ0FBWDtBQUNBSSxZQUFPQyxjQUFQLFNBQTJCTixJQUEzQixFQUFnQztBQUMvQk8sU0FEK0IsaUJBQzFCO0FBQ0osY0FBTyxLQUFLQyxZQUFMLENBQWtCSixNQUFsQixDQUFQO0FBQ0E7QUFIOEIsTUFBaEM7QUFLQTtBQUNELElBWEQ7QUFZQTs7O3lCQUVNSyxhLEVBQWdEO0FBQUEsT0FBakNDLFFBQWlDLHVFQUF4QmxCLGVBQWVrQixRQUFTOztBQUN0RCxPQUFHLEtBQUtDLE1BQVIsRUFDQyxLQUFLQyxVQUFMLENBQWdCLEtBQUtELE1BQUwsQ0FBWSxZQUFaLEVBQTBCSixHQUExQixDQUE4QixDQUE5QixDQUFoQixFQUFpREUsYUFBakQsRUFBK0RDLFFBQS9EO0FBQ0QsT0FBRyxLQUFLRyxTQUFSLEVBQ0MsS0FBS0QsVUFBTCxDQUFnQixLQUFLQyxTQUFMLENBQWUsZUFBZixFQUFnQ04sR0FBaEMsQ0FBb0MsQ0FBcEMsQ0FBaEIsRUFBdURFLGFBQXZELEVBQXFFQyxRQUFyRTtBQUNELFVBQU8sS0FBS0UsVUFBTCxDQUFnQixLQUFLRSxPQUFMLENBQWEsY0FBYixFQUE2QlAsR0FBN0IsQ0FBaUMsQ0FBakMsQ0FBaEIsRUFBb0RFLGFBQXBELEVBQW1FQyxRQUFuRSxDQUFQO0FBQ0E7Ozt3QkFFS0ssVSxFQUE0QztBQUFBLE9BQWpDTCxRQUFpQyx1RUFBeEJsQixlQUFla0IsUUFBUzs7QUFDakQsT0FBTU0sTUFBSSxFQUFWO0FBQ0EsT0FBTVAsZ0JBQWNNLFdBQVdOLGFBQVgsQ0FBeUJRLElBQXpCLENBQThCRixVQUE5QixDQUFwQjtBQUNBLFlBQVNHLFNBQVQsR0FBb0I7QUFDbkIsUUFBSUMsUUFBTVQsMEJBQVlVLFNBQVosQ0FBVjtBQUNBLFFBQUdELFNBQVMsUUFBT0EsS0FBUCx5Q0FBT0EsS0FBUCxNQUFlLFFBQTNCLEVBQW9DO0FBQ25DSixnQkFBV00sSUFBWCxvQkFBZ0IsR0FBaEIsRUFBb0JGLEtBQXBCLG9DQUE2QkMsU0FBN0I7QUFDQUwsZ0JBQVdNLElBQVgsb0JBQWdCRixNQUFNbkIsSUFBdEIsRUFBNEJtQixLQUE1QixvQ0FBcUNDLFNBQXJDO0FBQ0EsU0FBR0wsa0JBQWdCSSxNQUFNbkIsSUFBdEIsQ0FBSCxFQUNDZSxrQkFBZ0JJLE1BQU1uQixJQUF0QixxQkFBOEJtQixLQUE5QixvQ0FBdUNDLFNBQXZDO0FBQ0Q7QUFDRCxXQUFPRCxLQUFQO0FBQ0E7O0FBRUQsT0FBRyxLQUFLUixNQUFSLEVBQ0NLLElBQUlMLE1BQUosR0FBVyxLQUFLQyxVQUFMLENBQWdCLEtBQUtELE1BQUwsQ0FBWSxZQUFaLEVBQTBCSixHQUExQixDQUE4QixDQUE5QixDQUFoQixFQUFpREUsYUFBakQsRUFBK0RTLFNBQS9ELENBQVg7QUFDRCxPQUFHLEtBQUtMLFNBQVIsRUFDQ0csSUFBSUgsU0FBSixHQUFjLEtBQUtELFVBQUwsQ0FBZ0IsS0FBS0MsU0FBTCxDQUFlLGVBQWYsRUFBZ0NOLEdBQWhDLENBQW9DLENBQXBDLENBQWhCLEVBQXVERSxhQUF2RCxFQUFxRVMsU0FBckUsQ0FBZDtBQUNERixPQUFJTSxRQUFKLEdBQWEsS0FBS1YsVUFBTCxDQUFnQixLQUFLRSxPQUFMLENBQWEsY0FBYixFQUE2QlAsR0FBN0IsQ0FBaUMsQ0FBakMsQ0FBaEIsRUFBb0RFLGFBQXBELEVBQWtFUyxTQUFsRSxDQUFiO0FBQ0EsVUFBT0YsR0FBUDtBQUNBOzs7MkJBRWVPLEksRUFBTUMsYyxFQUFlO0FBQ3BDLE9BQU1DLE1BQUlGLEtBQUtHLElBQUwsQ0FBVWhDLEtBQVYsQ0FBZ0IsR0FBaEIsRUFBcUJRLEdBQXJCLEVBQVY7QUFDQSxPQUFHeUIsV0FBV0YsR0FBWCxDQUFILEVBQ0MsT0FBT0UsV0FBV0YsR0FBWCxvQkFBbUJMLFNBQW5CLENBQVA7O0FBRUQsVUFBT0ssR0FBUDtBQUNBOzs7Ozs7a0JBR2FqQyxjO0FBRVIsSUFBTW1DLGtDQUFXO0FBQ3ZCTCxTQUR1QixvQkFDZEMsSUFEYyxFQUNUQyxjQURTLEVBQ007QUFDNUIsTUFBSXpCLElBQUV5QixlQUFlVixPQUFyQjtBQUNBLE1BQUljLFVBQVEsSUFBWjtBQUNBLE1BQUlDLFdBQVM5QixFQUFFLFlBQUYsRUFBZ0JILElBQWhCLENBQXFCLFVBQUNDLENBQUQsRUFBR2lDLElBQUgsRUFBVTtBQUMzQyxPQUFJQyxNQUFJaEMsRUFBRStCLElBQUYsRUFBUUUsT0FBUixDQUFnQixZQUFoQixDQUFSO0FBQ0FGLFFBQUtoQixPQUFMLEdBQWFpQixJQUFJRSxTQUFKLENBQWNMLE9BQWQsRUFBdUJNLE9BQXZCLEdBQWlDQyxPQUFqQyxFQUFiO0FBQ0EsT0FBRyxDQUFDSixJQUFJSyxFQUFKLENBQU9OLElBQVAsQ0FBSixFQUNDQSxLQUFLaEIsT0FBTCxDQUFhdUIsSUFBYixDQUFrQk4sSUFBSXhCLEdBQUosQ0FBUSxDQUFSLENBQWxCO0FBQ0RxQixhQUFRRyxHQUFSO0FBQ0EsR0FOWSxFQU1WRyxPQU5VLEVBQWI7QUFPQSxTQUFPLEVBQUNsQyxNQUFLLFVBQU4sRUFBa0I2QixrQkFBbEIsRUFBUDtBQUNBLEVBWnNCO0FBYXZCUyxPQWJ1QixrQkFhaEJmLElBYmdCLEVBYVhDLGNBYlcsRUFhSTtBQUMxQixNQUFNZSxLQUFHLFNBQUhBLEVBQUc7QUFBQSxVQUFNaEIsS0FBS00sUUFBTCxDQUFjVyxNQUFkLENBQXFCO0FBQUEsV0FBR0MsRUFBRWYsSUFBRixXQUFhMUIsSUFBYixjQUFIO0FBQUEsSUFBckIsRUFBc0QwQyxNQUF0RCxDQUE2RCxVQUFDQyxPQUFELEVBQVNGLENBQVQsRUFBYTtBQUN2RkUsWUFBUUMsR0FBUixDQUFZSCxFQUFFSSxPQUFGLENBQVUsUUFBVixDQUFaLEVBQWdDckIsZUFBZXNCLE1BQWYsQ0FBc0JMLEVBQUVJLE9BQUYsQ0FBVSxNQUFWLENBQXRCLENBQWhDO0FBQ0EsV0FBT0YsT0FBUDtBQUNBLElBSGEsRUFHWixJQUFJSSxHQUFKLEVBSFksQ0FBTjtBQUFBLEdBQVQ7O0FBS0EsU0FBTztBQUNOL0MsU0FBSyxTQURDO0FBRU42QixhQUFTTixLQUFLVCxPQUZSO0FBR042QixZQUFRSixHQUFHLFFBQUgsQ0FIRjtBQUlOUyxZQUFRVCxHQUFHLFFBQUgsQ0FKRjtBQUtOVSxpQkFBYyxDQUFDLENBQUMxQixLQUFLTSxRQUFMLENBQWNxQixJQUFkLENBQW1CO0FBQUEsV0FBR1QsRUFBRWYsSUFBRixJQUFRLFdBQVg7QUFBQSxJQUFuQjtBQUxWLEdBQVA7QUFPQSxFQTFCc0I7QUEyQnZCeUIsRUEzQnVCLGFBMkJyQjVCLElBM0JxQixFQTJCaEJDLGNBM0JnQixFQTJCRDtBQUNyQixNQUFJekIsSUFBRXlCLGVBQWVWLE9BQWYsQ0FBdUJTLElBQXZCLENBQU47QUFDQSxNQUFJdkIsT0FBSyxHQUFUOztBQUVBLE1BQUlvRCxXQUFTLEVBQUNwRCxVQUFELEVBQU1xRCxJQUFHOUIsS0FBS00sUUFBTCxDQUFjcUIsSUFBZCxDQUFtQjtBQUFBLFFBQUV4QixJQUFGLFFBQUVBLElBQUY7QUFBQSxXQUFVQSxRQUFNLE9BQWhCO0FBQUEsSUFBbkIsQ0FBVCxFQUFxREcsVUFBU04sS0FBS00sUUFBTCxDQUFjVyxNQUFkLENBQXFCO0FBQUEsUUFBRWQsSUFBRixTQUFFQSxJQUFGO0FBQUEsV0FBVUEsUUFBTSxPQUFoQjtBQUFBLElBQXJCLENBQTlELEVBQWI7O0FBRUEsTUFBSTRCLE1BQUl2RCxFQUFFbUQsSUFBRixDQUFPLFNBQVAsQ0FBUjtBQUNBLE1BQUdJLElBQUlDLE1BQVAsRUFBYztBQUNiLE9BQUlDLFVBQVFGLElBQUlKLElBQUosQ0FBUyxZQUFULEVBQXVCakQsSUFBdkIsQ0FBNEIsT0FBNUIsQ0FBWjs7QUFFQSxPQUFJd0QsUUFBTUgsSUFBSUosSUFBSixDQUFTLHFCQUFULENBQVY7QUFDQSxPQUFHLENBQUNPLE1BQU1GLE1BQVAsSUFBaUJDLE9BQXBCLEVBQTRCO0FBQzNCQyxZQUFNakMsZUFBZWIsTUFBZiw4QkFBZ0Q2QyxPQUFoRCw2QkFBTjtBQUNBOztBQUVELE9BQUdDLE1BQU1GLE1BQVQsRUFBZ0I7QUFDZkgsYUFBU3BELElBQVQsR0FBYyxNQUFkO0FBQ0FvRCxhQUFTTSxLQUFULEdBQWVELE1BQU1QLElBQU4sQ0FBVyxXQUFYLEVBQXdCakQsSUFBeEIsQ0FBNkIsT0FBN0IsQ0FBZjtBQUNBbUQsYUFBU08sS0FBVCxHQUFlRixNQUFNUCxJQUFOLENBQVcsVUFBWCxFQUF1QmpELElBQXZCLENBQTRCLE9BQTVCLENBQWY7QUFDQSxJQUpELE1BSUs7QUFDSixRQUFJMkQsYUFBV04sSUFBSUosSUFBSixDQUFTLGdCQUFULEVBQTJCakQsSUFBM0IsQ0FBZ0MsT0FBaEMsQ0FBZjtBQUNBLFFBQUcsQ0FBQzJELFVBQUQsSUFBZUosT0FBbEIsRUFDQ0ksYUFBV3BDLGVBQWViLE1BQWYsOEJBQWdENkMsT0FBaEQseUJBQTRFdkQsSUFBNUUsQ0FBaUYsT0FBakYsQ0FBWDs7QUFFRCxRQUFHMkQsVUFBSCxFQUFjO0FBQ2JSLGNBQVNwRCxJQUFULEdBQWMsU0FBZDtBQUNBb0QsY0FBU08sS0FBVCxHQUFlRSxTQUFTRCxVQUFULElBQXFCLENBQXBDO0FBQ2VSLGNBQVNJLE9BQVQsR0FBaUJBLE9BQWpCO0FBQ2Y7QUFDRDtBQUNEOztBQUVELFNBQU9KLFFBQVA7QUFDQSxFQTVEc0I7QUE2RHZCVSxFQTdEdUIsYUE2RHJCdkMsSUE3RHFCLEVBNkRoQjtBQUNOLFNBQU8sRUFBQ3ZCLE1BQUssR0FBTixFQUFXcUQsSUFBSTlCLEtBQUtNLFFBQUwsQ0FBY3FCLElBQWQsQ0FBbUI7QUFBQSxRQUFFeEIsSUFBRixTQUFFQSxJQUFGO0FBQUEsV0FBVUEsUUFBTSxPQUFoQjtBQUFBLElBQW5CLENBQWYsRUFBNERHLFVBQVVOLEtBQUtNLFFBQUwsQ0FBY1csTUFBZCxDQUFxQjtBQUFBLFFBQUVkLElBQUYsU0FBRUEsSUFBRjtBQUFBLFdBQVVBLFFBQU0sT0FBaEI7QUFBQSxJQUFyQixDQUF0RSxFQUFQO0FBQ0EsRUEvRHNCO0FBZ0V2QnFDLFFBaEV1QixtQkFnRWZ4QyxJQWhFZSxFQWdFVjtBQUNaLFNBQU9BLEtBQUtzQixPQUFMLENBQWEsZUFBYixDQUFQO0FBQ0EsRUFsRXNCO0FBb0V2Qm1CLE9BcEV1QixrQkFvRWhCekMsSUFwRWdCLEVBb0VYQyxjQXBFVyxFQW9FSTtBQUMxQixNQUFJekIsSUFBRXlCLGVBQWVWLE9BQWYsQ0FBdUJTLElBQXZCLENBQU47QUFDQSxTQUFPLEVBQUN2QixzQkFBRCxFQUF3QjZCLFVBQVM5QixFQUFFbUQsSUFBRixDQUFPLDZCQUFQLEVBQXNDckIsUUFBdEMsR0FBaURLLE9BQWpELEVBQWpDLEVBQVA7QUFDQSxFQXZFc0I7QUF3RXZCK0IsT0F4RXVCLGtCQXdFaEIxQyxJQXhFZ0IsRUF3RVZDLGNBeEVVLEVBd0VLO0FBQzNCLE1BQUl6QixJQUFFeUIsZUFBZVYsT0FBZixDQUF1QlMsSUFBdkIsQ0FBTjtBQUNBLE1BQUkyQyxjQUFZbkUsRUFBRW1ELElBQUYsQ0FBTyw2QkFBUCxDQUFoQjtBQUNBLE1BQUlsRCxPQUFLa0UsWUFBWWpFLElBQVosQ0FBaUIsS0FBakIsRUFBd0JQLEtBQXhCLENBQThCLEdBQTlCLEVBQW1DUSxHQUFuQyxFQUFUO0FBQ0EsTUFBSTJCLFdBQVNxQyxZQUFZckMsUUFBWixHQUF1QkssT0FBdkIsRUFBYjtBQUNBLE1BQUdsQyxRQUFNLHFCQUFULEVBQ0M2QixXQUFTQSxTQUFTLENBQVQsRUFBWUEsUUFBWixDQUFxQlcsTUFBckIsQ0FBNEI7QUFBQSxVQUFHQyxFQUFFZixJQUFGLENBQU9oQyxLQUFQLENBQWEsR0FBYixFQUFrQixDQUFsQixLQUFzQixLQUF6QjtBQUFBLEdBQTVCLENBQVQ7O0FBRUQsU0FBTyxFQUFDTSxNQUFLLGdCQUFOLEVBQXVCNkIsa0JBQXZCLEVBQVA7QUFDQSxFQWpGc0I7QUFrRnZCc0MsSUFsRnVCLGVBa0ZuQjVDLElBbEZtQixFQWtGYkMsY0FsRmEsRUFrRkU7QUFDeEIsTUFBSTRDLE9BQUs1QyxlQUFlVixPQUFmLENBQXVCUyxJQUF2QixFQUE2QjJCLElBQTdCLENBQWtDLFVBQWxDLENBQVQ7QUFDQSxNQUFJbUIsTUFBSUQsS0FBS25FLElBQUwsQ0FBVSxTQUFWLEtBQXNCbUUsS0FBS25FLElBQUwsQ0FBVSxRQUFWLENBQTlCO0FBQ0Esb0JBQVFELE1BQUssU0FBYixJQUEwQndCLGVBQWVzQixNQUFmLENBQXNCdUIsR0FBdEIsQ0FBMUI7QUFDQSxFQXRGc0I7QUF1RnZCQyxJQXZGdUIsZUF1Rm5CL0MsSUF2Rm1CLEVBdUZiQyxjQXZGYSxFQXVGRTtBQUN4QixTQUFPLEVBQUN4QixNQUFLLE9BQU4sRUFBZTZCLFVBQVNMLGVBQWVWLE9BQWYsQ0FBdUJTLElBQXZCLEVBQTZCMkIsSUFBN0IsQ0FBa0MsNkJBQWxDLEVBQWlFckIsUUFBakUsR0FBNEVLLE9BQTVFLEVBQXhCLEVBQVA7QUFDQSxFQXpGc0I7QUEwRnZCcUMsU0ExRnVCLHNCQTBGYjtBQUNULFNBQU8sSUFBUDtBQUNBLEVBNUZzQjtBQTZGdkJDLElBN0Z1QixlQTZGbkJqRCxJQTdGbUIsRUE2RmRDLGNBN0ZjLEVBNkZDO0FBQ3ZCLE1BQUl6QixJQUFFeUIsZUFBZVYsT0FBZixDQUF1QlMsSUFBdkIsQ0FBTjtBQUNBLE1BQUk4QixLQUFHdEQsRUFBRW1ELElBQUYsQ0FBTyxZQUFQLENBQVA7QUFDQSxNQUFJcEMsVUFBUWYsRUFBRW1ELElBQUYsQ0FBTyxpQkFBUCxDQUFaO0FBQ0EsTUFBSXJCLFdBQVNmLFFBQVFlLFFBQVIsR0FBbUJLLE9BQW5CLEVBQWI7O0FBRUEsTUFBSXVDLFlBQVVwQixHQUFHSCxJQUFILENBQVEsaUJBQVIsRUFBMkIzQyxHQUEzQixDQUErQixDQUEvQixDQUFkO0FBQ0EsTUFBR2tFLFNBQUgsRUFBYTtBQUFDO0FBQ2IsT0FBSUMsT0FBS0QsVUFBVTVCLE9BQVYsQ0FBa0IsU0FBbEIsQ0FBVDtBQUFBLE9BQ0M4QixJQUFFRCxLQUFLaEYsS0FBTCxDQUFXLFVBQVgsQ0FESDtBQUFBLE9BRUNnQyxRQUFNaUQsRUFBRXpFLEdBQUYsSUFBUXlFLEVBQUV6RSxHQUFGLEVBQWQsQ0FGRDtBQUdBLE9BQUkwRSxRQUFNOUQsUUFBUStELElBQVIsRUFBVjs7QUFFQSxVQUFPLEVBQUM3RSxNQUFLLFVBQU4sRUFBa0IwQixVQUFsQixFQUF3QmtELFlBQXhCLEVBQStCL0Msa0JBQS9CLEVBQVA7QUFDQSxHQVBELE1BT0s7QUFBQztBQUNMLE9BQUlpRCxhQUFXekIsR0FBRzlDLEdBQUgsQ0FBTyxDQUFQLEVBQVVzQixRQUF6QjtBQUNBLE9BQUlrRCxTQUFPRCxXQUFXQSxXQUFXdkIsTUFBWCxHQUFrQixDQUE3QixDQUFYO0FBQ0EsT0FBSTdCLFFBQUtxRCxPQUFPckQsSUFBUCxDQUFZaEMsS0FBWixDQUFrQixHQUFsQixFQUF1QlEsR0FBdkIsRUFBVDtBQUNBLE9BQUlGLE9BQUsscUdBQXFHTixLQUFyRyxDQUEyRyxHQUEzRyxFQUNQd0QsSUFETyxDQUNGO0FBQUEsV0FBR1QsS0FBR2YsS0FBTjtBQUFBLElBREUsQ0FBVDtBQUVBLE9BQUlQLFFBQU0sRUFBQ1Usa0JBQUQsRUFBVjtBQUNBLE9BQUc3QixJQUFILEVBQVE7QUFDUG1CLFVBQU1uQixJQUFOLGdCQUFzQkEsSUFBdEI7QUFDQSxJQUZELE1BRUs7QUFBQztBQUNMLFFBQUdjLFFBQVFvQyxJQUFSLENBQWEsNkJBQWIsRUFBNENLLE1BQS9DLEVBQXNEO0FBQ3JEcEMsV0FBTW5CLElBQU4sR0FBVyxPQUFYO0FBQ0EsS0FGRCxNQUVLO0FBQ0ptQixXQUFNbkIsSUFBTixHQUFXLFFBQVg7QUFDQTtBQUNEOztBQUVERCxPQUFFeUIsZUFBZVYsT0FBakI7QUFDQSxXQUFPSyxNQUFNbkIsSUFBYjtBQUNDLFNBQUssc0JBQUw7QUFDQSxTQUFLLGtCQUFMO0FBQXdCO0FBQ3ZCLFVBQUlnRixXQUFTakYsRUFBRWUsT0FBRixFQUFXK0QsSUFBWCxFQUFiO0FBQ0ExRCxZQUFNOEQsT0FBTixHQUFjbEYsRUFBRWdGLE1BQUYsRUFDWjdCLElBRFksQ0FDUCxjQURPLEVBRVpnQyxHQUZZLENBRVIsVUFBQ3JGLENBQUQsRUFBR3NGLEVBQUgsRUFBUTtBQUNaLGNBQU87QUFDTkMscUJBQWFELEdBQUd0QyxPQUFILENBQVcsZUFBWCxDQURQO0FBRU4rQixlQUFPTyxHQUFHdEMsT0FBSCxDQUFXLFNBQVg7QUFGRCxRQUFQO0FBSUEsT0FQWSxFQVFadEMsR0FSWSxFQUFkO0FBU0FZLFlBQU15RCxLQUFOLEdBQVksQ0FBQ3pELE1BQU04RCxPQUFOLENBQWMvQixJQUFkLENBQW1CO0FBQUEsY0FBR1QsRUFBRTJDLFdBQUYsSUFBZUosUUFBbEI7QUFBQSxPQUFuQixLQUFnRCxFQUFqRCxFQUFxREosS0FBakU7QUFDQTtBQUNBO0FBQ0QsU0FBSyxrQkFBTDtBQUF3QjtBQUN2QixVQUFJUyxLQUFHTixPQUFPckQsSUFBUCxDQUFZaEMsS0FBWixDQUFrQixHQUFsQixFQUF1QixDQUF2QixDQUFQO0FBQ0F5QixZQUFNbUUsT0FBTixHQUFjdkYsRUFBRWdGLE1BQUYsRUFBVTdCLElBQVYsQ0FBa0JtQyxFQUFsQixpQkFBa0NwRixJQUFsQyxDQUEwQ29GLEVBQTFDLGNBQXFELEdBQW5FO0FBQ0E7QUFDQTtBQUNELFNBQUssY0FBTDtBQUNDLFNBQUd2RSxRQUFRb0MsSUFBUixDQUFhLDhCQUFiLEVBQTZDSyxNQUE3QyxJQUFxRCxDQUF4RCxFQUNDcEMsTUFBTXlELEtBQU4sR0FBWTlELFFBQVErRCxJQUFSLEVBQVo7QUFDRDtBQUNELFNBQUssY0FBTDtBQUNDMUQsV0FBTXlELEtBQU4sR0FBWSxJQUFJVyxJQUFKLENBQVN4RixFQUFFZ0YsTUFBRixFQUFVOUUsSUFBVixDQUFlLFlBQWYsQ0FBVCxDQUFaO0FBQ0FrQixXQUFNcUUsTUFBTixHQUFhekYsRUFBRWdGLE1BQUYsRUFBVTdCLElBQVYsQ0FBZSxnQkFBZixFQUFpQ2pELElBQWpDLENBQXNDLE9BQXRDLENBQWI7QUFDQWtCLFdBQU1zRSxNQUFOLEdBQWExRixFQUFFZ0YsTUFBRixFQUFVN0IsSUFBVixDQUFlLFNBQWYsRUFBMEJqRCxJQUExQixDQUErQixPQUEvQixDQUFiO0FBQ0E7QUE3QkY7QUErQkEsVUFBT2tCLEtBQVA7QUFDQTtBQUNELEVBOUpzQjtBQStKdkJ1RSxVQS9KdUIscUJBK0pibkUsSUEvSmEsRUErSlJDLGNBL0pRLEVBK0pPO0FBQ3ZCLE1BQUlELEtBQUtzQixPQUFMLENBQWEsTUFBYixDQUFKLEVBQTBCO0FBQ3RCLE9BQUk4QyxNQUFJbkUsZUFBZXNCLE1BQWYsQ0FBc0J2QixLQUFLc0IsT0FBTCxDQUFhLE1BQWIsQ0FBdEIsQ0FBUjtBQUNBLFVBQU8sRUFBQzdDLE1BQUssV0FBTixFQUFtQjJGLFFBQW5CLEVBQVA7QUFDSCxHQUhELE1BR08sSUFBSXBFLEtBQUtzQixPQUFMLENBQWEsVUFBYixDQUFKLEVBQThCO0FBQ3BDLE9BQUluQixPQUFPSCxLQUFLc0IsT0FBTCxDQUFhLFVBQWIsQ0FBWCxDQURvQyxDQUNDO0FBQ2xDLFVBQU8sRUFBQzdDLE1BQUssUUFBTixFQUFnQjBCLFVBQWhCLEVBQVA7QUFDSDtBQUNQLEVBdktzQjtBQXdLdkJrRSxJQXhLdUIsZUF3S25CckUsSUF4S21CLEVBd0tkO0FBQ1IsU0FBT0EsS0FBS00sUUFBTCxDQUFjYSxNQUFkLENBQXFCLFVBQUNtRCxLQUFELEVBQU9DLElBQVAsRUFBYztBQUN6QyxXQUFPQSxLQUFLcEUsSUFBWjtBQUNBLFNBQUssU0FBTDtBQUNDbUUsV0FBTXhDLEVBQU4sR0FBU3lDLElBQVQ7QUFDRDtBQUNBLFNBQUssV0FBTDtBQUNDRCxXQUFNRSxJQUFOLEdBQVdELEtBQUtqRSxRQUFoQjtBQUNEO0FBQ0E7QUFDQ2dFLFdBQU1oRSxRQUFOLENBQWVRLElBQWYsQ0FBb0J5RCxJQUFwQjtBQVJEO0FBVUEsVUFBT0QsS0FBUDtBQUNBLEdBWk0sRUFZTCxFQUFDN0YsTUFBSyxLQUFOLEVBQVk2QixVQUFTLEVBQXJCLEVBQXdCd0IsSUFBRyxJQUEzQixFQUFnQzBDLE1BQUssRUFBckMsRUFaSyxDQUFQO0FBYUEsRUF0THNCO0FBdUx2QkMsR0F2THVCLGNBdUxwQnpFLElBdkxvQixFQXVMZjtBQUNQLFNBQU9BLEtBQUtNLFFBQUwsQ0FBY2EsTUFBZCxDQUFxQixVQUFDbUQsS0FBRCxFQUFPQyxJQUFQLEVBQWM7QUFDekMsV0FBT0EsS0FBS3BFLElBQVo7QUFDQSxTQUFLLFFBQUw7QUFDQ21FLFdBQU14QyxFQUFOLEdBQVN5QyxJQUFUO0FBQ0FELFdBQU1JLFFBQU4sR0FBZSxDQUFDLENBQUNILEtBQUtqRSxRQUFMLENBQWNxQixJQUFkLENBQW1CO0FBQUEsYUFBR1QsRUFBRWYsSUFBRixJQUFRLGFBQVg7QUFBQSxNQUFuQixDQUFqQjtBQUNEO0FBQ0E7QUFDQ21FLFdBQU1oRSxRQUFOLENBQWVRLElBQWYsQ0FBb0J5RCxJQUFwQjtBQU5EO0FBUUEsVUFBT0QsS0FBUDtBQUNBLEdBVk0sRUFVTCxFQUFDN0YsTUFBSyxJQUFOLEVBQVc2QixVQUFTLEVBQXBCLEVBQXVCd0IsSUFBRyxJQUExQixFQVZLLENBQVA7QUFXQSxFQW5Nc0I7QUFvTXZCNkMsR0FwTXVCLGNBb01wQjNFLElBcE1vQixFQW9NZjtBQUNQLFNBQU9BLEtBQUtNLFFBQUwsQ0FBY2EsTUFBZCxDQUFxQixVQUFDbUQsS0FBRCxFQUFPQyxJQUFQLEVBQWM7QUFDekMsV0FBT0EsS0FBS3BFLElBQVo7QUFDQSxTQUFLLFFBQUw7QUFDQ21FLFdBQU14QyxFQUFOLEdBQVN5QyxJQUFUO0FBQ0Q7QUFDQTtBQUNDRCxXQUFNaEUsUUFBTixDQUFlUSxJQUFmLENBQW9CeUQsSUFBcEI7QUFMRDtBQU9BLFVBQU9ELEtBQVA7QUFDQSxHQVRNLEVBU0wsRUFBQzdGLE1BQUssSUFBTixFQUFXNkIsVUFBUyxFQUFwQixFQUF1QndCLElBQUcsSUFBMUIsRUFUSyxDQUFQO0FBVUEsRUEvTXNCO0FBZ052QjhDLFNBaE51QixvQkFnTmQ1RSxJQWhOYyxFQWdOUkMsY0FoTlEsRUFnTk87QUFDN0IsTUFBSTRFLE1BQUk3RSxLQUFLc0IsT0FBTCxDQUFhLE1BQWIsQ0FBUjtBQUNBLE1BQUl3RCxPQUFLN0UsZUFBZXNCLE1BQWYsQ0FBc0JzRCxHQUF0QixDQUFUOztBQUVBLE1BQUlFLFdBQVM5RSxlQUFlK0UsTUFBZixHQUFzQi9FLGVBQWU3QixJQUFmLFVBQTJCeUcsR0FBM0IsUUFBbUNuRyxJQUFuQyxDQUF3QyxRQUF4QyxDQUFuQztBQUNBLE1BQUl1RyxjQUFZaEYsZUFBZVIsR0FBZixDQUFtQnlGLFlBQW5CLHlCQUFzREgsUUFBdEQsU0FBb0VyRyxJQUFwRSxDQUF5RSxhQUF6RSxDQUFoQjtBQUNBLFNBQU8sRUFBQ0QsTUFBSyxPQUFOLEVBQWVxRyxVQUFmLEVBQXFCRyx3QkFBckIsRUFBUDtBQUNBLEVBdk5zQjtBQXdOdkJFLFlBeE51Qix1QkF3TlhuRixJQXhOVyxFQXdOTjtBQUNoQixTQUFPLEVBQUN2QixNQUFLLE9BQU4sRUFBUDtBQUNBLEVBMU5zQjtBQTJOdkIyRyxNQTNOdUIsaUJBMk5qQnBGLElBM05pQixFQTJOWjtBQUNWLFNBQU8sRUFBQ3ZCLE1BQUssT0FBTixFQUFlNEcsSUFBR3JGLEtBQUtzQixPQUFMLENBQWEsV0FBYixDQUFsQixFQUFQO0FBQ0EsRUE3TnNCO0FBOE52QmdFLFlBOU51Qix1QkE4Tlh0RixJQTlOVyxFQThOTjtBQUNoQixTQUFPLEVBQUN2QixNQUFLLGFBQU4sRUFBb0I0RyxJQUFHckYsS0FBS3NCLE9BQUwsQ0FBYSxpQkFBYixDQUF2QixFQUFQO0FBQ0EsRUFoT3NCO0FBaU92QmlFLElBak91QixlQWlPbkJ2RixJQWpPbUIsRUFpT2Q7QUFDUixTQUFPLEVBQUN2QixNQUFLLEtBQU4sRUFBWTRHLElBQUdyRixLQUFLc0IsT0FBTCxDQUFhLFNBQWIsQ0FBZixFQUF1Q2dFLGFBQVl0RixLQUFLTSxRQUFMLENBQWNxQixJQUFkLENBQW1CO0FBQUEsV0FBR1QsRUFBRWYsSUFBRixJQUFRLGlCQUFYO0FBQUEsSUFBbkIsRUFBaURtQixPQUFqRCxDQUF5RCxPQUF6RCxDQUFuRCxFQUFQO0FBQ0EsRUFuT3NCO0FBb092QmtFLGFBcE91QiwwQkFvT1Q7QUFDYixTQUFPLElBQVA7QUFDQSxFQXRPc0I7QUF1T3ZCQyxPQXZPdUIsa0JBdU9oQnpGLElBdk9nQixFQXVPWEMsY0F2T1csRUF1T0k7QUFDMUIsTUFBSXlGLE1BQUl6RixlQUFlVixPQUFmLENBQXVCUyxJQUF2QixFQUE2QjJCLElBQTdCLENBQWtDLGVBQWxDLENBQVI7QUFDQSxNQUFJbEQsT0FBS2lILElBQUloSCxJQUFKLENBQVMsUUFBVCxDQUFUO0FBQ0EsTUFBSWlILFFBQU1ELElBQUloSCxJQUFKLENBQVMsTUFBVCxNQUFtQixPQUE3QjtBQUNBLE1BQUltRyxNQUFJYSxJQUFJaEgsSUFBSixDQUFTLE1BQVQsQ0FBUjtBQUNBLFNBQU8sRUFBQ0QsTUFBSyxRQUFOLEVBQWVrSCxZQUFmLEVBQXNCQyxNQUFNbkgsSUFBNUIsRUFBa0NxRyxNQUFLN0UsZUFBZTRGLGVBQWYsQ0FBK0JoQixHQUEvQixDQUF2QyxFQUFQO0FBQ0E7QUE3T3NCLENBQWpCIiwiZmlsZSI6Im9mZmljZURvY3VtZW50LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFBhcnQgZnJvbSBcIi4uL3BhcnRcIlxyXG5cclxuZXhwb3J0IGNsYXNzIE9mZmljZURvY3VtZW50IGV4dGVuZHMgUGFydHtcclxuXHRfaW5pdCgpe1xyXG5cdFx0c3VwZXIuX2luaXQoKVxyXG5cdFx0Y29uc3Qgc3VwcG9ydGVkPVwic3R5bGVzLG51bWJlcmluZyx0aGVtZSxzZXR0aW5nc1wiLnNwbGl0KFwiLFwiKVxyXG5cdFx0dGhpcy5yZWxzKGBSZWxhdGlvbnNoaXBbVGFyZ2V0JD1cIi54bWxcIl1gKS5lYWNoKChpLHJlbCk9PntcclxuXHRcdFx0bGV0ICQ9dGhpcy5yZWxzKHJlbClcclxuXHRcdFx0bGV0IHR5cGU9JC5hdHRyKFwiVHlwZVwiKS5zcGxpdChcIi9cIikucG9wKClcclxuXHRcdFx0aWYoc3VwcG9ydGVkLmluZGV4T2YodHlwZSkhPS0xKXtcclxuXHRcdFx0XHRsZXQgdGFyZ2V0PSQuYXR0cihcIlRhcmdldFwiKVxyXG5cdFx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLHR5cGUse1xyXG5cdFx0XHRcdFx0Z2V0KCl7XHJcblx0XHRcdFx0XHRcdHJldHVybiB0aGlzLmdldFJlbE9iamVjdCh0YXJnZXQpXHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fSlcclxuXHRcdFx0fVxyXG5cdFx0fSlcclxuXHR9XHJcblxyXG5cdHJlbmRlcihjcmVhdGVFbGVtZW50LCBpZGVudGlmeT1PZmZpY2VEb2N1bWVudC5pZGVudGlmeSl7XHJcblx0XHRpZih0aGlzLnN0eWxlcylcclxuXHRcdFx0dGhpcy5yZW5kZXJOb2RlKHRoaXMuc3R5bGVzKFwid1xcXFw6c3R5bGVzXCIpLmdldCgwKSxjcmVhdGVFbGVtZW50LGlkZW50aWZ5KVxyXG5cdFx0aWYodGhpcy5udW1iZXJpbmcpXHJcblx0XHRcdHRoaXMucmVuZGVyTm9kZSh0aGlzLm51bWJlcmluZyhcIndcXFxcOm51bWJlcmluZ1wiKS5nZXQoMCksY3JlYXRlRWxlbWVudCxpZGVudGlmeSlcclxuXHRcdHJldHVybiB0aGlzLnJlbmRlck5vZGUodGhpcy5jb250ZW50KFwid1xcXFw6ZG9jdW1lbnRcIikuZ2V0KDApLGNyZWF0ZUVsZW1lbnQsIGlkZW50aWZ5KVxyXG5cdH1cclxuXHJcblx0cGFyc2UoZG9tSGFuZGxlcixpZGVudGlmeT1PZmZpY2VEb2N1bWVudC5pZGVudGlmeSl7XHJcblx0XHRjb25zdCBkb2M9e31cclxuXHRcdGNvbnN0IGNyZWF0ZUVsZW1lbnQ9ZG9tSGFuZGxlci5jcmVhdGVFbGVtZW50LmJpbmQoZG9tSGFuZGxlcilcclxuXHRcdGZ1bmN0aW9uIF9pZGVudGlmeSgpe1xyXG5cdFx0XHRsZXQgbW9kZWw9aWRlbnRpZnkoLi4uYXJndW1lbnRzKVxyXG5cdFx0XHRpZihtb2RlbCAmJiB0eXBlb2YobW9kZWwpPT1cIm9iamVjdFwiKXtcclxuXHRcdFx0XHRkb21IYW5kbGVyLmVtaXQoXCIqXCIsbW9kZWwsLi4uYXJndW1lbnRzKVxyXG5cdFx0XHRcdGRvbUhhbmRsZXIuZW1pdChtb2RlbC50eXBlLCBtb2RlbCwuLi5hcmd1bWVudHMpXHJcblx0XHRcdFx0aWYoZG9tSGFuZGxlcltgb24ke21vZGVsLnR5cGV9YF0pXHJcblx0XHRcdFx0XHRkb21IYW5kbGVyW2BvbiR7bW9kZWwudHlwZX1gXShtb2RlbCwuLi5hcmd1bWVudHMpXHJcblx0XHRcdH1cclxuXHRcdFx0cmV0dXJuIG1vZGVsXHJcblx0XHR9XHJcblxyXG5cdFx0aWYodGhpcy5zdHlsZXMpXHJcblx0XHRcdGRvYy5zdHlsZXM9dGhpcy5yZW5kZXJOb2RlKHRoaXMuc3R5bGVzKFwid1xcXFw6c3R5bGVzXCIpLmdldCgwKSxjcmVhdGVFbGVtZW50LF9pZGVudGlmeSlcclxuXHRcdGlmKHRoaXMubnVtYmVyaW5nKVxyXG5cdFx0XHRkb2MubnVtYmVyaW5nPXRoaXMucmVuZGVyTm9kZSh0aGlzLm51bWJlcmluZyhcIndcXFxcOm51bWJlcmluZ1wiKS5nZXQoMCksY3JlYXRlRWxlbWVudCxfaWRlbnRpZnkpXHJcblx0XHRkb2MuZG9jdW1lbnQ9dGhpcy5yZW5kZXJOb2RlKHRoaXMuY29udGVudChcIndcXFxcOmRvY3VtZW50XCIpLmdldCgwKSxjcmVhdGVFbGVtZW50LF9pZGVudGlmeSlcclxuXHRcdHJldHVybiBkb2NcclxuXHR9XHJcblxyXG5cdHN0YXRpYyBpZGVudGlmeSh3WG1sLCBvZmZpY2VEb2N1bWVudCl7XHJcblx0XHRjb25zdCB0YWc9d1htbC5uYW1lLnNwbGl0KFwiOlwiKS5wb3AoKVxyXG5cdFx0aWYoaWRlbnRpdGllc1t0YWddKVxyXG5cdFx0XHRyZXR1cm4gaWRlbnRpdGllc1t0YWddKC4uLmFyZ3VtZW50cylcclxuXHJcblx0XHRyZXR1cm4gdGFnXHJcblx0fVxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBPZmZpY2VEb2N1bWVudFxyXG5cclxuZXhwb3J0IGNvbnN0IGlkZW50aXRpZXM9e1xyXG5cdGRvY3VtZW50KHdYbWwsb2ZmaWNlRG9jdW1lbnQpe1xyXG5cdFx0bGV0ICQ9b2ZmaWNlRG9jdW1lbnQuY29udGVudFxyXG5cdFx0bGV0IGN1cnJlbnQ9bnVsbFxyXG5cdFx0bGV0IGNoaWxkcmVuPSQoXCJ3XFxcXDpzZWN0UHJcIikuZWFjaCgoaSxzZWN0KT0+e1xyXG5cdFx0XHRsZXQgZW5kPSQoc2VjdCkuY2xvc2VzdCgnd1xcXFw6Ym9keT4qJylcclxuXHRcdFx0c2VjdC5jb250ZW50PWVuZC5wcmV2VW50aWwoY3VycmVudCkudG9BcnJheSgpLnJldmVyc2UoKVxyXG5cdFx0XHRpZighZW5kLmlzKHNlY3QpKVxyXG5cdFx0XHRcdHNlY3QuY29udGVudC5wdXNoKGVuZC5nZXQoMCkpXHJcblx0XHRcdGN1cnJlbnQ9ZW5kXHJcblx0XHR9KS50b0FycmF5KClcclxuXHRcdHJldHVybiB7dHlwZTpcImRvY3VtZW50XCIsIGNoaWxkcmVufVxyXG5cdH0sXHJcblx0c2VjdFByKHdYbWwsb2ZmaWNlRG9jdW1lbnQpe1xyXG5cdFx0Y29uc3QgaGY9dHlwZT0+d1htbC5jaGlsZHJlbi5maWx0ZXIoYT0+YS5uYW1lPT1gdzoke3R5cGV9UmVmZXJlbmNlYCkucmVkdWNlKChoZWFkZXJzLGEpPT57XHJcblx0XHRcdFx0aGVhZGVycy5zZXQoYS5hdHRyaWJzW1widzp0eXBlXCJdLG9mZmljZURvY3VtZW50LmdldFJlbChhLmF0dHJpYnNbXCJyOmlkXCJdKSlcclxuXHRcdFx0XHRyZXR1cm4gaGVhZGVyc1xyXG5cdFx0XHR9LG5ldyBNYXAoKSlcclxuXHJcblx0XHRyZXR1cm4ge1xyXG5cdFx0XHR0eXBlOlwic2VjdGlvblwiLFxyXG5cdFx0XHRjaGlsZHJlbjp3WG1sLmNvbnRlbnQsXHJcblx0XHRcdGhlYWRlcnM6aGYoXCJoZWFkZXJcIiksXHJcblx0XHRcdGZvb3RlcnM6aGYoXCJmb290ZXJcIiksXHJcblx0XHRcdGhhc1RpdGxlUGFnZTogISF3WG1sLmNoaWxkcmVuLmZpbmQoYT0+YS5uYW1lPT1cInc6dGl0bGVQZ1wiKVxyXG5cdFx0fVxyXG5cdH0sXHJcblx0cCh3WG1sLG9mZmljZURvY3VtZW50KXtcclxuXHRcdGxldCAkPW9mZmljZURvY3VtZW50LmNvbnRlbnQod1htbClcclxuXHRcdGxldCB0eXBlPVwicFwiXHJcblxyXG5cdFx0bGV0IGlkZW50aXR5PXt0eXBlLHByOndYbWwuY2hpbGRyZW4uZmluZCgoe25hbWV9KT0+bmFtZT09XCJ3OnBQclwiKSxjaGlsZHJlbjp3WG1sLmNoaWxkcmVuLmZpbHRlcigoe25hbWV9KT0+bmFtZSE9XCJ3OnBQclwiKX1cclxuXHJcblx0XHRsZXQgcFByPSQuZmluZChcIndcXFxcOnBQclwiKVxyXG5cdFx0aWYocFByLmxlbmd0aCl7XHJcblx0XHRcdGxldCBzdHlsZUlkPXBQci5maW5kKFwid1xcXFw6cFN0eWxlXCIpLmF0dHIoXCJ3OnZhbFwiKVxyXG5cclxuXHRcdFx0bGV0IG51bVByPXBQci5maW5kKFwid1xcXFw6bnVtUHI+d1xcXFw6bnVtSWRcIilcclxuXHRcdFx0aWYoIW51bVByLmxlbmd0aCAmJiBzdHlsZUlkKXtcclxuXHRcdFx0XHRudW1Qcj1vZmZpY2VEb2N1bWVudC5zdHlsZXMoYHdcXFxcOnN0eWxlW3dcXFxcOnN0eWxlSWQ9XCIke3N0eWxlSWR9XCJdIHdcXFxcOm51bVByPndcXFxcOm51bUlkYClcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0aWYobnVtUHIubGVuZ3RoKXtcclxuXHRcdFx0XHRpZGVudGl0eS50eXBlPVwibGlzdFwiXHJcblx0XHRcdFx0aWRlbnRpdHkubnVtSWQ9bnVtUHIuZmluZChcIndcXFxcOm51bUlkXCIpLmF0dHIoXCJ3OnZhbFwiKVxyXG5cdFx0XHRcdGlkZW50aXR5LmxldmVsPW51bVByLmZpbmQoXCJ3XFxcXDppbHZsXCIpLmF0dHIoXCJ3OnZhbFwiKVxyXG5cdFx0XHR9ZWxzZXtcclxuXHRcdFx0XHRsZXQgb3V0bGluZUx2bD1wUHIuZmluZChcIndcXFxcOm91dGxpbmVMdmxcIikuYXR0cihcInc6dmFsXCIpXHJcblx0XHRcdFx0aWYoIW91dGxpbmVMdmwgJiYgc3R5bGVJZClcclxuXHRcdFx0XHRcdG91dGxpbmVMdmw9b2ZmaWNlRG9jdW1lbnQuc3R5bGVzKGB3XFxcXDpzdHlsZVt3XFxcXDpzdHlsZUlkPVwiJHtzdHlsZUlkfVwiXSB3XFxcXDpvdXRsaW5lTHZsYCkuYXR0cihcInc6dmFsXCIpXHJcblxyXG5cdFx0XHRcdGlmKG91dGxpbmVMdmwpe1xyXG5cdFx0XHRcdFx0aWRlbnRpdHkudHlwZT1cImhlYWRpbmdcIlxyXG5cdFx0XHRcdFx0aWRlbnRpdHkubGV2ZWw9cGFyc2VJbnQob3V0bGluZUx2bCkrMVxyXG4gICAgICAgICAgICAgICAgICAgIGlkZW50aXR5LnN0eWxlSWQ9c3R5bGVJZFxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiBpZGVudGl0eVxyXG5cdH0sXHJcblx0cih3WG1sKXtcclxuXHRcdHJldHVybiB7dHlwZTpcInJcIiwgcHI6IHdYbWwuY2hpbGRyZW4uZmluZCgoe25hbWV9KT0+bmFtZT09XCJ3OnJQclwiKSwgY2hpbGRyZW46IHdYbWwuY2hpbGRyZW4uZmlsdGVyKCh7bmFtZX0pPT5uYW1lIT1cInc6clByXCIpfVxyXG5cdH0sXHJcblx0ZmxkQ2hhcih3WG1sKXtcclxuXHRcdHJldHVybiB3WG1sLmF0dHJpYnNbXCJ3OmZsZENoYXJUeXBlXCJdXHJcblx0fSxcclxuXHJcblx0aW5saW5lKHdYbWwsb2ZmaWNlRG9jdW1lbnQpe1xyXG5cdFx0bGV0ICQ9b2ZmaWNlRG9jdW1lbnQuY29udGVudCh3WG1sKVxyXG5cdFx0cmV0dXJuIHt0eXBlOmBkcmF3aW5nLmlubGluZWAsIGNoaWxkcmVuOiQuZmluZCgnYVxcXFw6Z3JhcGhpYz5hXFxcXDpncmFwaGljRGF0YScpLmNoaWxkcmVuKCkudG9BcnJheSgpfVxyXG5cdH0sXHJcblx0YW5jaG9yKHdYbWwsIG9mZmljZURvY3VtZW50KXtcclxuXHRcdGxldCAkPW9mZmljZURvY3VtZW50LmNvbnRlbnQod1htbClcclxuXHRcdGxldCBncmFwaGljRGF0YT0kLmZpbmQoJ2FcXFxcOmdyYXBoaWM+YVxcXFw6Z3JhcGhpY0RhdGEnKVxyXG5cdFx0bGV0IHR5cGU9Z3JhcGhpY0RhdGEuYXR0cihcInVyaVwiKS5zcGxpdChcIi9cIikucG9wKClcclxuXHRcdGxldCBjaGlsZHJlbj1ncmFwaGljRGF0YS5jaGlsZHJlbigpLnRvQXJyYXkoKVxyXG5cdFx0aWYodHlwZT09XCJ3b3JkcHJvY2Vzc2luZ0dyb3VwXCIpXHJcblx0XHRcdGNoaWxkcmVuPWNoaWxkcmVuWzBdLmNoaWxkcmVuLmZpbHRlcihhPT5hLm5hbWUuc3BsaXQoXCI6XCIpWzBdIT1cIndwZ1wiKVxyXG5cclxuXHRcdHJldHVybiB7dHlwZTpcImRyYXdpbmcuYW5jaG9yXCIsY2hpbGRyZW59XHJcblx0fSxcclxuXHRwaWMod1htbCwgb2ZmaWNlRG9jdW1lbnQpe1xyXG5cdFx0bGV0IGJsaXA9b2ZmaWNlRG9jdW1lbnQuY29udGVudCh3WG1sKS5maW5kKFwiYVxcXFw6YmxpcFwiKVxyXG5cdFx0bGV0IHJpZD1ibGlwLmF0dHIoJ3I6ZW1iZWQnKXx8YmxpcC5hdHRyKCdyOmxpbmsnKVxyXG5cdFx0cmV0dXJuIHt0eXBlOlwicGljdHVyZVwiLC4uLm9mZmljZURvY3VtZW50LmdldFJlbChyaWQpfVxyXG5cdH0sXHJcblx0d3NwKHdYbWwsIG9mZmljZURvY3VtZW50KXtcclxuXHRcdHJldHVybiB7dHlwZTpcInNoYXBlXCIsIGNoaWxkcmVuOm9mZmljZURvY3VtZW50LmNvbnRlbnQod1htbCkuZmluZChcIj53cHNcXFxcOnR4Yng+d1xcXFw6dHhieENvbnRlbnRcIikuY2hpbGRyZW4oKS50b0FycmF5KCl9XHJcblx0fSxcclxuXHRGYWxsYmFjaygpe1xyXG5cdFx0cmV0dXJuIG51bGxcclxuXHR9LFxyXG5cdHNkdCh3WG1sLG9mZmljZURvY3VtZW50KXtcclxuXHRcdGxldCAkPW9mZmljZURvY3VtZW50LmNvbnRlbnQod1htbClcclxuXHRcdGxldCBwcj0kLmZpbmQoJz53XFxcXDpzZHRQcicpXHJcblx0XHRsZXQgY29udGVudD0kLmZpbmQoJz53XFxcXDpzZHRDb250ZW50JylcclxuXHRcdGxldCBjaGlsZHJlbj1jb250ZW50LmNoaWxkcmVuKCkudG9BcnJheSgpXHJcblxyXG5cdFx0bGV0IGVsQmluZGluZz1wci5maW5kKCd3XFxcXDpkYXRhQmluZGluZycpLmdldCgwKVxyXG5cdFx0aWYoZWxCaW5kaW5nKXsvL3Byb3BlcnRpZXNcclxuXHRcdFx0bGV0IHBhdGg9ZWxCaW5kaW5nLmF0dHJpYnNbJ3c6eHBhdGgnXSxcclxuXHRcdFx0XHRkPXBhdGguc3BsaXQoL1tcXC9cXDpcXFtdLyksXHJcblx0XHRcdFx0bmFtZT0oZC5wb3AoKSxkLnBvcCgpKTtcclxuXHRcdFx0bGV0IHZhbHVlPWNvbnRlbnQudGV4dCgpXHJcblxyXG5cdFx0XHRyZXR1cm4ge3R5cGU6XCJwcm9wZXJ0eVwiLCBuYW1lLCB2YWx1ZSwgY2hpbGRyZW59XHJcblx0XHR9ZWxzZXsvL2NvbnRyb2xzXHJcblx0XHRcdGxldCBwckNoaWxkcmVuPXByLmdldCgwKS5jaGlsZHJlblxyXG5cdFx0XHRsZXQgZWxUeXBlPXByQ2hpbGRyZW5bcHJDaGlsZHJlbi5sZW5ndGgtMV1cclxuXHRcdFx0bGV0IG5hbWU9ZWxUeXBlLm5hbWUuc3BsaXQoXCI6XCIpLnBvcCgpXHJcblx0XHRcdGxldCB0eXBlPVwidGV4dCxwaWN0dXJlLGRvY1BhcnRMaXN0LGNvbWJvQm94LGRyb3BEb3duTGlzdCxkYXRlLGNoZWNrYm94LHJlcGVhdGluZ1NlY3Rpb24scmVwZWF0aW5nU2VjdGlvbkl0ZW1cIi5zcGxpdChcIixcIilcclxuXHRcdFx0XHQuZmluZChhPT5hPT1uYW1lKVxyXG5cdFx0XHRsZXQgbW9kZWw9e2NoaWxkcmVufVxyXG5cdFx0XHRpZih0eXBlKXtcclxuXHRcdFx0XHRtb2RlbC50eXBlPWBjb250cm9sLiR7dHlwZX1gXHJcblx0XHRcdH1lbHNley8vY29udGFpbmVyXHJcblx0XHRcdFx0aWYoY29udGVudC5maW5kKFwid1xcXFw6cCx3XFxcXDp0Ymwsd1xcXFw6dHIsd1xcXFw6dGNcIikubGVuZ3RoKXtcclxuXHRcdFx0XHRcdG1vZGVsLnR5cGU9XCJibG9ja1wiXHJcblx0XHRcdFx0fWVsc2V7XHJcblx0XHRcdFx0XHRtb2RlbC50eXBlPVwiaW5saW5lXCJcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdFx0XHJcblx0XHRcdCQ9b2ZmaWNlRG9jdW1lbnQuY29udGVudFxyXG5cdFx0XHRzd2l0Y2gobW9kZWwudHlwZSl7XHJcblx0XHRcdFx0Y2FzZSBcImNvbnRyb2wuZHJvcERvd25MaXN0XCI6XHRcclxuXHRcdFx0XHRjYXNlIFwiY29udHJvbC5jb21ib0JveFwiOntcclxuXHRcdFx0XHRcdGxldCBzZWxlY3RlZD0kKGNvbnRlbnQpLnRleHQoKVxyXG5cdFx0XHRcdFx0bW9kZWwub3B0aW9ucz0kKGVsVHlwZSlcclxuXHRcdFx0XHRcdFx0LmZpbmQoXCJ3XFxcXDpsaXN0SXRlbVwiKVxyXG5cdFx0XHRcdFx0XHQubWFwKChpLGxpKT0+e1xyXG5cdFx0XHRcdFx0XHRcdHJldHVybiB7XHJcblx0XHRcdFx0XHRcdFx0XHRkaXNwbGF5VGV4dDogbGkuYXR0cmlic1tcInc6ZGlzcGxheVRleHRcIl0sXHJcblx0XHRcdFx0XHRcdFx0XHR2YWx1ZTogbGkuYXR0cmlic1tcInc6dmFsdWVcIl1cclxuXHRcdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdH0pXHJcblx0XHRcdFx0XHRcdC5nZXQoKVxyXG5cdFx0XHRcdFx0bW9kZWwudmFsdWU9KG1vZGVsLm9wdGlvbnMuZmluZChhPT5hLmRpc3BsYXlUZXh0PT1zZWxlY3RlZCl8fHt9KS52YWx1ZVxyXG5cdFx0XHRcdFx0YnJlYWtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0Y2FzZSBcImNvbnRyb2wuY2hlY2tib3hcIjp7XHJcblx0XHRcdFx0XHRsZXQgbnM9ZWxUeXBlLm5hbWUuc3BsaXQoXCI6XCIpWzBdXHJcblx0XHRcdFx0XHRtb2RlbC5jaGVja2VkPSQoZWxUeXBlKS5maW5kKGAke25zfVxcXFw6Y2hlY2tlZGApLmF0dHIoYCR7bnN9OnZhbGApPT1cIjFcIlxyXG5cdFx0XHRcdFx0YnJlYWtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0Y2FzZSBcImNvbnRyb2wudGV4dFwiOlxyXG5cdFx0XHRcdFx0aWYoY29udGVudC5maW5kKCd3XFxcXDpyIFt3XFxcXDp2YWx+PVBsYWNlaG9sZGVyXScpLmxlbmd0aD09MClcclxuXHRcdFx0XHRcdFx0bW9kZWwudmFsdWU9Y29udGVudC50ZXh0KClcclxuXHRcdFx0XHRcdGJyZWFrXHJcblx0XHRcdFx0Y2FzZSBcImNvbnRyb2wuZGF0ZVwiOlxyXG5cdFx0XHRcdFx0bW9kZWwudmFsdWU9bmV3IERhdGUoJChlbFR5cGUpLmF0dHIoXCJ3OmZ1bGxEYXRlXCIpKVxyXG5cdFx0XHRcdFx0bW9kZWwuZm9ybWF0PSQoZWxUeXBlKS5maW5kKFwid1xcXFw6ZGF0ZUZvcm1hdFwiKS5hdHRyKFwidzp2YWxcIilcclxuXHRcdFx0XHRcdG1vZGVsLmxvY2FsZT0kKGVsVHlwZSkuZmluZChcIndcXFxcOmxpZFwiKS5hdHRyKFwidzp2YWxcIilcclxuXHRcdFx0XHRcdGJyZWFrXHJcblx0XHRcdH1cclxuXHRcdFx0cmV0dXJuIG1vZGVsXHJcblx0XHR9XHJcblx0fSxcclxuXHRoeXBlcmxpbmsod1htbCxvZmZpY2VEb2N1bWVudCl7XHJcbiAgICAgICAgaWYgKHdYbWwuYXR0cmlic1tcInI6aWRcIl0pIHtcclxuICAgICAgICAgICAgbGV0IHVybD1vZmZpY2VEb2N1bWVudC5nZXRSZWwod1htbC5hdHRyaWJzW1wicjppZFwiXSlcclxuICAgICAgICAgICAgcmV0dXJuIHt0eXBlOlwiaHlwZXJsaW5rXCIsIHVybH07XHJcbiAgICAgICAgfSBlbHNlIGlmICh3WG1sLmF0dHJpYnNbJ3c6YW5jaG9yJ10pIHtcclxuICAgICAgICBcdGxldCBuYW1lID0gd1htbC5hdHRyaWJzWyd3OmFuY2hvciddOyAvL1RPRE9cclxuICAgICAgICAgICAgcmV0dXJuIHt0eXBlOidhbmNob3InLCBuYW1lfTtcclxuICAgICAgICB9XHJcblx0fSxcclxuXHR0Ymwod1htbCl7XHJcblx0XHRyZXR1cm4gd1htbC5jaGlsZHJlbi5yZWR1Y2UoKHN0YXRlLG5vZGUpPT57XHJcblx0XHRcdHN3aXRjaChub2RlLm5hbWUpe1xyXG5cdFx0XHRjYXNlIFwidzp0YmxQclwiOlxyXG5cdFx0XHRcdHN0YXRlLnByPW5vZGVcclxuXHRcdFx0YnJlYWtcclxuXHRcdFx0Y2FzZSBcInc6dGJsR3JpZFwiOlxyXG5cdFx0XHRcdHN0YXRlLmNvbHM9bm9kZS5jaGlsZHJlblxyXG5cdFx0XHRicmVha1xyXG5cdFx0XHRkZWZhdWx0OlxyXG5cdFx0XHRcdHN0YXRlLmNoaWxkcmVuLnB1c2gobm9kZSlcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4gc3RhdGVcclxuXHRcdH0se3R5cGU6XCJ0YmxcIixjaGlsZHJlbjpbXSxwcjpudWxsLGNvbHM6W119KVxyXG5cdH0sXHJcblx0dHIod1htbCl7XHJcblx0XHRyZXR1cm4gd1htbC5jaGlsZHJlbi5yZWR1Y2UoKHN0YXRlLG5vZGUpPT57XHJcblx0XHRcdHN3aXRjaChub2RlLm5hbWUpe1xyXG5cdFx0XHRjYXNlIFwidzp0clByXCI6XHJcblx0XHRcdFx0c3RhdGUucHI9bm9kZVxyXG5cdFx0XHRcdHN0YXRlLmlzSGVhZGVyPSEhbm9kZS5jaGlsZHJlbi5maW5kKGE9PmEubmFtZT09XCJ3OnRibEhlYWRlclwiKVxyXG5cdFx0XHRicmVha1xyXG5cdFx0XHRkZWZhdWx0OlxyXG5cdFx0XHRcdHN0YXRlLmNoaWxkcmVuLnB1c2gobm9kZSlcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4gc3RhdGVcclxuXHRcdH0se3R5cGU6XCJ0clwiLGNoaWxkcmVuOltdLHByOm51bGx9KVxyXG5cdH0sXHJcblx0dGMod1htbCl7XHJcblx0XHRyZXR1cm4gd1htbC5jaGlsZHJlbi5yZWR1Y2UoKHN0YXRlLG5vZGUpPT57XHJcblx0XHRcdHN3aXRjaChub2RlLm5hbWUpe1xyXG5cdFx0XHRjYXNlIFwidzp0Y1ByXCI6XHJcblx0XHRcdFx0c3RhdGUucHI9bm9kZVxyXG5cdFx0XHRicmVha1xyXG5cdFx0XHRkZWZhdWx0OlxyXG5cdFx0XHRcdHN0YXRlLmNoaWxkcmVuLnB1c2gobm9kZSlcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4gc3RhdGVcclxuXHRcdH0se3R5cGU6XCJ0Y1wiLGNoaWxkcmVuOltdLHByOm51bGx9KVxyXG5cdH0sXHJcblx0YWx0Q2h1bmsod1htbCwgb2ZmaWNlRG9jdW1lbnQpe1xyXG5cdFx0bGV0IHJJZD13WG1sLmF0dHJpYnNbJ3I6aWQnXVxyXG5cdFx0bGV0IGRhdGE9b2ZmaWNlRG9jdW1lbnQuZ2V0UmVsKHJJZClcclxuXHJcblx0XHRsZXQgcGFydE5hbWU9b2ZmaWNlRG9jdW1lbnQuZm9sZGVyK29mZmljZURvY3VtZW50LnJlbHMoYFtJZD0ke3JJZH1dYCkuYXR0cihcIlRhcmdldFwiKVxyXG5cdFx0bGV0IGNvbnRlbnRUeXBlPW9mZmljZURvY3VtZW50LmRvYy5jb250ZW50VHlwZXMoYE92ZXJyaWRlW1BhcnROYW1lPScke3BhcnROYW1lfSddYCkuYXR0cihcIkNvbnRlbnRUeXBlXCIpXHJcblx0XHRyZXR1cm4ge3R5cGU6XCJjaHVua1wiLCBkYXRhLCBjb250ZW50VHlwZX1cclxuXHR9LFxyXG5cdGRvY0RlZmF1bHRzKHdYbWwpe1xyXG5cdFx0cmV0dXJuIHt0eXBlOlwic3R5bGVcIn1cclxuXHR9LFxyXG5cdHN0eWxlKHdYbWwpe1xyXG5cdFx0cmV0dXJuIHt0eXBlOlwic3R5bGVcIiwgaWQ6d1htbC5hdHRyaWJzWyd3OnN0eWxlSWQnXX1cclxuXHR9LFxyXG5cdGFic3RyYWN0TnVtKHdYbWwpe1xyXG5cdFx0cmV0dXJuIHt0eXBlOlwiYWJzdHJhY3ROdW1cIixpZDp3WG1sLmF0dHJpYnNbXCJ3OmFic3RyYWN0TnVtSWRcIl19XHJcblx0fSxcclxuXHRudW0od1htbCl7XHJcblx0XHRyZXR1cm4ge3R5cGU6XCJudW1cIixpZDp3WG1sLmF0dHJpYnNbXCJ3Om51bUlkXCJdLGFic3RyYWN0TnVtOndYbWwuY2hpbGRyZW4uZmluZChhPT5hLm5hbWU9PVwidzphYnN0cmFjdE51bUlkXCIpLmF0dHJpYnNbXCJ3OnZhbFwiXX1cclxuXHR9LFxyXG5cdGxhdGVudFN0eWxlcygpe1xyXG5cdFx0cmV0dXJuIG51bGxcclxuXHR9LFxyXG5cdG9iamVjdCh3WG1sLG9mZmljZURvY3VtZW50KXtcclxuXHRcdGxldCBvbGU9b2ZmaWNlRG9jdW1lbnQuY29udGVudCh3WG1sKS5maW5kKFwib1xcXFw6T0xFT2JqZWN0XCIpXHJcblx0XHRsZXQgdHlwZT1vbGUuYXR0cihcIlByb2dJRFwiKVxyXG5cdFx0bGV0IGVtYmVkPW9sZS5hdHRyKFwiVHlwZVwiKT09PVwiRW1iZWRcIlxyXG5cdFx0bGV0IHJJZD1vbGUuYXR0cihcInI6aWRcIilcclxuXHRcdHJldHVybiB7dHlwZTpcIm9iamVjdFwiLGVtYmVkLCBwcm9nOiB0eXBlLCBkYXRhOm9mZmljZURvY3VtZW50LmdldFJlbE9sZU9iamVjdChySWQpfVxyXG5cdH1cclxufVxyXG4iXX0=