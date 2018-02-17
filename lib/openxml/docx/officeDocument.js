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

        var rPr = [];
        $.children("w\\:rPr").each(function (i, rPrElem) {
            rPr.push(rPrElem);
        });

        $.parent("w\\:p").find("w\\:pPr>w\\:rPr").each(function (index, elem) {
            rPr.push(elem);
        });

        return { type: "r", pr: rPr, children: wXml.children.filter(function (_ref3) {
                var name = _ref3.name;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9vcGVueG1sL2RvY3gvb2ZmaWNlRG9jdW1lbnQuanMiXSwibmFtZXMiOlsiT2ZmaWNlRG9jdW1lbnQiLCJzdXBwb3J0ZWQiLCJzcGxpdCIsInJlbHMiLCJlYWNoIiwiaSIsInJlbCIsIiQiLCJ0eXBlIiwiYXR0ciIsInBvcCIsImluZGV4T2YiLCJ0YXJnZXQiLCJPYmplY3QiLCJkZWZpbmVQcm9wZXJ0eSIsImdldCIsImdldFJlbE9iamVjdCIsImNyZWF0ZUVsZW1lbnQiLCJpZGVudGlmeSIsInN0eWxlcyIsInJlbmRlck5vZGUiLCJudW1iZXJpbmciLCJjb250ZW50IiwiZG9tSGFuZGxlciIsImRvYyIsImJpbmQiLCJfaWRlbnRpZnkiLCJtb2RlbCIsImFyZ3VtZW50cyIsImVtaXQiLCJkb2N1bWVudCIsIndYbWwiLCJvZmZpY2VEb2N1bWVudCIsInRhZyIsIm5hbWUiLCJpZGVudGl0aWVzIiwiY3VycmVudCIsImNoaWxkcmVuIiwic2VjdCIsImVuZCIsImNsb3Nlc3QiLCJwcmV2VW50aWwiLCJ0b0FycmF5IiwicmV2ZXJzZSIsImlzIiwicHVzaCIsInNlY3RQciIsImhmIiwiZmlsdGVyIiwiYSIsInJlZHVjZSIsImhlYWRlcnMiLCJzZXQiLCJhdHRyaWJzIiwiZ2V0UmVsIiwiTWFwIiwiZm9vdGVycyIsImhhc1RpdGxlUGFnZSIsImZpbmQiLCJwIiwiaWRlbnRpdHkiLCJwciIsInBQciIsImxlbmd0aCIsInN0eWxlSWQiLCJudW1QciIsIm51bUlkIiwibGV2ZWwiLCJvdXRsaW5lTHZsIiwicGFyc2VJbnQiLCJ3dCIsIm1hcCIsImluZGV4IiwiZWxlbWVudCIsInIiLCJyUHIiLCJyUHJFbGVtIiwicGFyZW50IiwiZWxlbSIsImZsZENoYXIiLCJpbmxpbmUiLCJhbmNob3IiLCJncmFwaGljRGF0YSIsInBpYyIsImJsaXAiLCJyaWQiLCJ3c3AiLCJGYWxsYmFjayIsInNkdCIsImVsQmluZGluZyIsInBhdGgiLCJkIiwidmFsdWUiLCJ0ZXh0IiwicHJDaGlsZHJlbiIsImVsVHlwZSIsInNlbGVjdGVkIiwib3B0aW9ucyIsImxpIiwiZGlzcGxheVRleHQiLCJucyIsImNoZWNrZWQiLCJEYXRlIiwiZm9ybWF0IiwibG9jYWxlIiwiaHlwZXJsaW5rIiwidXJsIiwidGJsIiwic3RhdGUiLCJub2RlIiwiY29scyIsInRyIiwiaXNIZWFkZXIiLCJ0YyIsImFsdENodW5rIiwicklkIiwiZGF0YSIsInBhcnROYW1lIiwiZm9sZGVyIiwiY29udGVudFR5cGUiLCJjb250ZW50VHlwZXMiLCJkb2NEZWZhdWx0cyIsInN0eWxlIiwiaWQiLCJhYnN0cmFjdE51bSIsIm51bSIsImxhdGVudFN0eWxlcyIsIm9iamVjdCIsIm9sZSIsImVtYmVkIiwicHJvZyIsImdldFJlbE9sZU9iamVjdCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7Ozs7Ozs7Ozs7OztJQUVhQSxjLFdBQUFBLGM7Ozs7Ozs7Ozs7O2dDQUNEO0FBQUE7O0FBQ0o7QUFDQSxnQkFBTUMsWUFBWSxrQ0FBa0NDLEtBQWxDLENBQXdDLEdBQXhDLENBQWxCO0FBQ0EsaUJBQUtDLElBQUwsbUNBQTBDQyxJQUExQyxDQUErQyxVQUFDQyxDQUFELEVBQUlDLEdBQUosRUFBWTtBQUN2RCxvQkFBSUMsSUFBSSxPQUFLSixJQUFMLENBQVVHLEdBQVYsQ0FBUjtBQUNBLG9CQUFJRSxPQUFPRCxFQUFFRSxJQUFGLENBQU8sTUFBUCxFQUFlUCxLQUFmLENBQXFCLEdBQXJCLEVBQTBCUSxHQUExQixFQUFYO0FBQ0Esb0JBQUlULFVBQVVVLE9BQVYsQ0FBa0JILElBQWxCLEtBQTJCLENBQUMsQ0FBaEMsRUFBbUM7QUFDL0Isd0JBQUlJLFNBQVNMLEVBQUVFLElBQUYsQ0FBTyxRQUFQLENBQWI7QUFDQUksMkJBQU9DLGNBQVAsU0FBNEJOLElBQTVCLEVBQWtDO0FBQzlCTywyQkFEOEIsaUJBQ3hCO0FBQ0YsbUNBQU8sS0FBS0MsWUFBTCxDQUFrQkosTUFBbEIsQ0FBUDtBQUNIO0FBSDZCLHFCQUFs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c0IsT0FBTCxDQUFhLGlCQUFiLENBQTFCLEVBQVA7QUFDSCxLQXZQcUI7QUF3UHRCd0UsT0F4UHNCLGVBd1BsQjlGLElBeFBrQixFQXdQWjtBQUNOLGVBQU87QUFDSHZCLGtCQUFNLEtBREg7QUFFSG1ILGdCQUFJNUYsS0FBS3NCLE9BQUwsQ0FBYSxTQUFiLENBRkQ7QUFHSHVFLHlCQUFhN0YsS0FBS00sUUFBTCxDQUFjcUIsSUFBZCxDQUFtQjtBQUFBLHVCQUFLVCxFQUFFZixJQUFGLElBQVUsaUJBQWY7QUFBQSxhQUFuQixFQUFxRG1CLE9BQXJELENBQTZELE9BQTdEO0FBSFYsU0FBUDtBQUtILEtBOVBxQjtBQStQdEJ5RSxnQkEvUHNCLDBCQStQUDtBQUNYLGVBQU8sSUFBUDtBQUNILEtBalFxQjtBQWtRdEJDLFVBbFFzQixrQkFrUWZoRyxJQWxRZSxFQWtRVEMsY0FsUVMsRUFrUU87QUFDekIsWUFBSWdHLE1BQU1oRyxlQUFlVixPQUFmLENBQXVCUyxJQUF2QixFQUE2QjJCLElBQTdCLENBQWtDLGVBQWxDLENBQVY7QUFDQSxZQUFJbEQsT0FBT3dILElBQUl2SCxJQUFKLENBQVMsUUFBVCxDQUFYO0FBQ0EsWUFBSXdILFFBQVFELElBQUl2SCxJQUFKLENBQVMsTUFBVCxNQUFxQixPQUFqQztBQUNBLFlBQUkwRyxNQUFNYSxJQUFJdkgsSUFBSixDQUFTLE1BQVQsQ0FBVjtBQUNBLGVBQU8sRUFBQ0QsTUFBTSxRQUFQLEVBQWlCeUgsWUFBakIsRUFBd0JDLE1BQU0xSCxJQUE5QixFQUFvQzRHLE1BQU1wRixlQUFlbUcsZUFBZixDQUErQmhCLEdBQS9CLENBQTFDLEVBQVA7QUFDSDtBQXhRcUIsQ0FBbkIiLCJmaWxlIjoib2ZmaWNlRG9jdW1lbnQuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUGFydCBmcm9tIFwiLi4vcGFydFwiXHJcblxyXG5leHBvcnQgY2xhc3MgT2ZmaWNlRG9jdW1lbnQgZXh0ZW5kcyBQYXJ0IHtcclxuICAgIF9pbml0KCkge1xyXG4gICAgICAgIHN1cGVyLl9pbml0KClcclxuICAgICAgICBjb25zdCBzdXBwb3J0ZWQgPSBcInN0eWxlcyxudW1iZXJpbmcsdGhlbWUsc2V0dGluZ3NcIi5zcGxpdChcIixcIilcclxuICAgICAgICB0aGlzLnJlbHMoYFJlbGF0aW9uc2hpcFtUYXJnZXQkPVwiLnhtbFwiXWApLmVhY2goKGksIHJlbCkgPT4ge1xyXG4gICAgICAgICAgICBsZXQgJCA9IHRoaXMucmVscyhyZWwpXHJcbiAgICAgICAgICAgIGxldCB0eXBlID0gJC5hdHRyKFwiVHlwZVwiKS5zcGxpdChcIi9cIikucG9wKClcclxuICAgICAgICAgICAgaWYgKHN1cHBvcnRlZC5pbmRleE9mKHR5cGUpICE9IC0xKSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgdGFyZ2V0ID0gJC5hdHRyKFwiVGFyZ2V0XCIpXHJcbiAgICAgICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgdHlwZSwge1xyXG4gICAgICAgICAgICAgICAgICAgIGdldCgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0UmVsT2JqZWN0KHRhcmdldClcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgIH1cclxuXHJcbiAgICByZW5kZXIoY3JlYXRlRWxlbWVudCwgaWRlbnRpZnkgPSBPZmZpY2VEb2N1bWVudC5pZGVudGlmeSkge1xyXG4gICAgICAgIGlmICh0aGlzLnN0eWxlcylcclxuICAgICAgICAgICAgdGhpcy5yZW5kZXJOb2RlKHRoaXMuc3R5bGVzKFwid1xcXFw6c3R5bGVzXCIpLmdldCgwKSwgY3JlYXRlRWxlbWVudCwgaWRlbnRpZnkpXHJcbiAgICAgICAgaWYgKHRoaXMubnVtYmVyaW5nKVxyXG4gICAgICAgICAgICB0aGlzLnJlbmRlck5vZGUodGhpcy5udW1iZXJpbmcoXCJ3XFxcXDpudW1iZXJpbmdcIikuZ2V0KDApLCBjcmVhdGVFbGVtZW50LCBpZGVudGlmeSlcclxuICAgICAgICByZXR1cm4gdGhpcy5yZW5kZXJOb2RlKHRoaXMuY29udGVudChcIndcXFxcOmRvY3VtZW50XCIpLmdldCgwKSwgY3JlYXRlRWxlbWVudCwgaWRlbnRpZnkpXHJcbiAgICB9XHJcblxyXG4gICAgcGFyc2UoZG9tSGFuZGxlciwgaWRlbnRpZnkgPSBPZmZpY2VEb2N1bWVudC5pZGVudGlmeSkge1xyXG4gICAgICAgIGNvbnN0IGRvYyA9IHt9XHJcbiAgICAgICAgY29uc3QgY3JlYXRlRWxlbWVudCA9IGRvbUhhbmRsZXIuY3JlYXRlRWxlbWVudC5iaW5kKGRvbUhhbmRsZXIpXHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIF9pZGVudGlmeSgpIHtcclxuICAgICAgICAgICAgbGV0IG1vZGVsID0gaWRlbnRpZnkoLi4uYXJndW1lbnRzKVxyXG4gICAgICAgICAgICBpZiAobW9kZWwgJiYgdHlwZW9mKG1vZGVsKSA9PSBcIm9iamVjdFwiKSB7XHJcbiAgICAgICAgICAgICAgICBkb21IYW5kbGVyLmVtaXQoXCIqXCIsIG1vZGVsLCAuLi5hcmd1bWVudHMpXHJcbiAgICAgICAgICAgICAgICBkb21IYW5kbGVyLmVtaXQobW9kZWwudHlwZSwgbW9kZWwsIC4uLmFyZ3VtZW50cylcclxuICAgICAgICAgICAgICAgIGlmIChkb21IYW5kbGVyW2BvbiR7bW9kZWwudHlwZX1gXSlcclxuICAgICAgICAgICAgICAgICAgICBkb21IYW5kbGVyW2BvbiR7bW9kZWwudHlwZX1gXShtb2RlbCwgLi4uYXJndW1lbnRzKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBtb2RlbFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMuc3R5bGVzKVxyXG4gICAgICAgICAgICBkb2Muc3R5bGVzID0gdGhpcy5yZW5kZXJOb2RlKHRoaXMuc3R5bGVzKFwid1xcXFw6c3R5bGVzXCIpLmdldCgwKSwgY3JlYXRlRWxlbWVudCwgX2lkZW50aWZ5KVxyXG4gICAgICAgIGlmICh0aGlzLm51bWJlcmluZylcclxuICAgICAgICAgICAgZG9jLm51bWJlcmluZyA9IHRoaXMucmVuZGVyTm9kZSh0aGlzLm51bWJlcmluZyhcIndcXFxcOm51bWJlcmluZ1wiKS5nZXQoMCksIGNyZWF0ZUVsZW1lbnQsIF9pZGVudGlmeSlcclxuICAgICAgICBkb2MuZG9jdW1lbnQgPSB0aGlzLnJlbmRlck5vZGUodGhpcy5jb250ZW50KFwid1xcXFw6ZG9jdW1lbnRcIikuZ2V0KDApLCBjcmVhdGVFbGVtZW50LCBfaWRlbnRpZnkpXHJcbiAgICAgICAgcmV0dXJuIGRvY1xyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyBpZGVudGlmeSh3WG1sLCBvZmZpY2VEb2N1bWVudCkge1xyXG4gICAgICAgIGNvbnN0IHRhZyA9IHdYbWwubmFtZS5zcGxpdChcIjpcIikucG9wKClcclxuICAgICAgICBpZiAoaWRlbnRpdGllc1t0YWddKVxyXG4gICAgICAgICAgICByZXR1cm4gaWRlbnRpdGllc1t0YWddKC4uLmFyZ3VtZW50cylcclxuXHJcbiAgICAgICAgcmV0dXJuIHRhZ1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBPZmZpY2VEb2N1bWVudFxyXG5cclxuZXhwb3J0IGNvbnN0IGlkZW50aXRpZXMgPSB7XHJcbiAgICBkb2N1bWVudCh3WG1sLCBvZmZpY2VEb2N1bWVudCkge1xyXG4gICAgICAgIGxldCAkID0gb2ZmaWNlRG9jdW1lbnQuY29udGVudFxyXG4gICAgICAgIGxldCBjdXJyZW50ID0gbnVsbFxyXG4gICAgICAgIGxldCBjaGlsZHJlbiA9ICQoXCJ3XFxcXDpzZWN0UHJcIikuZWFjaCgoaSwgc2VjdCkgPT4ge1xyXG4gICAgICAgICAgICBsZXQgZW5kID0gJChzZWN0KS5jbG9zZXN0KCd3XFxcXDpib2R5PionKVxyXG4gICAgICAgICAgICBzZWN0LmNvbnRlbnQgPSBlbmQucHJldlVudGlsKGN1cnJlbnQpLnRvQXJyYXkoKS5yZXZlcnNlKClcclxuICAgICAgICAgICAgaWYgKCFlbmQuaXMoc2VjdCkpXHJcbiAgICAgICAgICAgICAgICBzZWN0LmNvbnRlbnQucHVzaChlbmQuZ2V0KDApKVxyXG4gICAgICAgICAgICBjdXJyZW50ID0gZW5kXHJcbiAgICAgICAgfSkudG9BcnJheSgpXHJcbiAgICAgICAgcmV0dXJuIHt0eXBlOiBcImRvY3VtZW50XCIsIGNoaWxkcmVufVxyXG4gICAgfSxcclxuICAgIHNlY3RQcih3WG1sLCBvZmZpY2VEb2N1bWVudCkge1xyXG4gICAgICAgIGNvbnN0IGhmID0gdHlwZSA9PiB3WG1sLmNoaWxkcmVuLmZpbHRlcihhID0+IGEubmFtZSA9PSBgdzoke3R5cGV9UmVmZXJlbmNlYCkucmVkdWNlKChoZWFkZXJzLCBhKSA9PiB7XHJcbiAgICAgICAgICAgIGhlYWRlcnMuc2V0KGEuYXR0cmlic1tcInc6dHlwZVwiXSwgb2ZmaWNlRG9jdW1lbnQuZ2V0UmVsKGEuYXR0cmlic1tcInI6aWRcIl0pKVxyXG4gICAgICAgICAgICByZXR1cm4gaGVhZGVyc1xyXG4gICAgICAgIH0sIG5ldyBNYXAoKSlcclxuXHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgdHlwZTogXCJzZWN0aW9uXCIsXHJcbiAgICAgICAgICAgIGNoaWxkcmVuOiB3WG1sLmNvbnRlbnQsXHJcbiAgICAgICAgICAgIGhlYWRlcnM6IGhmKFwiaGVhZGVyXCIpLFxyXG4gICAgICAgICAgICBmb290ZXJzOiBoZihcImZvb3RlclwiKSxcclxuICAgICAgICAgICAgaGFzVGl0bGVQYWdlOiAhIXdYbWwuY2hpbGRyZW4uZmluZChhID0+IGEubmFtZSA9PSBcInc6dGl0bGVQZ1wiKVxyXG4gICAgICAgIH1cclxuICAgIH0sXHJcbiAgICBwKHdYbWwsIG9mZmljZURvY3VtZW50KSB7XHJcbiAgICAgICAgbGV0ICQgPSBvZmZpY2VEb2N1bWVudC5jb250ZW50KHdYbWwpXHJcbiAgICAgICAgbGV0IHR5cGUgPSBcInBcIlxyXG5cclxuICAgICAgICBsZXQgaWRlbnRpdHkgPSB7XHJcbiAgICAgICAgICAgIHR5cGUsXHJcbiAgICAgICAgICAgIHByOiB3WG1sLmNoaWxkcmVuLmZpbmQoKHtuYW1lfSkgPT4gbmFtZSA9PSBcInc6cFByXCIpLFxyXG4gICAgICAgICAgICBjaGlsZHJlbjogd1htbC5jaGlsZHJlbi5maWx0ZXIoKHtuYW1lfSkgPT4gbmFtZSAhPSBcInc6cFByXCIpXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgcFByID0gJC5maW5kKFwid1xcXFw6cFByXCIpXHJcbiAgICAgICAgaWYgKHBQci5sZW5ndGgpIHtcclxuICAgICAgICAgICAgbGV0IHN0eWxlSWQgPSBwUHIuZmluZChcIndcXFxcOnBTdHlsZVwiKS5hdHRyKFwidzp2YWxcIilcclxuXHJcbiAgICAgICAgICAgIGxldCBudW1QciA9IHBQci5maW5kKFwid1xcXFw6bnVtUHI+d1xcXFw6bnVtSWRcIilcclxuICAgICAgICAgICAgaWYgKCFudW1Qci5sZW5ndGggJiYgc3R5bGVJZCkge1xyXG4gICAgICAgICAgICAgICAgbnVtUHIgPSBvZmZpY2VEb2N1bWVudC5zdHlsZXMoYHdcXFxcOnN0eWxlW3dcXFxcOnN0eWxlSWQ9XCIke3N0eWxlSWR9XCJdIHdcXFxcOm51bVByPndcXFxcOm51bUlkYClcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKG51bVByLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgaWRlbnRpdHkudHlwZSA9IFwibGlzdFwiXHJcbiAgICAgICAgICAgICAgICBpZGVudGl0eS5udW1JZCA9IG51bVByLmZpbmQoXCJ3XFxcXDpudW1JZFwiKS5hdHRyKFwidzp2YWxcIilcclxuICAgICAgICAgICAgICAgIGlkZW50aXR5LmxldmVsID0gbnVtUHIuZmluZChcIndcXFxcOmlsdmxcIikuYXR0cihcInc6dmFsXCIpXHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgb3V0bGluZUx2bCA9IHBQci5maW5kKFwid1xcXFw6b3V0bGluZUx2bFwiKS5hdHRyKFwidzp2YWxcIilcclxuICAgICAgICAgICAgICAgIGlmICghb3V0bGluZUx2bCAmJiBzdHlsZUlkKVxyXG4gICAgICAgICAgICAgICAgICAgIG91dGxpbmVMdmwgPSBvZmZpY2VEb2N1bWVudC5zdHlsZXMoYHdcXFxcOnN0eWxlW3dcXFxcOnN0eWxlSWQ9XCIke3N0eWxlSWR9XCJdIHdcXFxcOm91dGxpbmVMdmxgKS5hdHRyKFwidzp2YWxcIilcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAob3V0bGluZUx2bCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlkZW50aXR5LnR5cGUgPSBcImhlYWRpbmdcIlxyXG4gICAgICAgICAgICAgICAgICAgIGlkZW50aXR5LmxldmVsID0gcGFyc2VJbnQob3V0bGluZUx2bCkgKyAxXHJcbiAgICAgICAgICAgICAgICAgICAgaWRlbnRpdHkuc3R5bGVJZCA9IHN0eWxlSWRcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZGVudGl0eS53dCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuICQuZmluZCgnd1xcXFw6dCcpLm1hcChmdW5jdGlvbiAoaW5kZXgsIGVsZW1lbnQpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBlbGVtZW50LmNoaWxkcmVuO1xyXG4gICAgICAgICAgICB9KS5nZXQoKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICByZXR1cm4gaWRlbnRpdHlcclxuICAgIH0sXHJcbiAgICByKHdYbWwsIG9mZmljZURvY3VtZW50KSB7XHJcbiAgICAgICAgbGV0ICQgPSBvZmZpY2VEb2N1bWVudC5jb250ZW50KHdYbWwpO1xyXG5cclxuICAgICAgICBsZXQgclByID0gW107XHJcbiAgICAgICAgJC5jaGlsZHJlbihcIndcXFxcOnJQclwiKS5lYWNoKChpLCByUHJFbGVtKSA9PiB7XHJcbiAgICAgICAgICAgIHJQci5wdXNoKHJQckVsZW0pXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICQucGFyZW50KFwid1xcXFw6cFwiKS5maW5kKFwid1xcXFw6cFByPndcXFxcOnJQclwiKS5lYWNoKChpbmRleCwgZWxlbSkgPT4ge1xyXG4gICAgICAgICAgICByUHIucHVzaChlbGVtKVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICByZXR1cm4ge3R5cGU6IFwiclwiLCBwcjogclByLCBjaGlsZHJlbjogd1htbC5jaGlsZHJlbi5maWx0ZXIoKHtuYW1lfSkgPT4gbmFtZSAhPSBcInc6clByXCIpIHx8IFtdfVxyXG4gICAgfSxcclxuICAgIGZsZENoYXIod1htbCwgb2ZmaWNlRG9jdW1lbnQpIHtcclxuICAgICAgICByZXR1cm4gd1htbC5hdHRyaWJzW1widzpmbGRDaGFyVHlwZVwiXVxyXG4gICAgfSxcclxuXHJcbiAgICBpbmxpbmUod1htbCwgb2ZmaWNlRG9jdW1lbnQpIHtcclxuICAgICAgICBsZXQgJCA9IG9mZmljZURvY3VtZW50LmNvbnRlbnQod1htbClcclxuICAgICAgICByZXR1cm4ge3R5cGU6IGBkcmF3aW5nLmlubGluZWAsIGNoaWxkcmVuOiAkLmZpbmQoJ2FcXFxcOmdyYXBoaWM+YVxcXFw6Z3JhcGhpY0RhdGEnKS5jaGlsZHJlbigpLnRvQXJyYXkoKX1cclxuICAgIH0sXHJcbiAgICBhbmNob3Iod1htbCwgb2ZmaWNlRG9jdW1lbnQpIHtcclxuICAgICAgICBsZXQgJCA9IG9mZmljZURvY3VtZW50LmNvbnRlbnQod1htbClcclxuICAgICAgICBsZXQgZ3JhcGhpY0RhdGEgPSAkLmZpbmQoJ2FcXFxcOmdyYXBoaWM+YVxcXFw6Z3JhcGhpY0RhdGEnKVxyXG4gICAgICAgIGxldCB0eXBlID0gZ3JhcGhpY0RhdGEuYXR0cihcInVyaVwiKS5zcGxpdChcIi9cIikucG9wKClcclxuICAgICAgICBsZXQgY2hpbGRyZW4gPSBncmFwaGljRGF0YS5jaGlsZHJlbigpLnRvQXJyYXkoKVxyXG4gICAgICAgIGlmICh0eXBlID09IFwid29yZHByb2Nlc3NpbmdHcm91cFwiKVxyXG4gICAgICAgICAgICBjaGlsZHJlbiA9IGNoaWxkcmVuWzBdLmNoaWxkcmVuLmZpbHRlcihhID0+IGEubmFtZS5zcGxpdChcIjpcIilbMF0gIT0gXCJ3cGdcIilcclxuXHJcbiAgICAgICAgcmV0dXJuIHt0eXBlOiBcImRyYXdpbmcuYW5jaG9yXCIsIGNoaWxkcmVufVxyXG4gICAgfSxcclxuICAgIHBpYyh3WG1sLCBvZmZpY2VEb2N1bWVudCkge1xyXG4gICAgICAgIGxldCBibGlwID0gb2ZmaWNlRG9jdW1lbnQuY29udGVudCh3WG1sKS5maW5kKFwiYVxcXFw6YmxpcFwiKVxyXG4gICAgICAgIGxldCByaWQgPSBibGlwLmF0dHIoJ3I6ZW1iZWQnKSB8fCBibGlwLmF0dHIoJ3I6bGluaycpXHJcbiAgICAgICAgcmV0dXJuIHt0eXBlOiBcInBpY3R1cmVcIiwgLi4ub2ZmaWNlRG9jdW1lbnQuZ2V0UmVsKHJpZCl9XHJcbiAgICB9LFxyXG4gICAgd3NwKHdYbWwsIG9mZmljZURvY3VtZW50KSB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgdHlwZTogXCJzaGFwZVwiLFxyXG4gICAgICAgICAgICBjaGlsZHJlbjogb2ZmaWNlRG9jdW1lbnQuY29udGVudCh3WG1sKS5maW5kKFwiPndwc1xcXFw6dHhieD53XFxcXDp0eGJ4Q29udGVudFwiKS5jaGlsZHJlbigpLnRvQXJyYXkoKVxyXG4gICAgICAgIH1cclxuICAgIH0sXHJcbiAgICBGYWxsYmFjaygpIHtcclxuICAgICAgICByZXR1cm4gbnVsbFxyXG4gICAgfSxcclxuICAgIHNkdCh3WG1sLCBvZmZpY2VEb2N1bWVudCkge1xyXG4gICAgICAgIGxldCAkID0gb2ZmaWNlRG9jdW1lbnQuY29udGVudCh3WG1sKVxyXG4gICAgICAgIGxldCBwciA9ICQuZmluZCgnPndcXFxcOnNkdFByJylcclxuICAgICAgICBsZXQgY29udGVudCA9ICQuZmluZCgnPndcXFxcOnNkdENvbnRlbnQnKVxyXG4gICAgICAgIGxldCBjaGlsZHJlbiA9IGNvbnRlbnQuY2hpbGRyZW4oKS50b0FycmF5KClcclxuXHJcbiAgICAgICAgbGV0IGVsQmluZGluZyA9IHByLmZpbmQoJ3dcXFxcOmRhdGFCaW5kaW5nJykuZ2V0KDApXHJcbiAgICAgICAgaWYgKGVsQmluZGluZykgey8vcHJvcGVydGllc1xyXG4gICAgICAgICAgICBsZXQgcGF0aCA9IGVsQmluZGluZy5hdHRyaWJzWyd3OnhwYXRoJ10sXHJcbiAgICAgICAgICAgICAgICBkID0gcGF0aC5zcGxpdCgvW1xcL1xcOlxcW10vKSxcclxuICAgICAgICAgICAgICAgIG5hbWUgPSAoZC5wb3AoKSwgZC5wb3AoKSk7XHJcbiAgICAgICAgICAgIGxldCB2YWx1ZSA9IGNvbnRlbnQudGV4dCgpXHJcblxyXG4gICAgICAgICAgICByZXR1cm4ge3R5cGU6IFwicHJvcGVydHlcIiwgbmFtZSwgdmFsdWUsIGNoaWxkcmVufVxyXG4gICAgICAgIH0gZWxzZSB7Ly9jb250cm9sc1xyXG4gICAgICAgICAgICBsZXQgcHJDaGlsZHJlbiA9IHByLmdldCgwKS5jaGlsZHJlblxyXG4gICAgICAgICAgICBsZXQgZWxUeXBlID0gcHJDaGlsZHJlbltwckNoaWxkcmVuLmxlbmd0aCAtIDFdXHJcbiAgICAgICAgICAgIGxldCBuYW1lID0gZWxUeXBlLm5hbWUuc3BsaXQoXCI6XCIpLnBvcCgpXHJcbiAgICAgICAgICAgIGxldCB0eXBlID0gXCJ0ZXh0LHBpY3R1cmUsZG9jUGFydExpc3QsY29tYm9Cb3gsZHJvcERvd25MaXN0LGRhdGUsY2hlY2tib3gscmVwZWF0aW5nU2VjdGlvbixyZXBlYXRpbmdTZWN0aW9uSXRlbVwiLnNwbGl0KFwiLFwiKVxyXG4gICAgICAgICAgICAgICAgLmZpbmQoYSA9PiBhID09IG5hbWUpXHJcbiAgICAgICAgICAgIGxldCBtb2RlbCA9IHtjaGlsZHJlbn1cclxuICAgICAgICAgICAgaWYgKHR5cGUpIHtcclxuICAgICAgICAgICAgICAgIG1vZGVsLnR5cGUgPSBgY29udHJvbC4ke3R5cGV9YFxyXG4gICAgICAgICAgICB9IGVsc2Ugey8vY29udGFpbmVyXHJcbiAgICAgICAgICAgICAgICBpZiAoY29udGVudC5maW5kKFwid1xcXFw6cCx3XFxcXDp0Ymwsd1xcXFw6dHIsd1xcXFw6dGNcIikubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbW9kZWwudHlwZSA9IFwiYmxvY2tcIlxyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBtb2RlbC50eXBlID0gXCJpbmxpbmVcIlxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAkID0gb2ZmaWNlRG9jdW1lbnQuY29udGVudFxyXG4gICAgICAgICAgICBzd2l0Y2ggKG1vZGVsLnR5cGUpIHtcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJjb250cm9sLmRyb3BEb3duTGlzdFwiOlxyXG4gICAgICAgICAgICAgICAgY2FzZSBcImNvbnRyb2wuY29tYm9Cb3hcIjoge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBzZWxlY3RlZCA9ICQoY29udGVudCkudGV4dCgpXHJcbiAgICAgICAgICAgICAgICAgICAgbW9kZWwub3B0aW9ucyA9ICQoZWxUeXBlKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAuZmluZChcIndcXFxcOmxpc3RJdGVtXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5tYXAoKGksIGxpKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpc3BsYXlUZXh0OiBsaS5hdHRyaWJzW1widzpkaXNwbGF5VGV4dFwiXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogbGkuYXR0cmlic1tcInc6dmFsdWVcIl1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgLmdldCgpXHJcbiAgICAgICAgICAgICAgICAgICAgbW9kZWwudmFsdWUgPSAobW9kZWwub3B0aW9ucy5maW5kKGEgPT4gYS5kaXNwbGF5VGV4dCA9PSBzZWxlY3RlZCkgfHwge30pLnZhbHVlXHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGNhc2UgXCJjb250cm9sLmNoZWNrYm94XCI6IHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgbnMgPSBlbFR5cGUubmFtZS5zcGxpdChcIjpcIilbMF1cclxuICAgICAgICAgICAgICAgICAgICBtb2RlbC5jaGVja2VkID0gJChlbFR5cGUpLmZpbmQoYCR7bnN9XFxcXDpjaGVja2VkYCkuYXR0cihgJHtuc306dmFsYCkgPT0gXCIxXCJcclxuICAgICAgICAgICAgICAgICAgICBicmVha1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgY2FzZSBcImNvbnRyb2wudGV4dFwiOlxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChjb250ZW50LmZpbmQoJ3dcXFxcOnIgW3dcXFxcOnZhbH49UGxhY2Vob2xkZXJdJykubGVuZ3RoID09IDApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1vZGVsLnZhbHVlID0gY29udGVudC50ZXh0KClcclxuICAgICAgICAgICAgICAgICAgICBicmVha1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcImNvbnRyb2wuZGF0ZVwiOlxyXG4gICAgICAgICAgICAgICAgICAgIG1vZGVsLnZhbHVlID0gbmV3IERhdGUoJChlbFR5cGUpLmF0dHIoXCJ3OmZ1bGxEYXRlXCIpKVxyXG4gICAgICAgICAgICAgICAgICAgIG1vZGVsLmZvcm1hdCA9ICQoZWxUeXBlKS5maW5kKFwid1xcXFw6ZGF0ZUZvcm1hdFwiKS5hdHRyKFwidzp2YWxcIilcclxuICAgICAgICAgICAgICAgICAgICBtb2RlbC5sb2NhbGUgPSAkKGVsVHlwZSkuZmluZChcIndcXFxcOmxpZFwiKS5hdHRyKFwidzp2YWxcIilcclxuICAgICAgICAgICAgICAgICAgICBicmVha1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBtb2RlbFxyXG4gICAgICAgIH1cclxuICAgIH0sXHJcbiAgICBoeXBlcmxpbmsod1htbCwgb2ZmaWNlRG9jdW1lbnQpIHtcclxuICAgICAgICBpZiAod1htbC5hdHRyaWJzW1wicjppZFwiXSkge1xyXG4gICAgICAgICAgICBsZXQgdXJsID0gb2ZmaWNlRG9jdW1lbnQuZ2V0UmVsKHdYbWwuYXR0cmlic1tcInI6aWRcIl0pXHJcbiAgICAgICAgICAgIHJldHVybiB7dHlwZTogXCJoeXBlcmxpbmtcIiwgdXJsfTtcclxuICAgICAgICB9IGVsc2UgaWYgKHdYbWwuYXR0cmlic1sndzphbmNob3InXSkge1xyXG4gICAgICAgICAgICBsZXQgbmFtZSA9IHdYbWwuYXR0cmlic1sndzphbmNob3InXTsgLy9UT0RPXHJcbiAgICAgICAgICAgIHJldHVybiB7dHlwZTogJ2FuY2hvcicsIG5hbWV9O1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcbiAgICB0Ymwod1htbCwgb2ZmaWNlRG9jdW1lbnQpIHtcclxuICAgICAgICByZXR1cm4gd1htbC5jaGlsZHJlbi5yZWR1Y2UoKHN0YXRlLCBub2RlKSA9PiB7XHJcbiAgICAgICAgICAgIHN3aXRjaCAobm9kZS5uYW1lKSB7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwidzp0YmxQclwiOlxyXG4gICAgICAgICAgICAgICAgICAgIHN0YXRlLnByID0gbm9kZVxyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXHJcbiAgICAgICAgICAgICAgICBjYXNlIFwidzp0YmxHcmlkXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgc3RhdGUuY29scyA9IG5vZGUuY2hpbGRyZW5cclxuICAgICAgICAgICAgICAgICAgICBicmVha1xyXG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgICAgICBzdGF0ZS5jaGlsZHJlbi5wdXNoKG5vZGUpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHN0YXRlXHJcbiAgICAgICAgfSwge3R5cGU6IFwidGJsXCIsIGNoaWxkcmVuOiBbXSwgcHI6IG51bGwsIGNvbHM6IFtdfSlcclxuICAgIH0sXHJcbiAgICB0cih3WG1sLCBvZmZpY2VEb2N1bWVudCkge1xyXG4gICAgICAgIHJldHVybiB3WG1sLmNoaWxkcmVuLnJlZHVjZSgoc3RhdGUsIG5vZGUpID0+IHtcclxuICAgICAgICAgICAgc3dpdGNoIChub2RlLm5hbWUpIHtcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJ3OnRyUHJcIjpcclxuICAgICAgICAgICAgICAgICAgICBzdGF0ZS5wciA9IG5vZGVcclxuICAgICAgICAgICAgICAgICAgICBzdGF0ZS5pc0hlYWRlciA9ICEhbm9kZS5jaGlsZHJlbi5maW5kKGEgPT4gYS5uYW1lID09IFwidzp0YmxIZWFkZXJcIilcclxuICAgICAgICAgICAgICAgICAgICBicmVha1xyXG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgICAgICBzdGF0ZS5jaGlsZHJlbi5wdXNoKG5vZGUpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHN0YXRlXHJcbiAgICAgICAgfSwge3R5cGU6IFwidHJcIiwgY2hpbGRyZW46IFtdLCBwcjogbnVsbH0pXHJcbiAgICB9LFxyXG4gICAgdGMod1htbCwgb2ZmaWNlRG9jdW1lbnQpIHtcclxuICAgICAgICByZXR1cm4gd1htbC5jaGlsZHJlbi5yZWR1Y2UoKHN0YXRlLCBub2RlKSA9PiB7XHJcbiAgICAgICAgICAgIHN3aXRjaCAobm9kZS5uYW1lKSB7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwidzp0Y1ByXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgc3RhdGUucHIgPSBub2RlXHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcclxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICAgICAgc3RhdGUuY2hpbGRyZW4ucHVzaChub2RlKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBzdGF0ZVxyXG4gICAgICAgIH0sIHt0eXBlOiBcInRjXCIsIGNoaWxkcmVuOiBbXSwgcHI6IG51bGx9KVxyXG4gICAgfSxcclxuICAgIGFsdENodW5rKHdYbWwsIG9mZmljZURvY3VtZW50KSB7XHJcbiAgICAgICAgbGV0IHJJZCA9IHdYbWwuYXR0cmlic1sncjppZCddXHJcbiAgICAgICAgbGV0IGRhdGEgPSBvZmZpY2VEb2N1bWVudC5nZXRSZWwocklkKVxyXG5cclxuICAgICAgICBsZXQgcGFydE5hbWUgPSBvZmZpY2VEb2N1bWVudC5mb2xkZXIgKyBvZmZpY2VEb2N1bWVudC5yZWxzKGBbSWQ9JHtySWR9XWApLmF0dHIoXCJUYXJnZXRcIilcclxuICAgICAgICBsZXQgY29udGVudFR5cGUgPSBvZmZpY2VEb2N1bWVudC5kb2MuY29udGVudFR5cGVzKGBPdmVycmlkZVtQYXJ0TmFtZT0nJHtwYXJ0TmFtZX0nXWApLmF0dHIoXCJDb250ZW50VHlwZVwiKVxyXG4gICAgICAgIHJldHVybiB7dHlwZTogXCJjaHVua1wiLCBkYXRhLCBjb250ZW50VHlwZX1cclxuICAgIH0sXHJcbiAgICBkb2NEZWZhdWx0cyh3WG1sKSB7XHJcbiAgICAgICAgcmV0dXJuIHt0eXBlOiBcInN0eWxlXCJ9XHJcbiAgICB9LFxyXG4gICAgc3R5bGUod1htbCkge1xyXG4gICAgICAgIHJldHVybiB7dHlwZTogXCJzdHlsZVwiLCBpZDogd1htbC5hdHRyaWJzWyd3OnN0eWxlSWQnXX1cclxuICAgIH0sXHJcbiAgICBhYnN0cmFjdE51bSh3WG1sKSB7XHJcbiAgICAgICAgcmV0dXJuIHt0eXBlOiBcImFic3RyYWN0TnVtXCIsIGlkOiB3WG1sLmF0dHJpYnNbXCJ3OmFic3RyYWN0TnVtSWRcIl19XHJcbiAgICB9LFxyXG4gICAgbnVtKHdYbWwpIHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICB0eXBlOiBcIm51bVwiLFxyXG4gICAgICAgICAgICBpZDogd1htbC5hdHRyaWJzW1widzpudW1JZFwiXSxcclxuICAgICAgICAgICAgYWJzdHJhY3ROdW06IHdYbWwuY2hpbGRyZW4uZmluZChhID0+IGEubmFtZSA9PSBcInc6YWJzdHJhY3ROdW1JZFwiKS5hdHRyaWJzW1widzp2YWxcIl1cclxuICAgICAgICB9XHJcbiAgICB9LFxyXG4gICAgbGF0ZW50U3R5bGVzKCkge1xyXG4gICAgICAgIHJldHVybiBudWxsXHJcbiAgICB9LFxyXG4gICAgb2JqZWN0KHdYbWwsIG9mZmljZURvY3VtZW50KSB7XHJcbiAgICAgICAgbGV0IG9sZSA9IG9mZmljZURvY3VtZW50LmNvbnRlbnQod1htbCkuZmluZChcIm9cXFxcOk9MRU9iamVjdFwiKVxyXG4gICAgICAgIGxldCB0eXBlID0gb2xlLmF0dHIoXCJQcm9nSURcIilcclxuICAgICAgICBsZXQgZW1iZWQgPSBvbGUuYXR0cihcIlR5cGVcIikgPT09IFwiRW1iZWRcIlxyXG4gICAgICAgIGxldCBySWQgPSBvbGUuYXR0cihcInI6aWRcIilcclxuICAgICAgICByZXR1cm4ge3R5cGU6IFwib2JqZWN0XCIsIGVtYmVkLCBwcm9nOiB0eXBlLCBkYXRhOiBvZmZpY2VEb2N1bWVudC5nZXRSZWxPbGVPYmplY3QocklkKX1cclxuICAgIH1cclxufVxyXG4iXX0=