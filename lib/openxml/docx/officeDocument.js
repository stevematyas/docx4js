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

        var identity = {
            type: type,
            pr: wXml.children.find(function (_ref) {
                var name = _ref.name;
                return name == "w:pPr";
            }),
            children: wXml.children.filter(function (_ref2) {
                var name = _ref2.name;
                return name != "w:pPr";
            })
        };

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
    r: function r(wXml, officeDocument) {
        var $ = officeDocument.content(wXml);
        var rPr = wXml.children.find(function (_ref3) {
            var name = _ref3.name;
            return name == "w:rPr";
        }) || [];
        var parent_pPr_rPr = $.parent("w\\:p").find("w\\:pPr>w\\:rPr").get();

        if (parent_pPr_rPr.length) {
            if (rPr.length) rPr.concat(parent_pPr_rPr);else rPr = parent_pPr_rPr;
        }
        return { type: "r", pr: rPr, children: wXml.children.filter(function (_ref4) {
                var name = _ref4.name;
                return name != "w:rPr";
            }) || [] };
    },
    fldChar: function fldChar(wXml, officeDocument) {
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
        return {
            type: "shape",
            children: officeDocument.content(wXml).find(">wps\\:txbx>w\\:txbxContent").children().toArray()
        };
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
    tbl: function tbl(wXml, officeDocument) {
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
    tr: function tr(wXml, officeDocument) {
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
    tc: function tc(wXml, officeDocument) {
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
        return {
            type: "num",
            id: wXml.attribs["w:numId"],
            abstractNum: wXml.children.find(function (a) {
                return a.name == "w:abstractNumId";
            }).attribs["w:val"]
        };
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9vcGVueG1sL2RvY3gvb2ZmaWNlRG9jdW1lbnQuanMiXSwibmFtZXMiOlsiT2ZmaWNlRG9jdW1lbnQiLCJzdXBwb3J0ZWQiLCJzcGxpdCIsInJlbHMiLCJlYWNoIiwiaSIsInJlbCIsIiQiLCJ0eXBlIiwiYXR0ciIsInBvcCIsImluZGV4T2YiLCJ0YXJnZXQiLCJPYmplY3QiLCJkZWZpbmVQcm9wZXJ0eSIsImdldCIsImdldFJlbE9iamVjdCIsImNyZWF0ZUVsZW1lbnQiLCJpZGVudGlmeSIsInN0eWxlcyIsInJlbmRlck5vZGUiLCJudW1iZXJpbmciLCJjb250ZW50IiwiZG9tSGFuZGxlciIsImRvYyIsImJpbmQiLCJfaWRlbnRpZnkiLCJtb2RlbCIsImFyZ3VtZW50cyIsImVtaXQiLCJkb2N1bWVudCIsIndYbWwiLCJvZmZpY2VEb2N1bWVudCIsInRhZyIsIm5hbWUiLCJpZGVudGl0aWVzIiwiY3VycmVudCIsImNoaWxkcmVuIiwic2VjdCIsImVuZCIsImNsb3Nlc3QiLCJwcmV2VW50aWwiLCJ0b0FycmF5IiwicmV2ZXJzZSIsImlzIiwicHVzaCIsInNlY3RQciIsImhmIiwiZmlsdGVyIiwiYSIsInJlZHVjZSIsImhlYWRlcnMiLCJzZXQiLCJhdHRyaWJzIiwiZ2V0UmVsIiwiTWFwIiwiZm9vdGVycyIsImhhc1RpdGxlUGFnZSIsImZpbmQiLCJwIiwiaWRlbnRpdHkiLCJwciIsInBQciIsImxlbmd0aCIsInN0eWxlSWQiLCJudW1QciIsIm51bUlkIiwibGV2ZWwiLCJvdXRsaW5lTHZsIiwicGFyc2VJbnQiLCJ3dCIsIm1hcCIsImluZGV4IiwiZWxlbWVudCIsInIiLCJyUHIiLCJwYXJlbnRfcFByX3JQciIsInBhcmVudCIsImNvbmNhdCIsImZsZENoYXIiLCJpbmxpbmUiLCJhbmNob3IiLCJncmFwaGljRGF0YSIsInBpYyIsImJsaXAiLCJyaWQiLCJ3c3AiLCJGYWxsYmFjayIsInNkdCIsImVsQmluZGluZyIsInBhdGgiLCJkIiwidmFsdWUiLCJ0ZXh0IiwicHJDaGlsZHJlbiIsImVsVHlwZSIsInNlbGVjdGVkIiwib3B0aW9ucyIsImxpIiwiZGlzcGxheVRleHQiLCJucyIsImNoZWNrZWQiLCJEYXRlIiwiZm9ybWF0IiwibG9jYWxlIiwiaHlwZXJsaW5rIiwidXJsIiwidGJsIiwic3RhdGUiLCJub2RlIiwiY29scyIsInRyIiwiaXNIZWFkZXIiLCJ0YyIsImFsdENodW5rIiwicklkIiwiZGF0YSIsInBhcnROYW1lIiwiZm9sZGVyIiwiY29udGVudFR5cGUiLCJjb250ZW50VHlwZXMiLCJkb2NEZWZhdWx0cyIsInN0eWxlIiwiaWQiLCJhYnN0cmFjdE51bSIsIm51bSIsImxhdGVudFN0eWxlcyIsIm9iamVjdCIsIm9sZSIsImVtYmVkIiwicHJvZyIsImdldFJlbE9sZU9iamVjdCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7Ozs7Ozs7Ozs7OztJQUVhQSxjLFdBQUFBLGM7Ozs7Ozs7Ozs7O2dDQUNEO0FBQUE7O0FBQ0o7QUFDQSxnQkFBTUMsWUFBWSxrQ0FBa0NDLEtBQWxDLENBQXdDLEdBQXhDLENBQWxCO0FBQ0EsaUJBQUtDLElBQUwsbUNBQTBDQyxJQUExQyxDQUErQyxVQUFDQyxDQUFELEVBQUlDLEdBQUosRUFBWTtBQUN2RCxvQkFBSUMsSUFBSSxPQUFLSixJQUFMLENBQVVHLEdBQVYsQ0FBUjtBQUNBLG9CQUFJRSxPQUFPRCxFQUFFRSxJQUFGLENBQU8sTUFBUCxFQUFlUCxLQUFmLENBQXFCLEdBQXJCLEVBQTBCUSxHQUExQixFQUFYO0FBQ0Esb0JBQUlULFVBQVVVLE9BQVYsQ0FBa0JILElBQWxCLEtBQTJCLENBQUMsQ0FBaEMsRUFBbUM7QUFDL0Isd0JBQUlJLFNBQVNMLEVBQUVFLElBQUYsQ0FBTyxRQUFQLENBQWI7QUFDQUksMkJBQU9DLGNBQVAsU0FBNEJOLElBQTVCLEVBQWtDO0FBQzlCTywyQkFEOEIsaUJBQ3hCO0FBQ0YsbUNBQU8sS0FBS0MsWUFBTCxDQUFrQkosTUFBbEIsQ0FBUDtBQUNIO0FBSDZCLHFCQUFsQztBQUtIO0FBQ0osYUFYRDtBQVlIOzs7K0JBRU1LLGEsRUFBbUQ7QUFBQSxnQkFBcENDLFFBQW9DLHVFQUF6QmxCLGVBQWVrQixRQUFVOztBQUN0RCxnQkFBSSxLQUFLQyxNQUFULEVBQ0ksS0FBS0MsVUFBTCxDQUFnQixLQUFLRCxNQUFMLENBQVksWUFBWixFQUEwQkosR0FBMUIsQ0FBOEIsQ0FBOUIsQ0FBaEIsRUFBa0RFLGFBQWxELEVBQWlFQyxRQUFqRTtBQUNKLGdCQUFJLEtBQUtHLFNBQVQsRUFDSSxLQUFLRCxVQUFMLENBQWdCLEtBQUtDLFNBQUwsQ0FBZSxlQUFmLEVBQWdDTixHQUFoQyxDQUFvQyxDQUFwQyxDQUFoQixFQUF3REUsYUFBeEQsRUFBdUVDLFFBQXZFO0FBQ0osbUJBQU8sS0FBS0UsVUFBTCxDQUFnQixLQUFLRSxPQUFMLENBQWEsY0FBYixFQUE2QlAsR0FBN0IsQ0FBaUMsQ0FBakMsQ0FBaEIsRUFBcURFLGFBQXJELEVBQW9FQyxRQUFwRSxDQUFQO0FBQ0g7Ozs4QkFFS0ssVSxFQUFnRDtBQUFBLGdCQUFwQ0wsUUFBb0MsdUVBQXpCbEIsZUFBZWtCLFFBQVU7O0FBQ2xELGdCQUFNTSxNQUFNLEVBQVo7QUFDQSxnQkFBTVAsZ0JBQWdCTSxXQUFXTixhQUFYLENBQXlCUSxJQUF6QixDQUE4QkYsVUFBOUIsQ0FBdEI7O0FBRUEscUJBQVNHLFNBQVQsR0FBcUI7QUFDakIsb0JBQUlDLFFBQVFULDBCQUFZVSxTQUFaLENBQVo7QUFDQSxvQkFBSUQsU0FBUyxRQUFPQSxLQUFQLHlDQUFPQSxLQUFQLE1BQWlCLFFBQTlCLEVBQXdDO0FBQ3BDSiwrQkFBV00sSUFBWCxvQkFBZ0IsR0FBaEIsRUFBcUJGLEtBQXJCLG9DQUErQkMsU0FBL0I7QUFDQUwsK0JBQVdNLElBQVgsb0JBQWdCRixNQUFNbkIsSUFBdEIsRUFBNEJtQixLQUE1QixvQ0FBc0NDLFNBQXRDO0FBQ0Esd0JBQUlMLGtCQUFnQkksTUFBTW5CLElBQXRCLENBQUosRUFDSWUsa0JBQWdCSSxNQUFNbkIsSUFBdEIscUJBQThCbUIsS0FBOUIsb0NBQXdDQyxTQUF4QztBQUNQO0FBQ0QsdUJBQU9ELEtBQVA7QUFDSDs7QUFFRCxnQkFBSSxLQUFLUixNQUFULEVBQ0lLLElBQUlMLE1BQUosR0FBYSxLQUFLQyxVQUFMLENBQWdCLEtBQUtELE1BQUwsQ0FBWSxZQUFaLEVBQTBCSixHQUExQixDQUE4QixDQUE5QixDQUFoQixFQUFrREUsYUFBbEQsRUFBaUVTLFNBQWpFLENBQWI7QUFDSixnQkFBSSxLQUFLTCxTQUFULEVBQ0lHLElBQUlILFNBQUosR0FBZ0IsS0FBS0QsVUFBTCxDQUFnQixLQUFLQyxTQUFMLENBQWUsZUFBZixFQUFnQ04sR0FBaEMsQ0FBb0MsQ0FBcEMsQ0FBaEIsRUFBd0RFLGFBQXhELEVBQXVFUyxTQUF2RSxDQUFoQjtBQUNKRixnQkFBSU0sUUFBSixHQUFlLEtBQUtWLFVBQUwsQ0FBZ0IsS0FBS0UsT0FBTCxDQUFhLGNBQWIsRUFBNkJQLEdBQTdCLENBQWlDLENBQWpDLENBQWhCLEVBQXFERSxhQUFyRCxFQUFvRVMsU0FBcEUsQ0FBZjtBQUNBLG1CQUFPRixHQUFQO0FBQ0g7OztpQ0FFZU8sSSxFQUFNQyxjLEVBQWdCO0FBQ2xDLGdCQUFNQyxNQUFNRixLQUFLRyxJQUFMLENBQVVoQyxLQUFWLENBQWdCLEdBQWhCLEVBQXFCUSxHQUFyQixFQUFaO0FBQ0EsZ0JBQUl5QixXQUFXRixHQUFYLENBQUosRUFDSSxPQUFPRSxXQUFXRixHQUFYLG9CQUFtQkwsU0FBbkIsQ0FBUDs7QUFFSixtQkFBT0ssR0FBUDtBQUNIOzs7Ozs7a0JBR1VqQyxjO0FBRVIsSUFBTW1DLGtDQUFhO0FBQ3RCTCxZQURzQixvQkFDYkMsSUFEYSxFQUNQQyxjQURPLEVBQ1M7QUFDM0IsWUFBSXpCLElBQUl5QixlQUFlVixPQUF2QjtBQUNBLFlBQUljLFVBQVUsSUFBZDtBQUNBLFlBQUlDLFdBQVc5QixFQUFFLFlBQUYsRUFBZ0JILElBQWhCLENBQXFCLFVBQUNDLENBQUQsRUFBSWlDLElBQUosRUFBYTtBQUM3QyxnQkFBSUMsTUFBTWhDLEVBQUUrQixJQUFGLEVBQVFFLE9BQVIsQ0FBZ0IsWUFBaEIsQ0FBVjtBQUNBRixpQkFBS2hCLE9BQUwsR0FBZWlCLElBQUlFLFNBQUosQ0FBY0wsT0FBZCxFQUF1Qk0sT0FBdkIsR0FBaUNDLE9BQWpDLEVBQWY7QUFDQSxnQkFBSSxDQUFDSixJQUFJSyxFQUFKLENBQU9OLElBQVAsQ0FBTCxFQUNJQSxLQUFLaEIsT0FBTCxDQUFhdUIsSUFBYixDQUFrQk4sSUFBSXhCLEdBQUosQ0FBUSxDQUFSLENBQWxCO0FBQ0pxQixzQkFBVUcsR0FBVjtBQUNILFNBTmMsRUFNWkcsT0FOWSxFQUFmO0FBT0EsZUFBTyxFQUFDbEMsTUFBTSxVQUFQLEVBQW1CNkIsa0JBQW5CLEVBQVA7QUFDSCxLQVpxQjtBQWF0QlMsVUFic0Isa0JBYWZmLElBYmUsRUFhVEMsY0FiUyxFQWFPO0FBQ3pCLFlBQU1lLEtBQUssU0FBTEEsRUFBSztBQUFBLG1CQUFRaEIsS0FBS00sUUFBTCxDQUFjVyxNQUFkLENBQXFCO0FBQUEsdUJBQUtDLEVBQUVmLElBQUYsV0FBZTFCLElBQWYsY0FBTDtBQUFBLGFBQXJCLEVBQTBEMEMsTUFBMUQsQ0FBaUUsVUFBQ0MsT0FBRCxFQUFVRixDQUFWLEVBQWdCO0FBQ2hHRSx3QkFBUUMsR0FBUixDQUFZSCxFQUFFSSxPQUFGLENBQVUsUUFBVixDQUFaLEVBQWlDckIsZUFBZXNCLE1BQWYsQ0FBc0JMLEVBQUVJLE9BQUYsQ0FBVSxNQUFWLENBQXRCLENBQWpDO0FBQ0EsdUJBQU9GLE9BQVA7QUFDSCxhQUhrQixFQUdoQixJQUFJSSxHQUFKLEVBSGdCLENBQVI7QUFBQSxTQUFYOztBQUtBLGVBQU87QUFDSC9DLGtCQUFNLFNBREg7QUFFSDZCLHNCQUFVTixLQUFLVCxPQUZaO0FBR0g2QixxQkFBU0osR0FBRyxRQUFILENBSE47QUFJSFMscUJBQVNULEdBQUcsUUFBSCxDQUpOO0FBS0hVLDBCQUFjLENBQUMsQ0FBQzFCLEtBQUtNLFFBQUwsQ0FBY3FCLElBQWQsQ0FBbUI7QUFBQSx1QkFBS1QsRUFBRWYsSUFBRixJQUFVLFdBQWY7QUFBQSxhQUFuQjtBQUxiLFNBQVA7QUFPSCxLQTFCcUI7QUEyQnRCeUIsS0EzQnNCLGFBMkJwQjVCLElBM0JvQixFQTJCZEMsY0EzQmMsRUEyQkU7QUFDcEIsWUFBSXpCLElBQUl5QixlQUFlVixPQUFmLENBQXVCUyxJQUF2QixDQUFSO0FBQ0EsWUFBSXZCLE9BQU8sR0FBWDs7QUFFQSxZQUFJb0QsV0FBVztBQUNYcEQsc0JBRFc7QUFFWHFELGdCQUFJOUIsS0FBS00sUUFBTCxDQUFjcUIsSUFBZCxDQUFtQjtBQUFBLG9CQUFFeEIsSUFBRixRQUFFQSxJQUFGO0FBQUEsdUJBQVlBLFFBQVEsT0FBcEI7QUFBQSxhQUFuQixDQUZPO0FBR1hHLHNCQUFVTixLQUFLTSxRQUFMLENBQWNXLE1BQWQsQ0FBcUI7QUFBQSxvQkFBRWQsSUFBRixTQUFFQSxJQUFGO0FBQUEsdUJBQVlBLFFBQVEsT0FBcEI7QUFBQSxhQUFyQjtBQUhDLFNBQWY7O0FBTUEsWUFBSTRCLE1BQU12RCxFQUFFbUQsSUFBRixDQUFPLFNBQVAsQ0FBVjtBQUNBLFlBQUlJLElBQUlDLE1BQVIsRUFBZ0I7QUFDWixnQkFBSUMsVUFBVUYsSUFBSUosSUFBSixDQUFTLFlBQVQsRUFBdUJqRCxJQUF2QixDQUE0QixPQUE1QixDQUFkOztBQUVBLGdCQUFJd0QsUUFBUUgsSUFBSUosSUFBSixDQUFTLHFCQUFULENBQVo7QUFDQSxnQkFBSSxDQUFDTyxNQUFNRixNQUFQLElBQWlCQyxPQUFyQixFQUE4QjtBQUMxQkMsd0JBQVFqQyxlQUFlYixNQUFmLDhCQUFnRDZDLE9BQWhELDZCQUFSO0FBQ0g7O0FBRUQsZ0JBQUlDLE1BQU1GLE1BQVYsRUFBa0I7QUFDZEgseUJBQVNwRCxJQUFULEdBQWdCLE1BQWhCO0FBQ0FvRCx5QkFBU00sS0FBVCxHQUFpQkQsTUFBTVAsSUFBTixDQUFXLFdBQVgsRUFBd0JqRCxJQUF4QixDQUE2QixPQUE3QixDQUFqQjtBQUNBbUQseUJBQVNPLEtBQVQsR0FBaUJGLE1BQU1QLElBQU4sQ0FBVyxVQUFYLEVBQXVCakQsSUFBdkIsQ0FBNEIsT0FBNUIsQ0FBakI7QUFDSCxhQUpELE1BSU87QUFDSCxvQkFBSTJELGFBQWFOLElBQUlKLElBQUosQ0FBUyxnQkFBVCxFQUEyQmpELElBQTNCLENBQWdDLE9BQWhDLENBQWpCO0FBQ0Esb0JBQUksQ0FBQzJELFVBQUQsSUFBZUosT0FBbkIsRUFDSUksYUFBYXBDLGVBQWViLE1BQWYsOEJBQWdENkMsT0FBaEQseUJBQTRFdkQsSUFBNUUsQ0FBaUYsT0FBakYsQ0FBYjs7QUFFSixvQkFBSTJELFVBQUosRUFBZ0I7QUFDWlIsNkJBQVNwRCxJQUFULEdBQWdCLFNBQWhCO0FBQ0FvRCw2QkFBU08sS0FBVCxHQUFpQkUsU0FBU0QsVUFBVCxJQUF1QixDQUF4QztBQUNBUiw2QkFBU0ksT0FBVCxHQUFtQkEsT0FBbkI7QUFDSDtBQUNKO0FBQ0o7QUFDREosaUJBQVNVLEVBQVQsR0FBYyxZQUFZO0FBQ3RCLG1CQUFPL0QsRUFBRW1ELElBQUYsQ0FBTyxPQUFQLEVBQWdCYSxHQUFoQixDQUFvQixVQUFVQyxLQUFWLEVBQWlCQyxPQUFqQixFQUEwQjtBQUNqRCx1QkFBT0EsUUFBUXBDLFFBQWY7QUFDSCxhQUZNLEVBRUp0QixHQUZJLEVBQVA7QUFHSCxTQUpEOztBQU1BLGVBQU82QyxRQUFQO0FBQ0gsS0FyRXFCO0FBc0V0QmMsS0F0RXNCLGFBc0VwQjNDLElBdEVvQixFQXNFZEMsY0F0RWMsRUFzRUU7QUFDcEIsWUFBSXpCLElBQUl5QixlQUFlVixPQUFmLENBQXVCUyxJQUF2QixDQUFSO0FBQ0EsWUFBSTRDLE1BQU01QyxLQUFLTSxRQUFMLENBQWNxQixJQUFkLENBQW1CO0FBQUEsZ0JBQUV4QixJQUFGLFNBQUVBLElBQUY7QUFBQSxtQkFBWUEsUUFBUSxPQUFwQjtBQUFBLFNBQW5CLEtBQW1ELEVBQTdEO0FBQ0EsWUFBSTBDLGlCQUFpQnJFLEVBQUVzRSxNQUFGLENBQVMsT0FBVCxFQUFrQm5CLElBQWxCLENBQXVCLGlCQUF2QixFQUEwQzNDLEdBQTFDLEVBQXJCOztBQUVBLFlBQUk2RCxlQUFlYixNQUFuQixFQUEyQjtBQUN2QixnQkFBR1ksSUFBSVosTUFBUCxFQUNJWSxJQUFJRyxNQUFKLENBQVdGLGNBQVgsRUFESixLQUdJRCxNQUFNQyxjQUFOO0FBQ1A7QUFDRCxlQUFPLEVBQUNwRSxNQUFNLEdBQVAsRUFBWXFELElBQUljLEdBQWhCLEVBQXFCdEMsVUFBVU4sS0FBS00sUUFBTCxDQUFjVyxNQUFkLENBQXFCO0FBQUEsb0JBQUVkLElBQUYsU0FBRUEsSUFBRjtBQUFBLHVCQUFZQSxRQUFRLE9BQXBCO0FBQUEsYUFBckIsS0FBcUQsRUFBcEYsRUFBUDtBQUNILEtBbEZxQjtBQW1GdEI2QyxXQW5Gc0IsbUJBbUZkaEQsSUFuRmMsRUFtRlJDLGNBbkZRLEVBbUZRO0FBQzFCLGVBQU9ELEtBQUtzQixPQUFMLENBQWEsZUFBYixDQUFQO0FBQ0gsS0FyRnFCO0FBdUZ0QjJCLFVBdkZzQixrQkF1RmZqRCxJQXZGZSxFQXVGVEMsY0F2RlMsRUF1Rk87QUFDekIsWUFBSXpCLElBQUl5QixlQUFlVixPQUFmLENBQXVCUyxJQUF2QixDQUFSO0FBQ0EsZUFBTyxFQUFDdkIsc0JBQUQsRUFBeUI2QixVQUFVOUIsRUFBRW1ELElBQUYsQ0FBTyw2QkFBUCxFQUFzQ3JCLFFBQXRDLEdBQWlESyxPQUFqRCxFQUFuQyxFQUFQO0FBQ0gsS0ExRnFCO0FBMkZ0QnVDLFVBM0ZzQixrQkEyRmZsRCxJQTNGZSxFQTJGVEMsY0EzRlMsRUEyRk87QUFDekIsWUFBSXpCLElBQUl5QixlQUFlVixPQUFmLENBQXVCUyxJQUF2QixDQUFSO0FBQ0EsWUFBSW1ELGNBQWMzRSxFQUFFbUQsSUFBRixDQUFPLDZCQUFQLENBQWxCO0FBQ0EsWUFBSWxELE9BQU8wRSxZQUFZekUsSUFBWixDQUFpQixLQUFqQixFQUF3QlAsS0FBeEIsQ0FBOEIsR0FBOUIsRUFBbUNRLEdBQW5DLEVBQVg7QUFDQSxZQUFJMkIsV0FBVzZDLFlBQVk3QyxRQUFaLEdBQXVCSyxPQUF2QixFQUFmO0FBQ0EsWUFBSWxDLFFBQVEscUJBQVosRUFDSTZCLFdBQVdBLFNBQVMsQ0FBVCxFQUFZQSxRQUFaLENBQXFCVyxNQUFyQixDQUE0QjtBQUFBLG1CQUFLQyxFQUFFZixJQUFGLENBQU9oQyxLQUFQLENBQWEsR0FBYixFQUFrQixDQUFsQixLQUF3QixLQUE3QjtBQUFBLFNBQTVCLENBQVg7O0FBRUosZUFBTyxFQUFDTSxNQUFNLGdCQUFQLEVBQXlCNkIsa0JBQXpCLEVBQVA7QUFDSCxLQXBHcUI7QUFxR3RCOEMsT0FyR3NCLGVBcUdsQnBELElBckdrQixFQXFHWkMsY0FyR1ksRUFxR0k7QUFDdEIsWUFBSW9ELE9BQU9wRCxlQUFlVixPQUFmLENBQXVCUyxJQUF2QixFQUE2QjJCLElBQTdCLENBQWtDLFVBQWxDLENBQVg7QUFDQSxZQUFJMkIsTUFBTUQsS0FBSzNFLElBQUwsQ0FBVSxTQUFWLEtBQXdCMkUsS0FBSzNFLElBQUwsQ0FBVSxRQUFWLENBQWxDO0FBQ0EsMEJBQVFELE1BQU0sU0FBZCxJQUE0QndCLGVBQWVzQixNQUFmLENBQXNCK0IsR0FBdEIsQ0FBNUI7QUFDSCxLQXpHcUI7QUEwR3RCQyxPQTFHc0IsZUEwR2xCdkQsSUExR2tCLEVBMEdaQyxjQTFHWSxFQTBHSTtBQUN0QixlQUFPO0FBQ0h4QixrQkFBTSxPQURIO0FBRUg2QixzQkFBVUwsZUFBZVYsT0FBZixDQUF1QlMsSUFBdkIsRUFBNkIyQixJQUE3QixDQUFrQyw2QkFBbEMsRUFBaUVyQixRQUFqRSxHQUE0RUssT0FBNUU7QUFGUCxTQUFQO0FBSUgsS0EvR3FCO0FBZ0h0QjZDLFlBaEhzQixzQkFnSFg7QUFDUCxlQUFPLElBQVA7QUFDSCxLQWxIcUI7QUFtSHRCQyxPQW5Ic0IsZUFtSGxCekQsSUFuSGtCLEVBbUhaQyxjQW5IWSxFQW1ISTtBQUN0QixZQUFJekIsSUFBSXlCLGVBQWVWLE9BQWYsQ0FBdUJTLElBQXZCLENBQVI7QUFDQSxZQUFJOEIsS0FBS3RELEVBQUVtRCxJQUFGLENBQU8sWUFBUCxDQUFUO0FBQ0EsWUFBSXBDLFVBQVVmLEVBQUVtRCxJQUFGLENBQU8saUJBQVAsQ0FBZDtBQUNBLFlBQUlyQixXQUFXZixRQUFRZSxRQUFSLEdBQW1CSyxPQUFuQixFQUFmOztBQUVBLFlBQUkrQyxZQUFZNUIsR0FBR0gsSUFBSCxDQUFRLGlCQUFSLEVBQTJCM0MsR0FBM0IsQ0FBK0IsQ0FBL0IsQ0FBaEI7QUFDQSxZQUFJMEUsU0FBSixFQUFlO0FBQUM7QUFDWixnQkFBSUMsT0FBT0QsVUFBVXBDLE9BQVYsQ0FBa0IsU0FBbEIsQ0FBWDtBQUFBLGdCQUNJc0MsSUFBSUQsS0FBS3hGLEtBQUwsQ0FBVyxVQUFYLENBRFI7QUFBQSxnQkFFSWdDLFFBQVF5RCxFQUFFakYsR0FBRixJQUFTaUYsRUFBRWpGLEdBQUYsRUFBakIsQ0FGSjtBQUdBLGdCQUFJa0YsUUFBUXRFLFFBQVF1RSxJQUFSLEVBQVo7O0FBRUEsbUJBQU8sRUFBQ3JGLE1BQU0sVUFBUCxFQUFtQjBCLFVBQW5CLEVBQXlCMEQsWUFBekIsRUFBZ0N2RCxrQkFBaEMsRUFBUDtBQUNILFNBUEQsTUFPTztBQUFDO0FBQ0osZ0JBQUl5RCxhQUFhakMsR0FBRzlDLEdBQUgsQ0FBTyxDQUFQLEVBQVVzQixRQUEzQjtBQUNBLGdCQUFJMEQsU0FBU0QsV0FBV0EsV0FBVy9CLE1BQVgsR0FBb0IsQ0FBL0IsQ0FBYjtBQUNBLGdCQUFJN0IsUUFBTzZELE9BQU83RCxJQUFQLENBQVloQyxLQUFaLENBQWtCLEdBQWxCLEVBQXVCUSxHQUF2QixFQUFYO0FBQ0EsZ0JBQUlGLE9BQU8scUdBQXFHTixLQUFyRyxDQUEyRyxHQUEzRyxFQUNOd0QsSUFETSxDQUNEO0FBQUEsdUJBQUtULEtBQUtmLEtBQVY7QUFBQSxhQURDLENBQVg7QUFFQSxnQkFBSVAsUUFBUSxFQUFDVSxrQkFBRCxFQUFaO0FBQ0EsZ0JBQUk3QixJQUFKLEVBQVU7QUFDTm1CLHNCQUFNbkIsSUFBTixnQkFBd0JBLElBQXhCO0FBQ0gsYUFGRCxNQUVPO0FBQUM7QUFDSixvQkFBSWMsUUFBUW9DLElBQVIsQ0FBYSw2QkFBYixFQUE0Q0ssTUFBaEQsRUFBd0Q7QUFDcERwQywwQkFBTW5CLElBQU4sR0FBYSxPQUFiO0FBQ0gsaUJBRkQsTUFFTztBQUNIbUIsMEJBQU1uQixJQUFOLEdBQWEsUUFBYjtBQUNIO0FBQ0o7O0FBRURELGdCQUFJeUIsZUFBZVYsT0FBbkI7QUFDQSxvQkFBUUssTUFBTW5CLElBQWQ7QUFDSSxxQkFBSyxzQkFBTDtBQUNBLHFCQUFLLGtCQUFMO0FBQXlCO0FBQ3JCLDRCQUFJd0YsV0FBV3pGLEVBQUVlLE9BQUYsRUFBV3VFLElBQVgsRUFBZjtBQUNBbEUsOEJBQU1zRSxPQUFOLEdBQWdCMUYsRUFBRXdGLE1BQUYsRUFDWHJDLElBRFcsQ0FDTixjQURNLEVBRVhhLEdBRlcsQ0FFUCxVQUFDbEUsQ0FBRCxFQUFJNkYsRUFBSixFQUFXO0FBQ1osbUNBQU87QUFDSEMsNkNBQWFELEdBQUc3QyxPQUFILENBQVcsZUFBWCxDQURWO0FBRUh1Qyx1Q0FBT00sR0FBRzdDLE9BQUgsQ0FBVyxTQUFYO0FBRkosNkJBQVA7QUFJSCx5QkFQVyxFQVFYdEMsR0FSVyxFQUFoQjtBQVNBWSw4QkFBTWlFLEtBQU4sR0FBYyxDQUFDakUsTUFBTXNFLE9BQU4sQ0FBY3ZDLElBQWQsQ0FBbUI7QUFBQSxtQ0FBS1QsRUFBRWtELFdBQUYsSUFBaUJILFFBQXRCO0FBQUEseUJBQW5CLEtBQXNELEVBQXZELEVBQTJESixLQUF6RTtBQUNBO0FBQ0g7QUFDRCxxQkFBSyxrQkFBTDtBQUF5QjtBQUNyQiw0QkFBSVEsS0FBS0wsT0FBTzdELElBQVAsQ0FBWWhDLEtBQVosQ0FBa0IsR0FBbEIsRUFBdUIsQ0FBdkIsQ0FBVDtBQUNBeUIsOEJBQU0wRSxPQUFOLEdBQWdCOUYsRUFBRXdGLE1BQUYsRUFBVXJDLElBQVYsQ0FBa0IwQyxFQUFsQixpQkFBa0MzRixJQUFsQyxDQUEwQzJGLEVBQTFDLGNBQXVELEdBQXZFO0FBQ0E7QUFDSDtBQUNELHFCQUFLLGNBQUw7QUFDSSx3QkFBSTlFLFFBQVFvQyxJQUFSLENBQWEsOEJBQWIsRUFBNkNLLE1BQTdDLElBQXVELENBQTNELEVBQ0lwQyxNQUFNaUUsS0FBTixHQUFjdEUsUUFBUXVFLElBQVIsRUFBZDtBQUNKO0FBQ0oscUJBQUssY0FBTDtBQUNJbEUsMEJBQU1pRSxLQUFOLEdBQWMsSUFBSVUsSUFBSixDQUFTL0YsRUFBRXdGLE1BQUYsRUFBVXRGLElBQVYsQ0FBZSxZQUFmLENBQVQsQ0FBZDtBQUNBa0IsMEJBQU00RSxNQUFOLEdBQWVoRyxFQUFFd0YsTUFBRixFQUFVckMsSUFBVixDQUFlLGdCQUFmLEVBQWlDakQsSUFBakMsQ0FBc0MsT0FBdEMsQ0FBZjtBQUNBa0IsMEJBQU02RSxNQUFOLEdBQWVqRyxFQUFFd0YsTUFBRixFQUFVckMsSUFBVixDQUFlLFNBQWYsRUFBMEJqRCxJQUExQixDQUErQixPQUEvQixDQUFmO0FBQ0E7QUE3QlI7QUErQkEsbUJBQU9rQixLQUFQO0FBQ0g7QUFDSixLQXBMcUI7QUFxTHRCOEUsYUFyTHNCLHFCQXFMWjFFLElBckxZLEVBcUxOQyxjQXJMTSxFQXFMVTtBQUM1QixZQUFJRCxLQUFLc0IsT0FBTCxDQUFhLE1BQWIsQ0FBSixFQUEwQjtBQUN0QixnQkFBSXFELE1BQU0xRSxlQUFlc0IsTUFBZixDQUFzQnZCLEtBQUtzQixPQUFMLENBQWEsTUFBYixDQUF0QixDQUFWO0FBQ0EsbUJBQU8sRUFBQzdDLE1BQU0sV0FBUCxFQUFvQmtHLFFBQXBCLEVBQVA7QUFDSCxTQUhELE1BR08sSUFBSTNFLEtBQUtzQixPQUFMLENBQWEsVUFBYixDQUFKLEVBQThCO0FBQ2pDLGdCQUFJbkIsT0FBT0gsS0FBS3NCLE9BQUwsQ0FBYSxVQUFiLENBQVgsQ0FEaUMsQ0FDSTtBQUNyQyxtQkFBTyxFQUFDN0MsTUFBTSxRQUFQLEVBQWlCMEIsVUFBakIsRUFBUDtBQUNIO0FBQ0osS0E3THFCO0FBOEx0QnlFLE9BOUxzQixlQThMbEI1RSxJQTlMa0IsRUE4TFpDLGNBOUxZLEVBOExJO0FBQ3RCLGVBQU9ELEtBQUtNLFFBQUwsQ0FBY2EsTUFBZCxDQUFxQixVQUFDMEQsS0FBRCxFQUFRQyxJQUFSLEVBQWlCO0FBQ3pDLG9CQUFRQSxLQUFLM0UsSUFBYjtBQUNJLHFCQUFLLFNBQUw7QUFDSTBFLDBCQUFNL0MsRUFBTixHQUFXZ0QsSUFBWDtBQUNBO0FBQ0oscUJBQUssV0FBTDtBQUNJRCwwQkFBTUUsSUFBTixHQUFhRCxLQUFLeEUsUUFBbEI7QUFDQTtBQUNKO0FBQ0l1RSwwQkFBTXZFLFFBQU4sQ0FBZVEsSUFBZixDQUFvQmdFLElBQXBCO0FBUlI7QUFVQSxtQkFBT0QsS0FBUDtBQUNILFNBWk0sRUFZSixFQUFDcEcsTUFBTSxLQUFQLEVBQWM2QixVQUFVLEVBQXhCLEVBQTRCd0IsSUFBSSxJQUFoQyxFQUFzQ2lELE1BQU0sRUFBNUMsRUFaSSxDQUFQO0FBYUgsS0E1TXFCO0FBNk10QkMsTUE3TXNCLGNBNk1uQmhGLElBN01tQixFQTZNYkMsY0E3TWEsRUE2TUc7QUFDckIsZUFBT0QsS0FBS00sUUFBTCxDQUFjYSxNQUFkLENBQXFCLFVBQUMwRCxLQUFELEVBQVFDLElBQVIsRUFBaUI7QUFDekMsb0JBQVFBLEtBQUszRSxJQUFiO0FBQ0kscUJBQUssUUFBTDtBQUNJMEUsMEJBQU0vQyxFQUFOLEdBQVdnRCxJQUFYO0FBQ0FELDBCQUFNSSxRQUFOLEdBQWlCLENBQUMsQ0FBQ0gsS0FBS3hFLFFBQUwsQ0FBY3FCLElBQWQsQ0FBbUI7QUFBQSwrQkFBS1QsRUFBRWYsSUFBRixJQUFVLGFBQWY7QUFBQSxxQkFBbkIsQ0FBbkI7QUFDQTtBQUNKO0FBQ0kwRSwwQkFBTXZFLFFBQU4sQ0FBZVEsSUFBZixDQUFvQmdFLElBQXBCO0FBTlI7QUFRQSxtQkFBT0QsS0FBUDtBQUNILFNBVk0sRUFVSixFQUFDcEcsTUFBTSxJQUFQLEVBQWE2QixVQUFVLEVBQXZCLEVBQTJCd0IsSUFBSSxJQUEvQixFQVZJLENBQVA7QUFXSCxLQXpOcUI7QUEwTnRCb0QsTUExTnNCLGNBME5uQmxGLElBMU5tQixFQTBOYkMsY0ExTmEsRUEwTkc7QUFDckIsZUFBT0QsS0FBS00sUUFBTCxDQUFjYSxNQUFkLENBQXFCLFVBQUMwRCxLQUFELEVBQVFDLElBQVIsRUFBaUI7QUFDekMsb0JBQVFBLEtBQUszRSxJQUFiO0FBQ0kscUJBQUssUUFBTDtBQUNJMEUsMEJBQU0vQyxFQUFOLEdBQVdnRCxJQUFYO0FBQ0E7QUFDSjtBQUNJRCwwQkFBTXZFLFFBQU4sQ0FBZVEsSUFBZixDQUFvQmdFLElBQXBCO0FBTFI7QUFPQSxtQkFBT0QsS0FBUDtBQUNILFNBVE0sRUFTSixFQUFDcEcsTUFBTSxJQUFQLEVBQWE2QixVQUFVLEVBQXZCLEVBQTJCd0IsSUFBSSxJQUEvQixFQVRJLENBQVA7QUFVSCxLQXJPcUI7QUFzT3RCcUQsWUF0T3NCLG9CQXNPYm5GLElBdE9hLEVBc09QQyxjQXRPTyxFQXNPUztBQUMzQixZQUFJbUYsTUFBTXBGLEtBQUtzQixPQUFMLENBQWEsTUFBYixDQUFWO0FBQ0EsWUFBSStELE9BQU9wRixlQUFlc0IsTUFBZixDQUFzQjZELEdBQXRCLENBQVg7O0FBRUEsWUFBSUUsV0FBV3JGLGVBQWVzRixNQUFmLEdBQXdCdEYsZUFBZTdCLElBQWYsVUFBMkJnSCxHQUEzQixRQUFtQzFHLElBQW5DLENBQXdDLFFBQXhDLENBQXZDO0FBQ0EsWUFBSThHLGNBQWN2RixlQUFlUixHQUFmLENBQW1CZ0csWUFBbkIseUJBQXNESCxRQUF0RCxTQUFvRTVHLElBQXBFLENBQXlFLGFBQXpFLENBQWxCO0FBQ0EsZUFBTyxFQUFDRCxNQUFNLE9BQVAsRUFBZ0I0RyxVQUFoQixFQUFzQkcsd0JBQXRCLEVBQVA7QUFDSCxLQTdPcUI7QUE4T3RCRSxlQTlPc0IsdUJBOE9WMUYsSUE5T1UsRUE4T0o7QUFDZCxlQUFPLEVBQUN2QixNQUFNLE9BQVAsRUFBUDtBQUNILEtBaFBxQjtBQWlQdEJrSCxTQWpQc0IsaUJBaVBoQjNGLElBalBnQixFQWlQVjtBQUNSLGVBQU8sRUFBQ3ZCLE1BQU0sT0FBUCxFQUFnQm1ILElBQUk1RixLQUFLc0IsT0FBTCxDQUFhLFdBQWIsQ0FBcEIsRUFBUDtBQUNILEtBblBxQjtBQW9QdEJ1RSxlQXBQc0IsdUJBb1BWN0YsSUFwUFUsRUFvUEo7QUFDZCxlQUFPLEVBQUN2QixNQUFNLGFBQVAsRUFBc0JtSCxJQUFJNUYsS0FBS3NCLE9BQUwsQ0FBYSxpQkFBYixDQUExQixFQUFQO0FBQ0gsS0F0UHFCO0FBdVB0QndFLE9BdlBzQixlQXVQbEI5RixJQXZQa0IsRUF1UFo7QUFDTixlQUFPO0FBQ0h2QixrQkFBTSxLQURIO0FBRUhtSCxnQkFBSTVGLEtBQUtzQixPQUFMLENBQWEsU0FBYixDQUZEO0FBR0h1RSx5QkFBYTdGLEtBQUtNLFFBQUwsQ0FBY3FCLElBQWQsQ0FBbUI7QUFBQSx1QkFBS1QsRUFBRWYsSUFBRixJQUFVLGlCQUFmO0FBQUEsYUFBbkIsRUFBcURtQixPQUFyRCxDQUE2RCxPQUE3RDtBQUhWLFNBQVA7QUFLSCxLQTdQcUI7QUE4UHRCeUUsZ0JBOVBzQiwwQkE4UFA7QUFDWCxlQUFPLElBQVA7QUFDSCxLQWhRcUI7QUFpUXRCQyxVQWpRc0Isa0JBaVFmaEcsSUFqUWUsRUFpUVRDLGNBalFTLEVBaVFPO0FBQ3pCLFlBQUlnRyxNQUFNaEcsZUFBZVYsT0FBZixDQUF1QlMsSUFBdkIsRUFBNkIyQixJQUE3QixDQUFrQyxlQUFsQyxDQUFWO0FBQ0EsWUFBSWxELE9BQU93SCxJQUFJdkgsSUFBSixDQUFTLFFBQVQsQ0FBWDtBQUNBLFlBQUl3SCxRQUFRRCxJQUFJdkgsSUFBSixDQUFTLE1BQVQsTUFBcUIsT0FBakM7QUFDQSxZQUFJMEcsTUFBTWEsSUFBSXZILElBQUosQ0FBUyxNQUFULENBQVY7QUFDQSxlQUFPLEVBQUNELE1BQU0sUUFBUCxFQUFpQnlILFlBQWpCLEVBQXdCQyxNQUFNMUgsSUFBOUIsRUFBb0M0RyxNQUFNcEYsZUFBZW1HLGVBQWYsQ0FBK0JoQixHQUEvQixDQUExQyxFQUFQO0FBQ0g7QUF2UXFCLENBQW5CIiwiZmlsZSI6Im9mZmljZURvY3VtZW50LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFBhcnQgZnJvbSBcIi4uL3BhcnRcIlxyXG5cclxuZXhwb3J0IGNsYXNzIE9mZmljZURvY3VtZW50IGV4dGVuZHMgUGFydCB7XHJcbiAgICBfaW5pdCgpIHtcclxuICAgICAgICBzdXBlci5faW5pdCgpXHJcbiAgICAgICAgY29uc3Qgc3VwcG9ydGVkID0gXCJzdHlsZXMsbnVtYmVyaW5nLHRoZW1lLHNldHRpbmdzXCIuc3BsaXQoXCIsXCIpXHJcbiAgICAgICAgdGhpcy5yZWxzKGBSZWxhdGlvbnNoaXBbVGFyZ2V0JD1cIi54bWxcIl1gKS5lYWNoKChpLCByZWwpID0+IHtcclxuICAgICAgICAgICAgbGV0ICQgPSB0aGlzLnJlbHMocmVsKVxyXG4gICAgICAgICAgICBsZXQgdHlwZSA9ICQuYXR0cihcIlR5cGVcIikuc3BsaXQoXCIvXCIpLnBvcCgpXHJcbiAgICAgICAgICAgIGlmIChzdXBwb3J0ZWQuaW5kZXhPZih0eXBlKSAhPSAtMSkge1xyXG4gICAgICAgICAgICAgICAgbGV0IHRhcmdldCA9ICQuYXR0cihcIlRhcmdldFwiKVxyXG4gICAgICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsIHR5cGUsIHtcclxuICAgICAgICAgICAgICAgICAgICBnZXQoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmdldFJlbE9iamVjdCh0YXJnZXQpXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICB9XHJcblxyXG4gICAgcmVuZGVyKGNyZWF0ZUVsZW1lbnQsIGlkZW50aWZ5ID0gT2ZmaWNlRG9jdW1lbnQuaWRlbnRpZnkpIHtcclxuICAgICAgICBpZiAodGhpcy5zdHlsZXMpXHJcbiAgICAgICAgICAgIHRoaXMucmVuZGVyTm9kZSh0aGlzLnN0eWxlcyhcIndcXFxcOnN0eWxlc1wiKS5nZXQoMCksIGNyZWF0ZUVsZW1lbnQsIGlkZW50aWZ5KVxyXG4gICAgICAgIGlmICh0aGlzLm51bWJlcmluZylcclxuICAgICAgICAgICAgdGhpcy5yZW5kZXJOb2RlKHRoaXMubnVtYmVyaW5nKFwid1xcXFw6bnVtYmVyaW5nXCIpLmdldCgwKSwgY3JlYXRlRWxlbWVudCwgaWRlbnRpZnkpXHJcbiAgICAgICAgcmV0dXJuIHRoaXMucmVuZGVyTm9kZSh0aGlzLmNvbnRlbnQoXCJ3XFxcXDpkb2N1bWVudFwiKS5nZXQoMCksIGNyZWF0ZUVsZW1lbnQsIGlkZW50aWZ5KVxyXG4gICAgfVxyXG5cclxuICAgIHBhcnNlKGRvbUhhbmRsZXIsIGlkZW50aWZ5ID0gT2ZmaWNlRG9jdW1lbnQuaWRlbnRpZnkpIHtcclxuICAgICAgICBjb25zdCBkb2MgPSB7fVxyXG4gICAgICAgIGNvbnN0IGNyZWF0ZUVsZW1lbnQgPSBkb21IYW5kbGVyLmNyZWF0ZUVsZW1lbnQuYmluZChkb21IYW5kbGVyKVxyXG5cclxuICAgICAgICBmdW5jdGlvbiBfaWRlbnRpZnkoKSB7XHJcbiAgICAgICAgICAgIGxldCBtb2RlbCA9IGlkZW50aWZ5KC4uLmFyZ3VtZW50cylcclxuICAgICAgICAgICAgaWYgKG1vZGVsICYmIHR5cGVvZihtb2RlbCkgPT0gXCJvYmplY3RcIikge1xyXG4gICAgICAgICAgICAgICAgZG9tSGFuZGxlci5lbWl0KFwiKlwiLCBtb2RlbCwgLi4uYXJndW1lbnRzKVxyXG4gICAgICAgICAgICAgICAgZG9tSGFuZGxlci5lbWl0KG1vZGVsLnR5cGUsIG1vZGVsLCAuLi5hcmd1bWVudHMpXHJcbiAgICAgICAgICAgICAgICBpZiAoZG9tSGFuZGxlcltgb24ke21vZGVsLnR5cGV9YF0pXHJcbiAgICAgICAgICAgICAgICAgICAgZG9tSGFuZGxlcltgb24ke21vZGVsLnR5cGV9YF0obW9kZWwsIC4uLmFyZ3VtZW50cylcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gbW9kZWxcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLnN0eWxlcylcclxuICAgICAgICAgICAgZG9jLnN0eWxlcyA9IHRoaXMucmVuZGVyTm9kZSh0aGlzLnN0eWxlcyhcIndcXFxcOnN0eWxlc1wiKS5nZXQoMCksIGNyZWF0ZUVsZW1lbnQsIF9pZGVudGlmeSlcclxuICAgICAgICBpZiAodGhpcy5udW1iZXJpbmcpXHJcbiAgICAgICAgICAgIGRvYy5udW1iZXJpbmcgPSB0aGlzLnJlbmRlck5vZGUodGhpcy5udW1iZXJpbmcoXCJ3XFxcXDpudW1iZXJpbmdcIikuZ2V0KDApLCBjcmVhdGVFbGVtZW50LCBfaWRlbnRpZnkpXHJcbiAgICAgICAgZG9jLmRvY3VtZW50ID0gdGhpcy5yZW5kZXJOb2RlKHRoaXMuY29udGVudChcIndcXFxcOmRvY3VtZW50XCIpLmdldCgwKSwgY3JlYXRlRWxlbWVudCwgX2lkZW50aWZ5KVxyXG4gICAgICAgIHJldHVybiBkb2NcclxuICAgIH1cclxuXHJcbiAgICBzdGF0aWMgaWRlbnRpZnkod1htbCwgb2ZmaWNlRG9jdW1lbnQpIHtcclxuICAgICAgICBjb25zdCB0YWcgPSB3WG1sLm5hbWUuc3BsaXQoXCI6XCIpLnBvcCgpXHJcbiAgICAgICAgaWYgKGlkZW50aXRpZXNbdGFnXSlcclxuICAgICAgICAgICAgcmV0dXJuIGlkZW50aXRpZXNbdGFnXSguLi5hcmd1bWVudHMpXHJcblxyXG4gICAgICAgIHJldHVybiB0YWdcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgT2ZmaWNlRG9jdW1lbnRcclxuXHJcbmV4cG9ydCBjb25zdCBpZGVudGl0aWVzID0ge1xyXG4gICAgZG9jdW1lbnQod1htbCwgb2ZmaWNlRG9jdW1lbnQpIHtcclxuICAgICAgICBsZXQgJCA9IG9mZmljZURvY3VtZW50LmNvbnRlbnRcclxuICAgICAgICBsZXQgY3VycmVudCA9IG51bGxcclxuICAgICAgICBsZXQgY2hpbGRyZW4gPSAkKFwid1xcXFw6c2VjdFByXCIpLmVhY2goKGksIHNlY3QpID0+IHtcclxuICAgICAgICAgICAgbGV0IGVuZCA9ICQoc2VjdCkuY2xvc2VzdCgnd1xcXFw6Ym9keT4qJylcclxuICAgICAgICAgICAgc2VjdC5jb250ZW50ID0gZW5kLnByZXZVbnRpbChjdXJyZW50KS50b0FycmF5KCkucmV2ZXJzZSgpXHJcbiAgICAgICAgICAgIGlmICghZW5kLmlzKHNlY3QpKVxyXG4gICAgICAgICAgICAgICAgc2VjdC5jb250ZW50LnB1c2goZW5kLmdldCgwKSlcclxuICAgICAgICAgICAgY3VycmVudCA9IGVuZFxyXG4gICAgICAgIH0pLnRvQXJyYXkoKVxyXG4gICAgICAgIHJldHVybiB7dHlwZTogXCJkb2N1bWVudFwiLCBjaGlsZHJlbn1cclxuICAgIH0sXHJcbiAgICBzZWN0UHIod1htbCwgb2ZmaWNlRG9jdW1lbnQpIHtcclxuICAgICAgICBjb25zdCBoZiA9IHR5cGUgPT4gd1htbC5jaGlsZHJlbi5maWx0ZXIoYSA9PiBhLm5hbWUgPT0gYHc6JHt0eXBlfVJlZmVyZW5jZWApLnJlZHVjZSgoaGVhZGVycywgYSkgPT4ge1xyXG4gICAgICAgICAgICBoZWFkZXJzLnNldChhLmF0dHJpYnNbXCJ3OnR5cGVcIl0sIG9mZmljZURvY3VtZW50LmdldFJlbChhLmF0dHJpYnNbXCJyOmlkXCJdKSlcclxuICAgICAgICAgICAgcmV0dXJuIGhlYWRlcnNcclxuICAgICAgICB9LCBuZXcgTWFwKCkpXHJcblxyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHR5cGU6IFwic2VjdGlvblwiLFxyXG4gICAgICAgICAgICBjaGlsZHJlbjogd1htbC5jb250ZW50LFxyXG4gICAgICAgICAgICBoZWFkZXJzOiBoZihcImhlYWRlclwiKSxcclxuICAgICAgICAgICAgZm9vdGVyczogaGYoXCJmb290ZXJcIiksXHJcbiAgICAgICAgICAgIGhhc1RpdGxlUGFnZTogISF3WG1sLmNoaWxkcmVuLmZpbmQoYSA9PiBhLm5hbWUgPT0gXCJ3OnRpdGxlUGdcIilcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG4gICAgcCh3WG1sLCBvZmZpY2VEb2N1bWVudCkge1xyXG4gICAgICAgIGxldCAkID0gb2ZmaWNlRG9jdW1lbnQuY29udGVudCh3WG1sKVxyXG4gICAgICAgIGxldCB0eXBlID0gXCJwXCJcclxuXHJcbiAgICAgICAgbGV0IGlkZW50aXR5ID0ge1xyXG4gICAgICAgICAgICB0eXBlLFxyXG4gICAgICAgICAgICBwcjogd1htbC5jaGlsZHJlbi5maW5kKCh7bmFtZX0pID0+IG5hbWUgPT0gXCJ3OnBQclwiKSxcclxuICAgICAgICAgICAgY2hpbGRyZW46IHdYbWwuY2hpbGRyZW4uZmlsdGVyKCh7bmFtZX0pID0+IG5hbWUgIT0gXCJ3OnBQclwiKVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IHBQciA9ICQuZmluZChcIndcXFxcOnBQclwiKVxyXG4gICAgICAgIGlmIChwUHIubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIGxldCBzdHlsZUlkID0gcFByLmZpbmQoXCJ3XFxcXDpwU3R5bGVcIikuYXR0cihcInc6dmFsXCIpXHJcblxyXG4gICAgICAgICAgICBsZXQgbnVtUHIgPSBwUHIuZmluZChcIndcXFxcOm51bVByPndcXFxcOm51bUlkXCIpXHJcbiAgICAgICAgICAgIGlmICghbnVtUHIubGVuZ3RoICYmIHN0eWxlSWQpIHtcclxuICAgICAgICAgICAgICAgIG51bVByID0gb2ZmaWNlRG9jdW1lbnQuc3R5bGVzKGB3XFxcXDpzdHlsZVt3XFxcXDpzdHlsZUlkPVwiJHtzdHlsZUlkfVwiXSB3XFxcXDpudW1Qcj53XFxcXDpudW1JZGApXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChudW1Qci5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgIGlkZW50aXR5LnR5cGUgPSBcImxpc3RcIlxyXG4gICAgICAgICAgICAgICAgaWRlbnRpdHkubnVtSWQgPSBudW1Qci5maW5kKFwid1xcXFw6bnVtSWRcIikuYXR0cihcInc6dmFsXCIpXHJcbiAgICAgICAgICAgICAgICBpZGVudGl0eS5sZXZlbCA9IG51bVByLmZpbmQoXCJ3XFxcXDppbHZsXCIpLmF0dHIoXCJ3OnZhbFwiKVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgbGV0IG91dGxpbmVMdmwgPSBwUHIuZmluZChcIndcXFxcOm91dGxpbmVMdmxcIikuYXR0cihcInc6dmFsXCIpXHJcbiAgICAgICAgICAgICAgICBpZiAoIW91dGxpbmVMdmwgJiYgc3R5bGVJZClcclxuICAgICAgICAgICAgICAgICAgICBvdXRsaW5lTHZsID0gb2ZmaWNlRG9jdW1lbnQuc3R5bGVzKGB3XFxcXDpzdHlsZVt3XFxcXDpzdHlsZUlkPVwiJHtzdHlsZUlkfVwiXSB3XFxcXDpvdXRsaW5lTHZsYCkuYXR0cihcInc6dmFsXCIpXHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKG91dGxpbmVMdmwpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZGVudGl0eS50eXBlID0gXCJoZWFkaW5nXCJcclxuICAgICAgICAgICAgICAgICAgICBpZGVudGl0eS5sZXZlbCA9IHBhcnNlSW50KG91dGxpbmVMdmwpICsgMVxyXG4gICAgICAgICAgICAgICAgICAgIGlkZW50aXR5LnN0eWxlSWQgPSBzdHlsZUlkXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgaWRlbnRpdHkud3QgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAkLmZpbmQoJ3dcXFxcOnQnKS5tYXAoZnVuY3Rpb24gKGluZGV4LCBlbGVtZW50KSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZWxlbWVudC5jaGlsZHJlbjtcclxuICAgICAgICAgICAgfSkuZ2V0KCk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGlkZW50aXR5XHJcbiAgICB9LFxyXG4gICAgcih3WG1sLCBvZmZpY2VEb2N1bWVudCkge1xyXG4gICAgICAgIGxldCAkID0gb2ZmaWNlRG9jdW1lbnQuY29udGVudCh3WG1sKTtcclxuICAgICAgICBsZXQgclByID0gd1htbC5jaGlsZHJlbi5maW5kKCh7bmFtZX0pID0+IG5hbWUgPT0gXCJ3OnJQclwiKSB8fCBbXVxyXG4gICAgICAgIHZhciBwYXJlbnRfcFByX3JQciA9ICQucGFyZW50KFwid1xcXFw6cFwiKS5maW5kKFwid1xcXFw6cFByPndcXFxcOnJQclwiKS5nZXQoKTtcclxuXHJcbiAgICAgICAgaWYgKHBhcmVudF9wUHJfclByLmxlbmd0aCkge1xyXG4gICAgICAgICAgICBpZihyUHIubGVuZ3RoKVxyXG4gICAgICAgICAgICAgICAgclByLmNvbmNhdChwYXJlbnRfcFByX3JQcilcclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgclByID0gcGFyZW50X3BQcl9yUHJcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHt0eXBlOiBcInJcIiwgcHI6IHJQciwgY2hpbGRyZW46IHdYbWwuY2hpbGRyZW4uZmlsdGVyKCh7bmFtZX0pID0+IG5hbWUgIT0gXCJ3OnJQclwiKSB8fCBbXX1cclxuICAgIH0sXHJcbiAgICBmbGRDaGFyKHdYbWwsIG9mZmljZURvY3VtZW50KSB7XHJcbiAgICAgICAgcmV0dXJuIHdYbWwuYXR0cmlic1tcInc6ZmxkQ2hhclR5cGVcIl1cclxuICAgIH0sXHJcblxyXG4gICAgaW5saW5lKHdYbWwsIG9mZmljZURvY3VtZW50KSB7XHJcbiAgICAgICAgbGV0ICQgPSBvZmZpY2VEb2N1bWVudC5jb250ZW50KHdYbWwpXHJcbiAgICAgICAgcmV0dXJuIHt0eXBlOiBgZHJhd2luZy5pbmxpbmVgLCBjaGlsZHJlbjogJC5maW5kKCdhXFxcXDpncmFwaGljPmFcXFxcOmdyYXBoaWNEYXRhJykuY2hpbGRyZW4oKS50b0FycmF5KCl9XHJcbiAgICB9LFxyXG4gICAgYW5jaG9yKHdYbWwsIG9mZmljZURvY3VtZW50KSB7XHJcbiAgICAgICAgbGV0ICQgPSBvZmZpY2VEb2N1bWVudC5jb250ZW50KHdYbWwpXHJcbiAgICAgICAgbGV0IGdyYXBoaWNEYXRhID0gJC5maW5kKCdhXFxcXDpncmFwaGljPmFcXFxcOmdyYXBoaWNEYXRhJylcclxuICAgICAgICBsZXQgdHlwZSA9IGdyYXBoaWNEYXRhLmF0dHIoXCJ1cmlcIikuc3BsaXQoXCIvXCIpLnBvcCgpXHJcbiAgICAgICAgbGV0IGNoaWxkcmVuID0gZ3JhcGhpY0RhdGEuY2hpbGRyZW4oKS50b0FycmF5KClcclxuICAgICAgICBpZiAodHlwZSA9PSBcIndvcmRwcm9jZXNzaW5nR3JvdXBcIilcclxuICAgICAgICAgICAgY2hpbGRyZW4gPSBjaGlsZHJlblswXS5jaGlsZHJlbi5maWx0ZXIoYSA9PiBhLm5hbWUuc3BsaXQoXCI6XCIpWzBdICE9IFwid3BnXCIpXHJcblxyXG4gICAgICAgIHJldHVybiB7dHlwZTogXCJkcmF3aW5nLmFuY2hvclwiLCBjaGlsZHJlbn1cclxuICAgIH0sXHJcbiAgICBwaWMod1htbCwgb2ZmaWNlRG9jdW1lbnQpIHtcclxuICAgICAgICBsZXQgYmxpcCA9IG9mZmljZURvY3VtZW50LmNvbnRlbnQod1htbCkuZmluZChcImFcXFxcOmJsaXBcIilcclxuICAgICAgICBsZXQgcmlkID0gYmxpcC5hdHRyKCdyOmVtYmVkJykgfHwgYmxpcC5hdHRyKCdyOmxpbmsnKVxyXG4gICAgICAgIHJldHVybiB7dHlwZTogXCJwaWN0dXJlXCIsIC4uLm9mZmljZURvY3VtZW50LmdldFJlbChyaWQpfVxyXG4gICAgfSxcclxuICAgIHdzcCh3WG1sLCBvZmZpY2VEb2N1bWVudCkge1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHR5cGU6IFwic2hhcGVcIixcclxuICAgICAgICAgICAgY2hpbGRyZW46IG9mZmljZURvY3VtZW50LmNvbnRlbnQod1htbCkuZmluZChcIj53cHNcXFxcOnR4Yng+d1xcXFw6dHhieENvbnRlbnRcIikuY2hpbGRyZW4oKS50b0FycmF5KClcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG4gICAgRmFsbGJhY2soKSB7XHJcbiAgICAgICAgcmV0dXJuIG51bGxcclxuICAgIH0sXHJcbiAgICBzZHQod1htbCwgb2ZmaWNlRG9jdW1lbnQpIHtcclxuICAgICAgICBsZXQgJCA9IG9mZmljZURvY3VtZW50LmNvbnRlbnQod1htbClcclxuICAgICAgICBsZXQgcHIgPSAkLmZpbmQoJz53XFxcXDpzZHRQcicpXHJcbiAgICAgICAgbGV0IGNvbnRlbnQgPSAkLmZpbmQoJz53XFxcXDpzZHRDb250ZW50JylcclxuICAgICAgICBsZXQgY2hpbGRyZW4gPSBjb250ZW50LmNoaWxkcmVuKCkudG9BcnJheSgpXHJcblxyXG4gICAgICAgIGxldCBlbEJpbmRpbmcgPSBwci5maW5kKCd3XFxcXDpkYXRhQmluZGluZycpLmdldCgwKVxyXG4gICAgICAgIGlmIChlbEJpbmRpbmcpIHsvL3Byb3BlcnRpZXNcclxuICAgICAgICAgICAgbGV0IHBhdGggPSBlbEJpbmRpbmcuYXR0cmlic1sndzp4cGF0aCddLFxyXG4gICAgICAgICAgICAgICAgZCA9IHBhdGguc3BsaXQoL1tcXC9cXDpcXFtdLyksXHJcbiAgICAgICAgICAgICAgICBuYW1lID0gKGQucG9wKCksIGQucG9wKCkpO1xyXG4gICAgICAgICAgICBsZXQgdmFsdWUgPSBjb250ZW50LnRleHQoKVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHt0eXBlOiBcInByb3BlcnR5XCIsIG5hbWUsIHZhbHVlLCBjaGlsZHJlbn1cclxuICAgICAgICB9IGVsc2Ugey8vY29udHJvbHNcclxuICAgICAgICAgICAgbGV0IHByQ2hpbGRyZW4gPSBwci5nZXQoMCkuY2hpbGRyZW5cclxuICAgICAgICAgICAgbGV0IGVsVHlwZSA9IHByQ2hpbGRyZW5bcHJDaGlsZHJlbi5sZW5ndGggLSAxXVxyXG4gICAgICAgICAgICBsZXQgbmFtZSA9IGVsVHlwZS5uYW1lLnNwbGl0KFwiOlwiKS5wb3AoKVxyXG4gICAgICAgICAgICBsZXQgdHlwZSA9IFwidGV4dCxwaWN0dXJlLGRvY1BhcnRMaXN0LGNvbWJvQm94LGRyb3BEb3duTGlzdCxkYXRlLGNoZWNrYm94LHJlcGVhdGluZ1NlY3Rpb24scmVwZWF0aW5nU2VjdGlvbkl0ZW1cIi5zcGxpdChcIixcIilcclxuICAgICAgICAgICAgICAgIC5maW5kKGEgPT4gYSA9PSBuYW1lKVxyXG4gICAgICAgICAgICBsZXQgbW9kZWwgPSB7Y2hpbGRyZW59XHJcbiAgICAgICAgICAgIGlmICh0eXBlKSB7XHJcbiAgICAgICAgICAgICAgICBtb2RlbC50eXBlID0gYGNvbnRyb2wuJHt0eXBlfWBcclxuICAgICAgICAgICAgfSBlbHNlIHsvL2NvbnRhaW5lclxyXG4gICAgICAgICAgICAgICAgaWYgKGNvbnRlbnQuZmluZChcIndcXFxcOnAsd1xcXFw6dGJsLHdcXFxcOnRyLHdcXFxcOnRjXCIpLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgICAgIG1vZGVsLnR5cGUgPSBcImJsb2NrXCJcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbW9kZWwudHlwZSA9IFwiaW5saW5lXCJcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgJCA9IG9mZmljZURvY3VtZW50LmNvbnRlbnRcclxuICAgICAgICAgICAgc3dpdGNoIChtb2RlbC50eXBlKSB7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwiY29udHJvbC5kcm9wRG93bkxpc3RcIjpcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJjb250cm9sLmNvbWJvQm94XCI6IHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgc2VsZWN0ZWQgPSAkKGNvbnRlbnQpLnRleHQoKVxyXG4gICAgICAgICAgICAgICAgICAgIG1vZGVsLm9wdGlvbnMgPSAkKGVsVHlwZSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgLmZpbmQoXCJ3XFxcXDpsaXN0SXRlbVwiKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAubWFwKChpLCBsaSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaXNwbGF5VGV4dDogbGkuYXR0cmlic1tcInc6ZGlzcGxheVRleHRcIl0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGxpLmF0dHJpYnNbXCJ3OnZhbHVlXCJdXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5nZXQoKVxyXG4gICAgICAgICAgICAgICAgICAgIG1vZGVsLnZhbHVlID0gKG1vZGVsLm9wdGlvbnMuZmluZChhID0+IGEuZGlzcGxheVRleHQgPT0gc2VsZWN0ZWQpIHx8IHt9KS52YWx1ZVxyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwiY29udHJvbC5jaGVja2JveFwiOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IG5zID0gZWxUeXBlLm5hbWUuc3BsaXQoXCI6XCIpWzBdXHJcbiAgICAgICAgICAgICAgICAgICAgbW9kZWwuY2hlY2tlZCA9ICQoZWxUeXBlKS5maW5kKGAke25zfVxcXFw6Y2hlY2tlZGApLmF0dHIoYCR7bnN9OnZhbGApID09IFwiMVwiXHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGNhc2UgXCJjb250cm9sLnRleHRcIjpcclxuICAgICAgICAgICAgICAgICAgICBpZiAoY29udGVudC5maW5kKCd3XFxcXDpyIFt3XFxcXDp2YWx+PVBsYWNlaG9sZGVyXScpLmxlbmd0aCA9PSAwKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBtb2RlbC52YWx1ZSA9IGNvbnRlbnQudGV4dCgpXHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJjb250cm9sLmRhdGVcIjpcclxuICAgICAgICAgICAgICAgICAgICBtb2RlbC52YWx1ZSA9IG5ldyBEYXRlKCQoZWxUeXBlKS5hdHRyKFwidzpmdWxsRGF0ZVwiKSlcclxuICAgICAgICAgICAgICAgICAgICBtb2RlbC5mb3JtYXQgPSAkKGVsVHlwZSkuZmluZChcIndcXFxcOmRhdGVGb3JtYXRcIikuYXR0cihcInc6dmFsXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgbW9kZWwubG9jYWxlID0gJChlbFR5cGUpLmZpbmQoXCJ3XFxcXDpsaWRcIikuYXR0cihcInc6dmFsXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gbW9kZWxcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG4gICAgaHlwZXJsaW5rKHdYbWwsIG9mZmljZURvY3VtZW50KSB7XHJcbiAgICAgICAgaWYgKHdYbWwuYXR0cmlic1tcInI6aWRcIl0pIHtcclxuICAgICAgICAgICAgbGV0IHVybCA9IG9mZmljZURvY3VtZW50LmdldFJlbCh3WG1sLmF0dHJpYnNbXCJyOmlkXCJdKVxyXG4gICAgICAgICAgICByZXR1cm4ge3R5cGU6IFwiaHlwZXJsaW5rXCIsIHVybH07XHJcbiAgICAgICAgfSBlbHNlIGlmICh3WG1sLmF0dHJpYnNbJ3c6YW5jaG9yJ10pIHtcclxuICAgICAgICAgICAgbGV0IG5hbWUgPSB3WG1sLmF0dHJpYnNbJ3c6YW5jaG9yJ107IC8vVE9ET1xyXG4gICAgICAgICAgICByZXR1cm4ge3R5cGU6ICdhbmNob3InLCBuYW1lfTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG4gICAgdGJsKHdYbWwsIG9mZmljZURvY3VtZW50KSB7XHJcbiAgICAgICAgcmV0dXJuIHdYbWwuY2hpbGRyZW4ucmVkdWNlKChzdGF0ZSwgbm9kZSkgPT4ge1xyXG4gICAgICAgICAgICBzd2l0Y2ggKG5vZGUubmFtZSkge1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcInc6dGJsUHJcIjpcclxuICAgICAgICAgICAgICAgICAgICBzdGF0ZS5wciA9IG5vZGVcclxuICAgICAgICAgICAgICAgICAgICBicmVha1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcInc6dGJsR3JpZFwiOlxyXG4gICAgICAgICAgICAgICAgICAgIHN0YXRlLmNvbHMgPSBub2RlLmNoaWxkcmVuXHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcclxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICAgICAgc3RhdGUuY2hpbGRyZW4ucHVzaChub2RlKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBzdGF0ZVxyXG4gICAgICAgIH0sIHt0eXBlOiBcInRibFwiLCBjaGlsZHJlbjogW10sIHByOiBudWxsLCBjb2xzOiBbXX0pXHJcbiAgICB9LFxyXG4gICAgdHIod1htbCwgb2ZmaWNlRG9jdW1lbnQpIHtcclxuICAgICAgICByZXR1cm4gd1htbC5jaGlsZHJlbi5yZWR1Y2UoKHN0YXRlLCBub2RlKSA9PiB7XHJcbiAgICAgICAgICAgIHN3aXRjaCAobm9kZS5uYW1lKSB7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwidzp0clByXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgc3RhdGUucHIgPSBub2RlXHJcbiAgICAgICAgICAgICAgICAgICAgc3RhdGUuaXNIZWFkZXIgPSAhIW5vZGUuY2hpbGRyZW4uZmluZChhID0+IGEubmFtZSA9PSBcInc6dGJsSGVhZGVyXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcclxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICAgICAgc3RhdGUuY2hpbGRyZW4ucHVzaChub2RlKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBzdGF0ZVxyXG4gICAgICAgIH0sIHt0eXBlOiBcInRyXCIsIGNoaWxkcmVuOiBbXSwgcHI6IG51bGx9KVxyXG4gICAgfSxcclxuICAgIHRjKHdYbWwsIG9mZmljZURvY3VtZW50KSB7XHJcbiAgICAgICAgcmV0dXJuIHdYbWwuY2hpbGRyZW4ucmVkdWNlKChzdGF0ZSwgbm9kZSkgPT4ge1xyXG4gICAgICAgICAgICBzd2l0Y2ggKG5vZGUubmFtZSkge1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcInc6dGNQclwiOlxyXG4gICAgICAgICAgICAgICAgICAgIHN0YXRlLnByID0gbm9kZVxyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXHJcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgICAgIHN0YXRlLmNoaWxkcmVuLnB1c2gobm9kZSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gc3RhdGVcclxuICAgICAgICB9LCB7dHlwZTogXCJ0Y1wiLCBjaGlsZHJlbjogW10sIHByOiBudWxsfSlcclxuICAgIH0sXHJcbiAgICBhbHRDaHVuayh3WG1sLCBvZmZpY2VEb2N1bWVudCkge1xyXG4gICAgICAgIGxldCBySWQgPSB3WG1sLmF0dHJpYnNbJ3I6aWQnXVxyXG4gICAgICAgIGxldCBkYXRhID0gb2ZmaWNlRG9jdW1lbnQuZ2V0UmVsKHJJZClcclxuXHJcbiAgICAgICAgbGV0IHBhcnROYW1lID0gb2ZmaWNlRG9jdW1lbnQuZm9sZGVyICsgb2ZmaWNlRG9jdW1lbnQucmVscyhgW0lkPSR7cklkfV1gKS5hdHRyKFwiVGFyZ2V0XCIpXHJcbiAgICAgICAgbGV0IGNvbnRlbnRUeXBlID0gb2ZmaWNlRG9jdW1lbnQuZG9jLmNvbnRlbnRUeXBlcyhgT3ZlcnJpZGVbUGFydE5hbWU9JyR7cGFydE5hbWV9J11gKS5hdHRyKFwiQ29udGVudFR5cGVcIilcclxuICAgICAgICByZXR1cm4ge3R5cGU6IFwiY2h1bmtcIiwgZGF0YSwgY29udGVudFR5cGV9XHJcbiAgICB9LFxyXG4gICAgZG9jRGVmYXVsdHMod1htbCkge1xyXG4gICAgICAgIHJldHVybiB7dHlwZTogXCJzdHlsZVwifVxyXG4gICAgfSxcclxuICAgIHN0eWxlKHdYbWwpIHtcclxuICAgICAgICByZXR1cm4ge3R5cGU6IFwic3R5bGVcIiwgaWQ6IHdYbWwuYXR0cmlic1sndzpzdHlsZUlkJ119XHJcbiAgICB9LFxyXG4gICAgYWJzdHJhY3ROdW0od1htbCkge1xyXG4gICAgICAgIHJldHVybiB7dHlwZTogXCJhYnN0cmFjdE51bVwiLCBpZDogd1htbC5hdHRyaWJzW1widzphYnN0cmFjdE51bUlkXCJdfVxyXG4gICAgfSxcclxuICAgIG51bSh3WG1sKSB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgdHlwZTogXCJudW1cIixcclxuICAgICAgICAgICAgaWQ6IHdYbWwuYXR0cmlic1tcInc6bnVtSWRcIl0sXHJcbiAgICAgICAgICAgIGFic3RyYWN0TnVtOiB3WG1sLmNoaWxkcmVuLmZpbmQoYSA9PiBhLm5hbWUgPT0gXCJ3OmFic3RyYWN0TnVtSWRcIikuYXR0cmlic1tcInc6dmFsXCJdXHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIGxhdGVudFN0eWxlcygpIHtcclxuICAgICAgICByZXR1cm4gbnVsbFxyXG4gICAgfSxcclxuICAgIG9iamVjdCh3WG1sLCBvZmZpY2VEb2N1bWVudCkge1xyXG4gICAgICAgIGxldCBvbGUgPSBvZmZpY2VEb2N1bWVudC5jb250ZW50KHdYbWwpLmZpbmQoXCJvXFxcXDpPTEVPYmplY3RcIilcclxuICAgICAgICBsZXQgdHlwZSA9IG9sZS5hdHRyKFwiUHJvZ0lEXCIpXHJcbiAgICAgICAgbGV0IGVtYmVkID0gb2xlLmF0dHIoXCJUeXBlXCIpID09PSBcIkVtYmVkXCJcclxuICAgICAgICBsZXQgcklkID0gb2xlLmF0dHIoXCJyOmlkXCIpXHJcbiAgICAgICAgcmV0dXJuIHt0eXBlOiBcIm9iamVjdFwiLCBlbWJlZCwgcHJvZzogdHlwZSwgZGF0YTogb2ZmaWNlRG9jdW1lbnQuZ2V0UmVsT2xlT2JqZWN0KHJJZCl9XHJcbiAgICB9XHJcbn1cclxuIl19