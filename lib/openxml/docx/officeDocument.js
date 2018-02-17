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
        });
        var parent_pPr_rPr = $.parent("w\\:p").find("w\\:pPr>w\\:rPr");

        if (parent_pPr_rPr.length) {
            if (rPr.length) rPr.concat(pPr_rPr);else rPr = pPr_rPr;
        }
        return { type: "r", pr: rPr, children: wXml.children.filter(function (_ref4) {
                var name = _ref4.name;
                return name != "w:rPr";
            }) };
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9vcGVueG1sL2RvY3gvb2ZmaWNlRG9jdW1lbnQuanMiXSwibmFtZXMiOlsiT2ZmaWNlRG9jdW1lbnQiLCJzdXBwb3J0ZWQiLCJzcGxpdCIsInJlbHMiLCJlYWNoIiwiaSIsInJlbCIsIiQiLCJ0eXBlIiwiYXR0ciIsInBvcCIsImluZGV4T2YiLCJ0YXJnZXQiLCJPYmplY3QiLCJkZWZpbmVQcm9wZXJ0eSIsImdldCIsImdldFJlbE9iamVjdCIsImNyZWF0ZUVsZW1lbnQiLCJpZGVudGlmeSIsInN0eWxlcyIsInJlbmRlck5vZGUiLCJudW1iZXJpbmciLCJjb250ZW50IiwiZG9tSGFuZGxlciIsImRvYyIsImJpbmQiLCJfaWRlbnRpZnkiLCJtb2RlbCIsImFyZ3VtZW50cyIsImVtaXQiLCJkb2N1bWVudCIsIndYbWwiLCJvZmZpY2VEb2N1bWVudCIsInRhZyIsIm5hbWUiLCJpZGVudGl0aWVzIiwiY3VycmVudCIsImNoaWxkcmVuIiwic2VjdCIsImVuZCIsImNsb3Nlc3QiLCJwcmV2VW50aWwiLCJ0b0FycmF5IiwicmV2ZXJzZSIsImlzIiwicHVzaCIsInNlY3RQciIsImhmIiwiZmlsdGVyIiwiYSIsInJlZHVjZSIsImhlYWRlcnMiLCJzZXQiLCJhdHRyaWJzIiwiZ2V0UmVsIiwiTWFwIiwiZm9vdGVycyIsImhhc1RpdGxlUGFnZSIsImZpbmQiLCJwIiwiaWRlbnRpdHkiLCJwciIsInBQciIsImxlbmd0aCIsInN0eWxlSWQiLCJudW1QciIsIm51bUlkIiwibGV2ZWwiLCJvdXRsaW5lTHZsIiwicGFyc2VJbnQiLCJ3dCIsIm1hcCIsImluZGV4IiwiZWxlbWVudCIsInIiLCJyUHIiLCJwYXJlbnRfcFByX3JQciIsInBhcmVudCIsImNvbmNhdCIsInBQcl9yUHIiLCJmbGRDaGFyIiwiaW5saW5lIiwiYW5jaG9yIiwiZ3JhcGhpY0RhdGEiLCJwaWMiLCJibGlwIiwicmlkIiwid3NwIiwiRmFsbGJhY2siLCJzZHQiLCJlbEJpbmRpbmciLCJwYXRoIiwiZCIsInZhbHVlIiwidGV4dCIsInByQ2hpbGRyZW4iLCJlbFR5cGUiLCJzZWxlY3RlZCIsIm9wdGlvbnMiLCJsaSIsImRpc3BsYXlUZXh0IiwibnMiLCJjaGVja2VkIiwiRGF0ZSIsImZvcm1hdCIsImxvY2FsZSIsImh5cGVybGluayIsInVybCIsInRibCIsInN0YXRlIiwibm9kZSIsImNvbHMiLCJ0ciIsImlzSGVhZGVyIiwidGMiLCJhbHRDaHVuayIsInJJZCIsImRhdGEiLCJwYXJ0TmFtZSIsImZvbGRlciIsImNvbnRlbnRUeXBlIiwiY29udGVudFR5cGVzIiwiZG9jRGVmYXVsdHMiLCJzdHlsZSIsImlkIiwiYWJzdHJhY3ROdW0iLCJudW0iLCJsYXRlbnRTdHlsZXMiLCJvYmplY3QiLCJvbGUiLCJlbWJlZCIsInByb2ciLCJnZXRSZWxPbGVPYmplY3QiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQUFBOzs7Ozs7Ozs7Ozs7SUFFYUEsYyxXQUFBQSxjOzs7Ozs7Ozs7OztnQ0FDRDtBQUFBOztBQUNKO0FBQ0EsZ0JBQU1DLFlBQVksa0NBQWtDQyxLQUFsQyxDQUF3QyxHQUF4QyxDQUFsQjtBQUNBLGlCQUFLQyxJQUFMLG1DQUEwQ0MsSUFBMUMsQ0FBK0MsVUFBQ0MsQ0FBRCxFQUFJQyxHQUFKLEVBQVk7QUFDdkQsb0JBQUlDLElBQUksT0FBS0osSUFBTCxDQUFVRyxHQUFWLENBQVI7QUFDQSxvQkFBSUUsT0FBT0QsRUFBRUUsSUFBRixDQUFPLE1BQVAsRUFBZVAsS0FBZixDQUFxQixHQUFyQixFQUEwQlEsR0FBMUIsRUFBWDtBQUNBLG9CQUFJVCxVQUFVVSxPQUFWLENBQWtCSCxJQUFsQixLQUEyQixDQUFDLENBQWhDLEVBQW1DO0FBQy9CLHdCQUFJSSxTQUFTTCxFQUFFRSxJQUFGLENBQU8sUUFBUCxDQUFiO0FBQ0FJLDJCQUFPQyxjQUFQLFNBQTRCTixJQUE1QixFQUFrQztBQUM5Qk8sMkJBRDhCLGlCQUN4QjtBQUNGLG1DQUFPLEtBQUtDLFlBQUwsQ0FBa0JKLE1BQWxCLENB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QUFQLEVBQXNCb0gsSUFBSTdGLEtBQUtzQixPQUFMLENBQWEsaUJBQWIsQ0FBMUIsRUFBUDtBQUNILEtBdFBxQjtBQXVQdEJ5RSxPQXZQc0IsZUF1UGxCL0YsSUF2UGtCLEVBdVBaO0FBQ04sZUFBTztBQUNIdkIsa0JBQU0sS0FESDtBQUVIb0gsZ0JBQUk3RixLQUFLc0IsT0FBTCxDQUFhLFNBQWIsQ0FGRDtBQUdId0UseUJBQWE5RixLQUFLTSxRQUFMLENBQWNxQixJQUFkLENBQW1CO0FBQUEsdUJBQUtULEVBQUVmLElBQUYsSUFBVSxpQkFBZjtBQUFBLGFBQW5CLEVBQXFEbUIsT0FBckQsQ0FBNkQsT0FBN0Q7QUFIVixTQUFQO0FBS0gsS0E3UHFCO0FBOFB0QjBFLGdCQTlQc0IsMEJBOFBQO0FBQ1gsZUFBTyxJQUFQO0FBQ0gsS0FoUXFCO0FBaVF0QkMsVUFqUXNCLGtCQWlRZmpHLElBalFlLEVBaVFUQyxjQWpRUyxFQWlRTztBQUN6QixZQUFJaUcsTUFBTWpHLGVBQWVWLE9BQWYsQ0FBdUJTLElBQXZCLEVBQTZCMkIsSUFBN0IsQ0FBa0MsZUFBbEMsQ0FBVjtBQUNBLFlBQUlsRCxPQUFPeUgsSUFBSXhILElBQUosQ0FBUyxRQUFULENBQVg7QUFDQSxZQUFJeUgsUUFBUUQsSUFBSXhILElBQUosQ0FBUyxNQUFULE1BQXFCLE9BQWpDO0FBQ0EsWUFBSTJHLE1BQU1hLElBQUl4SCxJQUFKLENBQVMsTUFBVCxDQUFWO0FBQ0EsZUFBTyxFQUFDRCxNQUFNLFFBQVAsRUFBaUIwSCxZQUFqQixFQUF3QkMsTUFBTTNILElBQTlCLEVBQW9DNkcsTUFBTXJGLGVBQWVvRyxlQUFmLENBQStCaEIsR0FBL0IsQ0FBMUMsRUFBUDtBQUNIO0FBdlFxQixDQUFuQiIsImZpbGUiOiJvZmZpY2VEb2N1bWVudC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBQYXJ0IGZyb20gXCIuLi9wYXJ0XCJcclxuXHJcbmV4cG9ydCBjbGFzcyBPZmZpY2VEb2N1bWVudCBleHRlbmRzIFBhcnQge1xyXG4gICAgX2luaXQoKSB7XHJcbiAgICAgICAgc3VwZXIuX2luaXQoKVxyXG4gICAgICAgIGNvbnN0IHN1cHBvcnRlZCA9IFwic3R5bGVzLG51bWJlcmluZyx0aGVtZSxzZXR0aW5nc1wiLnNwbGl0KFwiLFwiKVxyXG4gICAgICAgIHRoaXMucmVscyhgUmVsYXRpb25zaGlwW1RhcmdldCQ9XCIueG1sXCJdYCkuZWFjaCgoaSwgcmVsKSA9PiB7XHJcbiAgICAgICAgICAgIGxldCAkID0gdGhpcy5yZWxzKHJlbClcclxuICAgICAgICAgICAgbGV0IHR5cGUgPSAkLmF0dHIoXCJUeXBlXCIpLnNwbGl0KFwiL1wiKS5wb3AoKVxyXG4gICAgICAgICAgICBpZiAoc3VwcG9ydGVkLmluZGV4T2YodHlwZSkgIT0gLTEpIHtcclxuICAgICAgICAgICAgICAgIGxldCB0YXJnZXQgPSAkLmF0dHIoXCJUYXJnZXRcIilcclxuICAgICAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCB0eXBlLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgZ2V0KCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5nZXRSZWxPYmplY3QodGFyZ2V0KVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgfVxyXG5cclxuICAgIHJlbmRlcihjcmVhdGVFbGVtZW50LCBpZGVudGlmeSA9IE9mZmljZURvY3VtZW50LmlkZW50aWZ5KSB7XHJcbiAgICAgICAgaWYgKHRoaXMuc3R5bGVzKVxyXG4gICAgICAgICAgICB0aGlzLnJlbmRlck5vZGUodGhpcy5zdHlsZXMoXCJ3XFxcXDpzdHlsZXNcIikuZ2V0KDApLCBjcmVhdGVFbGVtZW50LCBpZGVudGlmeSlcclxuICAgICAgICBpZiAodGhpcy5udW1iZXJpbmcpXHJcbiAgICAgICAgICAgIHRoaXMucmVuZGVyTm9kZSh0aGlzLm51bWJlcmluZyhcIndcXFxcOm51bWJlcmluZ1wiKS5nZXQoMCksIGNyZWF0ZUVsZW1lbnQsIGlkZW50aWZ5KVxyXG4gICAgICAgIHJldHVybiB0aGlzLnJlbmRlck5vZGUodGhpcy5jb250ZW50KFwid1xcXFw6ZG9jdW1lbnRcIikuZ2V0KDApLCBjcmVhdGVFbGVtZW50LCBpZGVudGlmeSlcclxuICAgIH1cclxuXHJcbiAgICBwYXJzZShkb21IYW5kbGVyLCBpZGVudGlmeSA9IE9mZmljZURvY3VtZW50LmlkZW50aWZ5KSB7XHJcbiAgICAgICAgY29uc3QgZG9jID0ge31cclxuICAgICAgICBjb25zdCBjcmVhdGVFbGVtZW50ID0gZG9tSGFuZGxlci5jcmVhdGVFbGVtZW50LmJpbmQoZG9tSGFuZGxlcilcclxuXHJcbiAgICAgICAgZnVuY3Rpb24gX2lkZW50aWZ5KCkge1xyXG4gICAgICAgICAgICBsZXQgbW9kZWwgPSBpZGVudGlmeSguLi5hcmd1bWVudHMpXHJcbiAgICAgICAgICAgIGlmIChtb2RlbCAmJiB0eXBlb2YobW9kZWwpID09IFwib2JqZWN0XCIpIHtcclxuICAgICAgICAgICAgICAgIGRvbUhhbmRsZXIuZW1pdChcIipcIiwgbW9kZWwsIC4uLmFyZ3VtZW50cylcclxuICAgICAgICAgICAgICAgIGRvbUhhbmRsZXIuZW1pdChtb2RlbC50eXBlLCBtb2RlbCwgLi4uYXJndW1lbnRzKVxyXG4gICAgICAgICAgICAgICAgaWYgKGRvbUhhbmRsZXJbYG9uJHttb2RlbC50eXBlfWBdKVxyXG4gICAgICAgICAgICAgICAgICAgIGRvbUhhbmRsZXJbYG9uJHttb2RlbC50eXBlfWBdKG1vZGVsLCAuLi5hcmd1bWVudHMpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIG1vZGVsXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5zdHlsZXMpXHJcbiAgICAgICAgICAgIGRvYy5zdHlsZXMgPSB0aGlzLnJlbmRlck5vZGUodGhpcy5zdHlsZXMoXCJ3XFxcXDpzdHlsZXNcIikuZ2V0KDApLCBjcmVhdGVFbGVtZW50LCBfaWRlbnRpZnkpXHJcbiAgICAgICAgaWYgKHRoaXMubnVtYmVyaW5nKVxyXG4gICAgICAgICAgICBkb2MubnVtYmVyaW5nID0gdGhpcy5yZW5kZXJOb2RlKHRoaXMubnVtYmVyaW5nKFwid1xcXFw6bnVtYmVyaW5nXCIpLmdldCgwKSwgY3JlYXRlRWxlbWVudCwgX2lkZW50aWZ5KVxyXG4gICAgICAgIGRvYy5kb2N1bWVudCA9IHRoaXMucmVuZGVyTm9kZSh0aGlzLmNvbnRlbnQoXCJ3XFxcXDpkb2N1bWVudFwiKS5nZXQoMCksIGNyZWF0ZUVsZW1lbnQsIF9pZGVudGlmeSlcclxuICAgICAgICByZXR1cm4gZG9jXHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIGlkZW50aWZ5KHdYbWwsIG9mZmljZURvY3VtZW50KSB7XHJcbiAgICAgICAgY29uc3QgdGFnID0gd1htbC5uYW1lLnNwbGl0KFwiOlwiKS5wb3AoKVxyXG4gICAgICAgIGlmIChpZGVudGl0aWVzW3RhZ10pXHJcbiAgICAgICAgICAgIHJldHVybiBpZGVudGl0aWVzW3RhZ10oLi4uYXJndW1lbnRzKVxyXG5cclxuICAgICAgICByZXR1cm4gdGFnXHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IE9mZmljZURvY3VtZW50XHJcblxyXG5leHBvcnQgY29uc3QgaWRlbnRpdGllcyA9IHtcclxuICAgIGRvY3VtZW50KHdYbWwsIG9mZmljZURvY3VtZW50KSB7XHJcbiAgICAgICAgbGV0ICQgPSBvZmZpY2VEb2N1bWVudC5jb250ZW50XHJcbiAgICAgICAgbGV0IGN1cnJlbnQgPSBudWxsXHJcbiAgICAgICAgbGV0IGNoaWxkcmVuID0gJChcIndcXFxcOnNlY3RQclwiKS5lYWNoKChpLCBzZWN0KSA9PiB7XHJcbiAgICAgICAgICAgIGxldCBlbmQgPSAkKHNlY3QpLmNsb3Nlc3QoJ3dcXFxcOmJvZHk+KicpXHJcbiAgICAgICAgICAgIHNlY3QuY29udGVudCA9IGVuZC5wcmV2VW50aWwoY3VycmVudCkudG9BcnJheSgpLnJldmVyc2UoKVxyXG4gICAgICAgICAgICBpZiAoIWVuZC5pcyhzZWN0KSlcclxuICAgICAgICAgICAgICAgIHNlY3QuY29udGVudC5wdXNoKGVuZC5nZXQoMCkpXHJcbiAgICAgICAgICAgIGN1cnJlbnQgPSBlbmRcclxuICAgICAgICB9KS50b0FycmF5KClcclxuICAgICAgICByZXR1cm4ge3R5cGU6IFwiZG9jdW1lbnRcIiwgY2hpbGRyZW59XHJcbiAgICB9LFxyXG4gICAgc2VjdFByKHdYbWwsIG9mZmljZURvY3VtZW50KSB7XHJcbiAgICAgICAgY29uc3QgaGYgPSB0eXBlID0+IHdYbWwuY2hpbGRyZW4uZmlsdGVyKGEgPT4gYS5uYW1lID09IGB3OiR7dHlwZX1SZWZlcmVuY2VgKS5yZWR1Y2UoKGhlYWRlcnMsIGEpID0+IHtcclxuICAgICAgICAgICAgaGVhZGVycy5zZXQoYS5hdHRyaWJzW1widzp0eXBlXCJdLCBvZmZpY2VEb2N1bWVudC5nZXRSZWwoYS5hdHRyaWJzW1wicjppZFwiXSkpXHJcbiAgICAgICAgICAgIHJldHVybiBoZWFkZXJzXHJcbiAgICAgICAgfSwgbmV3IE1hcCgpKVxyXG5cclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICB0eXBlOiBcInNlY3Rpb25cIixcclxuICAgICAgICAgICAgY2hpbGRyZW46IHdYbWwuY29udGVudCxcclxuICAgICAgICAgICAgaGVhZGVyczogaGYoXCJoZWFkZXJcIiksXHJcbiAgICAgICAgICAgIGZvb3RlcnM6IGhmKFwiZm9vdGVyXCIpLFxyXG4gICAgICAgICAgICBoYXNUaXRsZVBhZ2U6ICEhd1htbC5jaGlsZHJlbi5maW5kKGEgPT4gYS5uYW1lID09IFwidzp0aXRsZVBnXCIpXHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIHAod1htbCwgb2ZmaWNlRG9jdW1lbnQpIHtcclxuICAgICAgICBsZXQgJCA9IG9mZmljZURvY3VtZW50LmNvbnRlbnQod1htbClcclxuICAgICAgICBsZXQgdHlwZSA9IFwicFwiXHJcblxyXG4gICAgICAgIGxldCBpZGVudGl0eSA9IHtcclxuICAgICAgICAgICAgdHlwZSxcclxuICAgICAgICAgICAgcHI6IHdYbWwuY2hpbGRyZW4uZmluZCgoe25hbWV9KSA9PiBuYW1lID09IFwidzpwUHJcIiksXHJcbiAgICAgICAgICAgIGNoaWxkcmVuOiB3WG1sLmNoaWxkcmVuLmZpbHRlcigoe25hbWV9KSA9PiBuYW1lICE9IFwidzpwUHJcIilcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBwUHIgPSAkLmZpbmQoXCJ3XFxcXDpwUHJcIilcclxuICAgICAgICBpZiAocFByLmxlbmd0aCkge1xyXG4gICAgICAgICAgICBsZXQgc3R5bGVJZCA9IHBQci5maW5kKFwid1xcXFw6cFN0eWxlXCIpLmF0dHIoXCJ3OnZhbFwiKVxyXG5cclxuICAgICAgICAgICAgbGV0IG51bVByID0gcFByLmZpbmQoXCJ3XFxcXDpudW1Qcj53XFxcXDpudW1JZFwiKVxyXG4gICAgICAgICAgICBpZiAoIW51bVByLmxlbmd0aCAmJiBzdHlsZUlkKSB7XHJcbiAgICAgICAgICAgICAgICBudW1QciA9IG9mZmljZURvY3VtZW50LnN0eWxlcyhgd1xcXFw6c3R5bGVbd1xcXFw6c3R5bGVJZD1cIiR7c3R5bGVJZH1cIl0gd1xcXFw6bnVtUHI+d1xcXFw6bnVtSWRgKVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAobnVtUHIubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICBpZGVudGl0eS50eXBlID0gXCJsaXN0XCJcclxuICAgICAgICAgICAgICAgIGlkZW50aXR5Lm51bUlkID0gbnVtUHIuZmluZChcIndcXFxcOm51bUlkXCIpLmF0dHIoXCJ3OnZhbFwiKVxyXG4gICAgICAgICAgICAgICAgaWRlbnRpdHkubGV2ZWwgPSBudW1Qci5maW5kKFwid1xcXFw6aWx2bFwiKS5hdHRyKFwidzp2YWxcIilcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGxldCBvdXRsaW5lTHZsID0gcFByLmZpbmQoXCJ3XFxcXDpvdXRsaW5lTHZsXCIpLmF0dHIoXCJ3OnZhbFwiKVxyXG4gICAgICAgICAgICAgICAgaWYgKCFvdXRsaW5lTHZsICYmIHN0eWxlSWQpXHJcbiAgICAgICAgICAgICAgICAgICAgb3V0bGluZUx2bCA9IG9mZmljZURvY3VtZW50LnN0eWxlcyhgd1xcXFw6c3R5bGVbd1xcXFw6c3R5bGVJZD1cIiR7c3R5bGVJZH1cIl0gd1xcXFw6b3V0bGluZUx2bGApLmF0dHIoXCJ3OnZhbFwiKVxyXG5cclxuICAgICAgICAgICAgICAgIGlmIChvdXRsaW5lTHZsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWRlbnRpdHkudHlwZSA9IFwiaGVhZGluZ1wiXHJcbiAgICAgICAgICAgICAgICAgICAgaWRlbnRpdHkubGV2ZWwgPSBwYXJzZUludChvdXRsaW5lTHZsKSArIDFcclxuICAgICAgICAgICAgICAgICAgICBpZGVudGl0eS5zdHlsZUlkID0gc3R5bGVJZFxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlkZW50aXR5Lnd0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gJC5maW5kKCd3XFxcXDp0JykubWFwKGZ1bmN0aW9uIChpbmRleCwgZWxlbWVudCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGVsZW1lbnQuY2hpbGRyZW47XHJcbiAgICAgICAgICAgIH0pLmdldCgpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHJldHVybiBpZGVudGl0eVxyXG4gICAgfSxcclxuICAgIHIod1htbCwgb2ZmaWNlRG9jdW1lbnQpIHtcclxuICAgICAgICBsZXQgJCA9IG9mZmljZURvY3VtZW50LmNvbnRlbnQod1htbCk7XHJcbiAgICAgICAgbGV0IHJQciA9IHdYbWwuY2hpbGRyZW4uZmluZCgoe25hbWV9KSA9PiBuYW1lID09IFwidzpyUHJcIilcclxuICAgICAgICB2YXIgcGFyZW50X3BQcl9yUHIgPSAkLnBhcmVudChcIndcXFxcOnBcIikuZmluZChcIndcXFxcOnBQcj53XFxcXDpyUHJcIilcclxuXHJcbiAgICAgICAgaWYgKHBhcmVudF9wUHJfclByLmxlbmd0aCkge1xyXG4gICAgICAgICAgICBpZihyUHIubGVuZ3RoKVxyXG4gICAgICAgICAgICAgICAgclByLmNvbmNhdChwUHJfclByKVxyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICByUHIgPSBwUHJfclByXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB7dHlwZTogXCJyXCIsIHByOiByUHIsIGNoaWxkcmVuOiB3WG1sLmNoaWxkcmVuLmZpbHRlcigoe25hbWV9KSA9PiBuYW1lICE9IFwidzpyUHJcIil9XHJcbiAgICB9LFxyXG4gICAgZmxkQ2hhcih3WG1sLCBvZmZpY2VEb2N1bWVudCkge1xyXG4gICAgICAgIHJldHVybiB3WG1sLmF0dHJpYnNbXCJ3OmZsZENoYXJUeXBlXCJdXHJcbiAgICB9LFxyXG5cclxuICAgIGlubGluZSh3WG1sLCBvZmZpY2VEb2N1bWVudCkge1xyXG4gICAgICAgIGxldCAkID0gb2ZmaWNlRG9jdW1lbnQuY29udGVudCh3WG1sKVxyXG4gICAgICAgIHJldHVybiB7dHlwZTogYGRyYXdpbmcuaW5saW5lYCwgY2hpbGRyZW46ICQuZmluZCgnYVxcXFw6Z3JhcGhpYz5hXFxcXDpncmFwaGljRGF0YScpLmNoaWxkcmVuKCkudG9BcnJheSgpfVxyXG4gICAgfSxcclxuICAgIGFuY2hvcih3WG1sLCBvZmZpY2VEb2N1bWVudCkge1xyXG4gICAgICAgIGxldCAkID0gb2ZmaWNlRG9jdW1lbnQuY29udGVudCh3WG1sKVxyXG4gICAgICAgIGxldCBncmFwaGljRGF0YSA9ICQuZmluZCgnYVxcXFw6Z3JhcGhpYz5hXFxcXDpncmFwaGljRGF0YScpXHJcbiAgICAgICAgbGV0IHR5cGUgPSBncmFwaGljRGF0YS5hdHRyKFwidXJpXCIpLnNwbGl0KFwiL1wiKS5wb3AoKVxyXG4gICAgICAgIGxldCBjaGlsZHJlbiA9IGdyYXBoaWNEYXRhLmNoaWxkcmVuKCkudG9BcnJheSgpXHJcbiAgICAgICAgaWYgKHR5cGUgPT0gXCJ3b3JkcHJvY2Vzc2luZ0dyb3VwXCIpXHJcbiAgICAgICAgICAgIGNoaWxkcmVuID0gY2hpbGRyZW5bMF0uY2hpbGRyZW4uZmlsdGVyKGEgPT4gYS5uYW1lLnNwbGl0KFwiOlwiKVswXSAhPSBcIndwZ1wiKVxyXG5cclxuICAgICAgICByZXR1cm4ge3R5cGU6IFwiZHJhd2luZy5hbmNob3JcIiwgY2hpbGRyZW59XHJcbiAgICB9LFxyXG4gICAgcGljKHdYbWwsIG9mZmljZURvY3VtZW50KSB7XHJcbiAgICAgICAgbGV0IGJsaXAgPSBvZmZpY2VEb2N1bWVudC5jb250ZW50KHdYbWwpLmZpbmQoXCJhXFxcXDpibGlwXCIpXHJcbiAgICAgICAgbGV0IHJpZCA9IGJsaXAuYXR0cigncjplbWJlZCcpIHx8IGJsaXAuYXR0cigncjpsaW5rJylcclxuICAgICAgICByZXR1cm4ge3R5cGU6IFwicGljdHVyZVwiLCAuLi5vZmZpY2VEb2N1bWVudC5nZXRSZWwocmlkKX1cclxuICAgIH0sXHJcbiAgICB3c3Aod1htbCwgb2ZmaWNlRG9jdW1lbnQpIHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICB0eXBlOiBcInNoYXBlXCIsXHJcbiAgICAgICAgICAgIGNoaWxkcmVuOiBvZmZpY2VEb2N1bWVudC5jb250ZW50KHdYbWwpLmZpbmQoXCI+d3BzXFxcXDp0eGJ4PndcXFxcOnR4YnhDb250ZW50XCIpLmNoaWxkcmVuKCkudG9BcnJheSgpXHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIEZhbGxiYWNrKCkge1xyXG4gICAgICAgIHJldHVybiBudWxsXHJcbiAgICB9LFxyXG4gICAgc2R0KHdYbWwsIG9mZmljZURvY3VtZW50KSB7XHJcbiAgICAgICAgbGV0ICQgPSBvZmZpY2VEb2N1bWVudC5jb250ZW50KHdYbWwpXHJcbiAgICAgICAgbGV0IHByID0gJC5maW5kKCc+d1xcXFw6c2R0UHInKVxyXG4gICAgICAgIGxldCBjb250ZW50ID0gJC5maW5kKCc+d1xcXFw6c2R0Q29udGVudCcpXHJcbiAgICAgICAgbGV0IGNoaWxkcmVuID0gY29udGVudC5jaGlsZHJlbigpLnRvQXJyYXkoKVxyXG5cclxuICAgICAgICBsZXQgZWxCaW5kaW5nID0gcHIuZmluZCgnd1xcXFw6ZGF0YUJpbmRpbmcnKS5nZXQoMClcclxuICAgICAgICBpZiAoZWxCaW5kaW5nKSB7Ly9wcm9wZXJ0aWVzXHJcbiAgICAgICAgICAgIGxldCBwYXRoID0gZWxCaW5kaW5nLmF0dHJpYnNbJ3c6eHBhdGgnXSxcclxuICAgICAgICAgICAgICAgIGQgPSBwYXRoLnNwbGl0KC9bXFwvXFw6XFxbXS8pLFxyXG4gICAgICAgICAgICAgICAgbmFtZSA9IChkLnBvcCgpLCBkLnBvcCgpKTtcclxuICAgICAgICAgICAgbGV0IHZhbHVlID0gY29udGVudC50ZXh0KClcclxuXHJcbiAgICAgICAgICAgIHJldHVybiB7dHlwZTogXCJwcm9wZXJ0eVwiLCBuYW1lLCB2YWx1ZSwgY2hpbGRyZW59XHJcbiAgICAgICAgfSBlbHNlIHsvL2NvbnRyb2xzXHJcbiAgICAgICAgICAgIGxldCBwckNoaWxkcmVuID0gcHIuZ2V0KDApLmNoaWxkcmVuXHJcbiAgICAgICAgICAgIGxldCBlbFR5cGUgPSBwckNoaWxkcmVuW3ByQ2hpbGRyZW4ubGVuZ3RoIC0gMV1cclxuICAgICAgICAgICAgbGV0IG5hbWUgPSBlbFR5cGUubmFtZS5zcGxpdChcIjpcIikucG9wKClcclxuICAgICAgICAgICAgbGV0IHR5cGUgPSBcInRleHQscGljdHVyZSxkb2NQYXJ0TGlzdCxjb21ib0JveCxkcm9wRG93bkxpc3QsZGF0ZSxjaGVja2JveCxyZXBlYXRpbmdTZWN0aW9uLHJlcGVhdGluZ1NlY3Rpb25JdGVtXCIuc3BsaXQoXCIsXCIpXHJcbiAgICAgICAgICAgICAgICAuZmluZChhID0+IGEgPT0gbmFtZSlcclxuICAgICAgICAgICAgbGV0IG1vZGVsID0ge2NoaWxkcmVufVxyXG4gICAgICAgICAgICBpZiAodHlwZSkge1xyXG4gICAgICAgICAgICAgICAgbW9kZWwudHlwZSA9IGBjb250cm9sLiR7dHlwZX1gXHJcbiAgICAgICAgICAgIH0gZWxzZSB7Ly9jb250YWluZXJcclxuICAgICAgICAgICAgICAgIGlmIChjb250ZW50LmZpbmQoXCJ3XFxcXDpwLHdcXFxcOnRibCx3XFxcXDp0cix3XFxcXDp0Y1wiKS5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgICAgICBtb2RlbC50eXBlID0gXCJibG9ja1wiXHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIG1vZGVsLnR5cGUgPSBcImlubGluZVwiXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICQgPSBvZmZpY2VEb2N1bWVudC5jb250ZW50XHJcbiAgICAgICAgICAgIHN3aXRjaCAobW9kZWwudHlwZSkge1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcImNvbnRyb2wuZHJvcERvd25MaXN0XCI6XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwiY29udHJvbC5jb21ib0JveFwiOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHNlbGVjdGVkID0gJChjb250ZW50KS50ZXh0KClcclxuICAgICAgICAgICAgICAgICAgICBtb2RlbC5vcHRpb25zID0gJChlbFR5cGUpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5maW5kKFwid1xcXFw6bGlzdEl0ZW1cIilcclxuICAgICAgICAgICAgICAgICAgICAgICAgLm1hcCgoaSwgbGkpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlzcGxheVRleHQ6IGxpLmF0dHJpYnNbXCJ3OmRpc3BsYXlUZXh0XCJdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiBsaS5hdHRyaWJzW1widzp2YWx1ZVwiXVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAuZ2V0KClcclxuICAgICAgICAgICAgICAgICAgICBtb2RlbC52YWx1ZSA9IChtb2RlbC5vcHRpb25zLmZpbmQoYSA9PiBhLmRpc3BsYXlUZXh0ID09IHNlbGVjdGVkKSB8fCB7fSkudmFsdWVcclxuICAgICAgICAgICAgICAgICAgICBicmVha1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgY2FzZSBcImNvbnRyb2wuY2hlY2tib3hcIjoge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBucyA9IGVsVHlwZS5uYW1lLnNwbGl0KFwiOlwiKVswXVxyXG4gICAgICAgICAgICAgICAgICAgIG1vZGVsLmNoZWNrZWQgPSAkKGVsVHlwZSkuZmluZChgJHtuc31cXFxcOmNoZWNrZWRgKS5hdHRyKGAke25zfTp2YWxgKSA9PSBcIjFcIlxyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwiY29udHJvbC50ZXh0XCI6XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNvbnRlbnQuZmluZCgnd1xcXFw6ciBbd1xcXFw6dmFsfj1QbGFjZWhvbGRlcl0nKS5sZW5ndGggPT0gMClcclxuICAgICAgICAgICAgICAgICAgICAgICAgbW9kZWwudmFsdWUgPSBjb250ZW50LnRleHQoKVxyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXHJcbiAgICAgICAgICAgICAgICBjYXNlIFwiY29udHJvbC5kYXRlXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgbW9kZWwudmFsdWUgPSBuZXcgRGF0ZSgkKGVsVHlwZSkuYXR0cihcInc6ZnVsbERhdGVcIikpXHJcbiAgICAgICAgICAgICAgICAgICAgbW9kZWwuZm9ybWF0ID0gJChlbFR5cGUpLmZpbmQoXCJ3XFxcXDpkYXRlRm9ybWF0XCIpLmF0dHIoXCJ3OnZhbFwiKVxyXG4gICAgICAgICAgICAgICAgICAgIG1vZGVsLmxvY2FsZSA9ICQoZWxUeXBlKS5maW5kKFwid1xcXFw6bGlkXCIpLmF0dHIoXCJ3OnZhbFwiKVxyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIG1vZGVsXHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIGh5cGVybGluayh3WG1sLCBvZmZpY2VEb2N1bWVudCkge1xyXG4gICAgICAgIGlmICh3WG1sLmF0dHJpYnNbXCJyOmlkXCJdKSB7XHJcbiAgICAgICAgICAgIGxldCB1cmwgPSBvZmZpY2VEb2N1bWVudC5nZXRSZWwod1htbC5hdHRyaWJzW1wicjppZFwiXSlcclxuICAgICAgICAgICAgcmV0dXJuIHt0eXBlOiBcImh5cGVybGlua1wiLCB1cmx9O1xyXG4gICAgICAgIH0gZWxzZSBpZiAod1htbC5hdHRyaWJzWyd3OmFuY2hvciddKSB7XHJcbiAgICAgICAgICAgIGxldCBuYW1lID0gd1htbC5hdHRyaWJzWyd3OmFuY2hvciddOyAvL1RPRE9cclxuICAgICAgICAgICAgcmV0dXJuIHt0eXBlOiAnYW5jaG9yJywgbmFtZX07XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIHRibCh3WG1sLCBvZmZpY2VEb2N1bWVudCkge1xyXG4gICAgICAgIHJldHVybiB3WG1sLmNoaWxkcmVuLnJlZHVjZSgoc3RhdGUsIG5vZGUpID0+IHtcclxuICAgICAgICAgICAgc3dpdGNoIChub2RlLm5hbWUpIHtcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJ3OnRibFByXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgc3RhdGUucHIgPSBub2RlXHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJ3OnRibEdyaWRcIjpcclxuICAgICAgICAgICAgICAgICAgICBzdGF0ZS5jb2xzID0gbm9kZS5jaGlsZHJlblxyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXHJcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgICAgIHN0YXRlLmNoaWxkcmVuLnB1c2gobm9kZSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gc3RhdGVcclxuICAgICAgICB9LCB7dHlwZTogXCJ0YmxcIiwgY2hpbGRyZW46IFtdLCBwcjogbnVsbCwgY29sczogW119KVxyXG4gICAgfSxcclxuICAgIHRyKHdYbWwsIG9mZmljZURvY3VtZW50KSB7XHJcbiAgICAgICAgcmV0dXJuIHdYbWwuY2hpbGRyZW4ucmVkdWNlKChzdGF0ZSwgbm9kZSkgPT4ge1xyXG4gICAgICAgICAgICBzd2l0Y2ggKG5vZGUubmFtZSkge1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcInc6dHJQclwiOlxyXG4gICAgICAgICAgICAgICAgICAgIHN0YXRlLnByID0gbm9kZVxyXG4gICAgICAgICAgICAgICAgICAgIHN0YXRlLmlzSGVhZGVyID0gISFub2RlLmNoaWxkcmVuLmZpbmQoYSA9PiBhLm5hbWUgPT0gXCJ3OnRibEhlYWRlclwiKVxyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXHJcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgICAgIHN0YXRlLmNoaWxkcmVuLnB1c2gobm9kZSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gc3RhdGVcclxuICAgICAgICB9LCB7dHlwZTogXCJ0clwiLCBjaGlsZHJlbjogW10sIHByOiBudWxsfSlcclxuICAgIH0sXHJcbiAgICB0Yyh3WG1sLCBvZmZpY2VEb2N1bWVudCkge1xyXG4gICAgICAgIHJldHVybiB3WG1sLmNoaWxkcmVuLnJlZHVjZSgoc3RhdGUsIG5vZGUpID0+IHtcclxuICAgICAgICAgICAgc3dpdGNoIChub2RlLm5hbWUpIHtcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJ3OnRjUHJcIjpcclxuICAgICAgICAgICAgICAgICAgICBzdGF0ZS5wciA9IG5vZGVcclxuICAgICAgICAgICAgICAgICAgICBicmVha1xyXG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgICAgICBzdGF0ZS5jaGlsZHJlbi5wdXNoKG5vZGUpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHN0YXRlXHJcbiAgICAgICAgfSwge3R5cGU6IFwidGNcIiwgY2hpbGRyZW46IFtdLCBwcjogbnVsbH0pXHJcbiAgICB9LFxyXG4gICAgYWx0Q2h1bmsod1htbCwgb2ZmaWNlRG9jdW1lbnQpIHtcclxuICAgICAgICBsZXQgcklkID0gd1htbC5hdHRyaWJzWydyOmlkJ11cclxuICAgICAgICBsZXQgZGF0YSA9IG9mZmljZURvY3VtZW50LmdldFJlbChySWQpXHJcblxyXG4gICAgICAgIGxldCBwYXJ0TmFtZSA9IG9mZmljZURvY3VtZW50LmZvbGRlciArIG9mZmljZURvY3VtZW50LnJlbHMoYFtJZD0ke3JJZH1dYCkuYXR0cihcIlRhcmdldFwiKVxyXG4gICAgICAgIGxldCBjb250ZW50VHlwZSA9IG9mZmljZURvY3VtZW50LmRvYy5jb250ZW50VHlwZXMoYE92ZXJyaWRlW1BhcnROYW1lPScke3BhcnROYW1lfSddYCkuYXR0cihcIkNvbnRlbnRUeXBlXCIpXHJcbiAgICAgICAgcmV0dXJuIHt0eXBlOiBcImNodW5rXCIsIGRhdGEsIGNvbnRlbnRUeXBlfVxyXG4gICAgfSxcclxuICAgIGRvY0RlZmF1bHRzKHdYbWwpIHtcclxuICAgICAgICByZXR1cm4ge3R5cGU6IFwic3R5bGVcIn1cclxuICAgIH0sXHJcbiAgICBzdHlsZSh3WG1sKSB7XHJcbiAgICAgICAgcmV0dXJuIHt0eXBlOiBcInN0eWxlXCIsIGlkOiB3WG1sLmF0dHJpYnNbJ3c6c3R5bGVJZCddfVxyXG4gICAgfSxcclxuICAgIGFic3RyYWN0TnVtKHdYbWwpIHtcclxuICAgICAgICByZXR1cm4ge3R5cGU6IFwiYWJzdHJhY3ROdW1cIiwgaWQ6IHdYbWwuYXR0cmlic1tcInc6YWJzdHJhY3ROdW1JZFwiXX1cclxuICAgIH0sXHJcbiAgICBudW0od1htbCkge1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHR5cGU6IFwibnVtXCIsXHJcbiAgICAgICAgICAgIGlkOiB3WG1sLmF0dHJpYnNbXCJ3Om51bUlkXCJdLFxyXG4gICAgICAgICAgICBhYnN0cmFjdE51bTogd1htbC5jaGlsZHJlbi5maW5kKGEgPT4gYS5uYW1lID09IFwidzphYnN0cmFjdE51bUlkXCIpLmF0dHJpYnNbXCJ3OnZhbFwiXVxyXG4gICAgICAgIH1cclxuICAgIH0sXHJcbiAgICBsYXRlbnRTdHlsZXMoKSB7XHJcbiAgICAgICAgcmV0dXJuIG51bGxcclxuICAgIH0sXHJcbiAgICBvYmplY3Qod1htbCwgb2ZmaWNlRG9jdW1lbnQpIHtcclxuICAgICAgICBsZXQgb2xlID0gb2ZmaWNlRG9jdW1lbnQuY29udGVudCh3WG1sKS5maW5kKFwib1xcXFw6T0xFT2JqZWN0XCIpXHJcbiAgICAgICAgbGV0IHR5cGUgPSBvbGUuYXR0cihcIlByb2dJRFwiKVxyXG4gICAgICAgIGxldCBlbWJlZCA9IG9sZS5hdHRyKFwiVHlwZVwiKSA9PT0gXCJFbWJlZFwiXHJcbiAgICAgICAgbGV0IHJJZCA9IG9sZS5hdHRyKFwicjppZFwiKVxyXG4gICAgICAgIHJldHVybiB7dHlwZTogXCJvYmplY3RcIiwgZW1iZWQsIHByb2c6IHR5cGUsIGRhdGE6IG9mZmljZURvY3VtZW50LmdldFJlbE9sZU9iamVjdChySWQpfVxyXG4gICAgfVxyXG59XHJcbiJdfQ==