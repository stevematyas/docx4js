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
        var pr = wXml.children.find(function (_ref3) {
            var name = _ref3.name;
            return name == "w:rPr";
        });
        var parent_pPr_rPr = $.parent("w\\:p").find("w\\:pPr>w\\:rPr");

        if (parent_pPr_rPr.length) {
            pr.push(pPr_rPr);
        }
        return { type: "r", pr: pr, children: wXml.children.filter(function (_ref4) {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9vcGVueG1sL2RvY3gvb2ZmaWNlRG9jdW1lbnQuanMiXSwibmFtZXMiOlsiT2ZmaWNlRG9jdW1lbnQiLCJzdXBwb3J0ZWQiLCJzcGxpdCIsInJlbHMiLCJlYWNoIiwiaSIsInJlbCIsIiQiLCJ0eXBlIiwiYXR0ciIsInBvcCIsImluZGV4T2YiLCJ0YXJnZXQiLCJPYmplY3QiLCJkZWZpbmVQcm9wZXJ0eSIsImdldCIsImdldFJlbE9iamVjdCIsImNyZWF0ZUVsZW1lbnQiLCJpZGVudGlmeSIsInN0eWxlcyIsInJlbmRlck5vZGUiLCJudW1iZXJpbmciLCJjb250ZW50IiwiZG9tSGFuZGxlciIsImRvYyIsImJpbmQiLCJfaWRlbnRpZnkiLCJtb2RlbCIsImFyZ3VtZW50cyIsImVtaXQiLCJkb2N1bWVudCIsIndYbWwiLCJvZmZpY2VEb2N1bWVudCIsInRhZyIsIm5hbWUiLCJpZGVudGl0aWVzIiwiY3VycmVudCIsImNoaWxkcmVuIiwic2VjdCIsImVuZCIsImNsb3Nlc3QiLCJwcmV2VW50aWwiLCJ0b0FycmF5IiwicmV2ZXJzZSIsImlzIiwicHVzaCIsInNlY3RQciIsImhmIiwiZmlsdGVyIiwiYSIsInJlZHVjZSIsImhlYWRlcnMiLCJzZXQiLCJhdHRyaWJzIiwiZ2V0UmVsIiwiTWFwIiwiZm9vdGVycyIsImhhc1RpdGxlUGFnZSIsImZpbmQiLCJwIiwiaWRlbnRpdHkiLCJwciIsInBQciIsImxlbmd0aCIsInN0eWxlSWQiLCJudW1QciIsIm51bUlkIiwibGV2ZWwiLCJvdXRsaW5lTHZsIiwicGFyc2VJbnQiLCJ3dCIsIm1hcCIsImluZGV4IiwiZWxlbWVudCIsInIiLCJwYXJlbnRfcFByX3JQciIsInBhcmVudCIsInBQcl9yUHIiLCJmbGRDaGFyIiwiaW5saW5lIiwiYW5jaG9yIiwiZ3JhcGhpY0RhdGEiLCJwaWMiLCJibGlwIiwicmlkIiwid3NwIiwiRmFsbGJhY2siLCJzZHQiLCJlbEJpbmRpbmciLCJwYXRoIiwiZCIsInZhbHVlIiwidGV4dCIsInByQ2hpbGRyZW4iLCJlbFR5cGUiLCJzZWxlY3RlZCIsIm9wdGlvbnMiLCJsaSIsImRpc3BsYXlUZXh0IiwibnMiLCJjaGVja2VkIiwiRGF0ZSIsImZvcm1hdCIsImxvY2FsZSIsImh5cGVybGluayIsInVybCIsInRibCIsInN0YXRlIiwibm9kZSIsImNvbHMiLCJ0ciIsImlzSGVhZGVyIiwidGMiLCJhbHRDaHVuayIsInJJZCIsImRhdGEiLCJwYXJ0TmFtZSIsImZvbGRlciIsImNvbnRlbnRUeXBlIiwiY29udGVudFR5cGVzIiwiZG9jRGVmYXVsdHMiLCJzdHlsZSIsImlkIiwiYWJzdHJhY3ROdW0iLCJudW0iLCJsYXRlbnRTdHlsZXMiLCJvYmplY3QiLCJvbGUiLCJlbWJlZCIsInByb2ciLCJnZXRSZWxPbGVPYmplY3QiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQUFBOzs7Ozs7Ozs7Ozs7SUFFYUEsYyxXQUFBQSxjOzs7Ozs7Ozs7OztnQ0FDRDtBQUFBOztBQUNKO0FBQ0EsZ0JBQU1DLFlBQVksa0NBQWtDQyxLQUFsQyxDQUF3QyxHQUF4QyxDQUFsQjtBQUNBLGlCQUFLQyxJQUFMLG1DQUEwQ0MsSUFBMUMsQ0FBK0MsVUFBQ0MsQ0FBRCxFQUFJQyxHQUFKLEVBQVk7QUFDdkQsb0JBQUlDLElBQUksT0FBS0osSUFBTCxDQUFVRyxHQUFWLENBQVI7QUFDQSxvQkFBSUUsT0FBT0QsRUFBRUUsSUFBRixDQUFPLE1BQVAsRUFBZVAsS0FBZixDQUFxQixHQUFyQixFQUEwQlEsR0FBMUIsRUFBWDtBQUNBLG9CQUFJVCxVQUFVVSxPQUFWLENBQWtCSCxJQUFsQixLQUEyQixDQUFDLENBQWhDLEVBQW1DO0FBQy9CLHdCQUFJSSxTQUFTTCxFQUFFRSxJQUFGLENBQU8sUUFBUCxDQUFiO0FBQ0FJLDJCQUFPQyxjQUFQLFNBQTRCTixJQUE1QixFQUFrQztBQUM5Qk8sMkJBRDhCLGlCQUN4QjtBQUNGLG1DQUFPLEtBQUtDLFlBQUwsQ0FBa0JKLE1BQWxCLENBQVA7QUFDSDtBQUg2Qixx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S0FuUHFCO0FBb1B0QnVFLE9BcFBzQixlQW9QbEI3RixJQXBQa0IsRUFvUFo7QUFDTixlQUFPO0FBQ0h2QixrQkFBTSxLQURIO0FBRUhrSCxnQkFBSTNGLEtBQUtzQixPQUFMLENBQWEsU0FBYixDQUZEO0FBR0hzRSx5QkFBYTVGLEtBQUtNLFFBQUwsQ0FBY3FCLElBQWQsQ0FBbUI7QUFBQSx1QkFBS1QsRUFBRWYsSUFBRixJQUFVLGlCQUFmO0FBQUEsYUFBbkIsRUFBcURtQixPQUFyRCxDQUE2RCxPQUE3RDtBQUhWLFNBQVA7QUFLSCxLQTFQcUI7QUEyUHRCd0UsZ0JBM1BzQiwwQkEyUFA7QUFDWCxlQUFPLElBQVA7QUFDSCxLQTdQcUI7QUE4UHRCQyxVQTlQc0Isa0JBOFBmL0YsSUE5UGUsRUE4UFRDLGNBOVBTLEVBOFBPO0FBQ3pCLFlBQUkrRixNQUFNL0YsZUFBZVYsT0FBZixDQUF1QlMsSUFBdkIsRUFBNkIyQixJQUE3QixDQUFrQyxlQUFsQyxDQUFWO0FBQ0EsWUFBSWxELE9BQU91SCxJQUFJdEgsSUFBSixDQUFTLFFBQVQsQ0FBWDtBQUNBLFlBQUl1SCxRQUFRRCxJQUFJdEgsSUFBSixDQUFTLE1BQVQsTUFBcUIsT0FBakM7QUFDQSxZQUFJeUcsTUFBTWEsSUFBSXRILElBQUosQ0FBUyxNQUFULENBQVY7QUFDQSxlQUFPLEVBQUNELE1BQU0sUUFBUCxFQUFpQndILFlBQWpCLEVBQXdCQyxNQUFNekgsSUFBOUIsRUFBb0MyRyxNQUFNbkYsZUFBZWtHLGVBQWYsQ0FBK0JoQixHQUEvQixDQUExQyxFQUFQO0FBQ0g7QUFwUXFCLENBQW5CIiwiZmlsZSI6Im9mZmljZURvY3VtZW50LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFBhcnQgZnJvbSBcIi4uL3BhcnRcIlxyXG5cclxuZXhwb3J0IGNsYXNzIE9mZmljZURvY3VtZW50IGV4dGVuZHMgUGFydCB7XHJcbiAgICBfaW5pdCgpIHtcclxuICAgICAgICBzdXBlci5faW5pdCgpXHJcbiAgICAgICAgY29uc3Qgc3VwcG9ydGVkID0gXCJzdHlsZXMsbnVtYmVyaW5nLHRoZW1lLHNldHRpbmdzXCIuc3BsaXQoXCIsXCIpXHJcbiAgICAgICAgdGhpcy5yZWxzKGBSZWxhdGlvbnNoaXBbVGFyZ2V0JD1cIi54bWxcIl1gKS5lYWNoKChpLCByZWwpID0+IHtcclxuICAgICAgICAgICAgbGV0ICQgPSB0aGlzLnJlbHMocmVsKVxyXG4gICAgICAgICAgICBsZXQgdHlwZSA9ICQuYXR0cihcIlR5cGVcIikuc3BsaXQoXCIvXCIpLnBvcCgpXHJcbiAgICAgICAgICAgIGlmIChzdXBwb3J0ZWQuaW5kZXhPZih0eXBlKSAhPSAtMSkge1xyXG4gICAgICAgICAgICAgICAgbGV0IHRhcmdldCA9ICQuYXR0cihcIlRhcmdldFwiKVxyXG4gICAgICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsIHR5cGUsIHtcclxuICAgICAgICAgICAgICAgICAgICBnZXQoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmdldFJlbE9iamVjdCh0YXJnZXQpXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICB9XHJcblxyXG4gICAgcmVuZGVyKGNyZWF0ZUVsZW1lbnQsIGlkZW50aWZ5ID0gT2ZmaWNlRG9jdW1lbnQuaWRlbnRpZnkpIHtcclxuICAgICAgICBpZiAodGhpcy5zdHlsZXMpXHJcbiAgICAgICAgICAgIHRoaXMucmVuZGVyTm9kZSh0aGlzLnN0eWxlcyhcIndcXFxcOnN0eWxlc1wiKS5nZXQoMCksIGNyZWF0ZUVsZW1lbnQsIGlkZW50aWZ5KVxyXG4gICAgICAgIGlmICh0aGlzLm51bWJlcmluZylcclxuICAgICAgICAgICAgdGhpcy5yZW5kZXJOb2RlKHRoaXMubnVtYmVyaW5nKFwid1xcXFw6bnVtYmVyaW5nXCIpLmdldCgwKSwgY3JlYXRlRWxlbWVudCwgaWRlbnRpZnkpXHJcbiAgICAgICAgcmV0dXJuIHRoaXMucmVuZGVyTm9kZSh0aGlzLmNvbnRlbnQoXCJ3XFxcXDpkb2N1bWVudFwiKS5nZXQoMCksIGNyZWF0ZUVsZW1lbnQsIGlkZW50aWZ5KVxyXG4gICAgfVxyXG5cclxuICAgIHBhcnNlKGRvbUhhbmRsZXIsIGlkZW50aWZ5ID0gT2ZmaWNlRG9jdW1lbnQuaWRlbnRpZnkpIHtcclxuICAgICAgICBjb25zdCBkb2MgPSB7fVxyXG4gICAgICAgIGNvbnN0IGNyZWF0ZUVsZW1lbnQgPSBkb21IYW5kbGVyLmNyZWF0ZUVsZW1lbnQuYmluZChkb21IYW5kbGVyKVxyXG5cclxuICAgICAgICBmdW5jdGlvbiBfaWRlbnRpZnkoKSB7XHJcbiAgICAgICAgICAgIGxldCBtb2RlbCA9IGlkZW50aWZ5KC4uLmFyZ3VtZW50cylcclxuICAgICAgICAgICAgaWYgKG1vZGVsICYmIHR5cGVvZihtb2RlbCkgPT0gXCJvYmplY3RcIikge1xyXG4gICAgICAgICAgICAgICAgZG9tSGFuZGxlci5lbWl0KFwiKlwiLCBtb2RlbCwgLi4uYXJndW1lbnRzKVxyXG4gICAgICAgICAgICAgICAgZG9tSGFuZGxlci5lbWl0KG1vZGVsLnR5cGUsIG1vZGVsLCAuLi5hcmd1bWVudHMpXHJcbiAgICAgICAgICAgICAgICBpZiAoZG9tSGFuZGxlcltgb24ke21vZGVsLnR5cGV9YF0pXHJcbiAgICAgICAgICAgICAgICAgICAgZG9tSGFuZGxlcltgb24ke21vZGVsLnR5cGV9YF0obW9kZWwsIC4uLmFyZ3VtZW50cylcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gbW9kZWxcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLnN0eWxlcylcclxuICAgICAgICAgICAgZG9jLnN0eWxlcyA9IHRoaXMucmVuZGVyTm9kZSh0aGlzLnN0eWxlcyhcIndcXFxcOnN0eWxlc1wiKS5nZXQoMCksIGNyZWF0ZUVsZW1lbnQsIF9pZGVudGlmeSlcclxuICAgICAgICBpZiAodGhpcy5udW1iZXJpbmcpXHJcbiAgICAgICAgICAgIGRvYy5udW1iZXJpbmcgPSB0aGlzLnJlbmRlck5vZGUodGhpcy5udW1iZXJpbmcoXCJ3XFxcXDpudW1iZXJpbmdcIikuZ2V0KDApLCBjcmVhdGVFbGVtZW50LCBfaWRlbnRpZnkpXHJcbiAgICAgICAgZG9jLmRvY3VtZW50ID0gdGhpcy5yZW5kZXJOb2RlKHRoaXMuY29udGVudChcIndcXFxcOmRvY3VtZW50XCIpLmdldCgwKSwgY3JlYXRlRWxlbWVudCwgX2lkZW50aWZ5KVxyXG4gICAgICAgIHJldHVybiBkb2NcclxuICAgIH1cclxuXHJcbiAgICBzdGF0aWMgaWRlbnRpZnkod1htbCwgb2ZmaWNlRG9jdW1lbnQpIHtcclxuICAgICAgICBjb25zdCB0YWcgPSB3WG1sLm5hbWUuc3BsaXQoXCI6XCIpLnBvcCgpXHJcbiAgICAgICAgaWYgKGlkZW50aXRpZXNbdGFnXSlcclxuICAgICAgICAgICAgcmV0dXJuIGlkZW50aXRpZXNbdGFnXSguLi5hcmd1bWVudHMpXHJcblxyXG4gICAgICAgIHJldHVybiB0YWdcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgT2ZmaWNlRG9jdW1lbnRcclxuXHJcbmV4cG9ydCBjb25zdCBpZGVudGl0aWVzID0ge1xyXG4gICAgZG9jdW1lbnQod1htbCwgb2ZmaWNlRG9jdW1lbnQpIHtcclxuICAgICAgICBsZXQgJCA9IG9mZmljZURvY3VtZW50LmNvbnRlbnRcclxuICAgICAgICBsZXQgY3VycmVudCA9IG51bGxcclxuICAgICAgICBsZXQgY2hpbGRyZW4gPSAkKFwid1xcXFw6c2VjdFByXCIpLmVhY2goKGksIHNlY3QpID0+IHtcclxuICAgICAgICAgICAgbGV0IGVuZCA9ICQoc2VjdCkuY2xvc2VzdCgnd1xcXFw6Ym9keT4qJylcclxuICAgICAgICAgICAgc2VjdC5jb250ZW50ID0gZW5kLnByZXZVbnRpbChjdXJyZW50KS50b0FycmF5KCkucmV2ZXJzZSgpXHJcbiAgICAgICAgICAgIGlmICghZW5kLmlzKHNlY3QpKVxyXG4gICAgICAgICAgICAgICAgc2VjdC5jb250ZW50LnB1c2goZW5kLmdldCgwKSlcclxuICAgICAgICAgICAgY3VycmVudCA9IGVuZFxyXG4gICAgICAgIH0pLnRvQXJyYXkoKVxyXG4gICAgICAgIHJldHVybiB7dHlwZTogXCJkb2N1bWVudFwiLCBjaGlsZHJlbn1cclxuICAgIH0sXHJcbiAgICBzZWN0UHIod1htbCwgb2ZmaWNlRG9jdW1lbnQpIHtcclxuICAgICAgICBjb25zdCBoZiA9IHR5cGUgPT4gd1htbC5jaGlsZHJlbi5maWx0ZXIoYSA9PiBhLm5hbWUgPT0gYHc6JHt0eXBlfVJlZmVyZW5jZWApLnJlZHVjZSgoaGVhZGVycywgYSkgPT4ge1xyXG4gICAgICAgICAgICBoZWFkZXJzLnNldChhLmF0dHJpYnNbXCJ3OnR5cGVcIl0sIG9mZmljZURvY3VtZW50LmdldFJlbChhLmF0dHJpYnNbXCJyOmlkXCJdKSlcclxuICAgICAgICAgICAgcmV0dXJuIGhlYWRlcnNcclxuICAgICAgICB9LCBuZXcgTWFwKCkpXHJcblxyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHR5cGU6IFwic2VjdGlvblwiLFxyXG4gICAgICAgICAgICBjaGlsZHJlbjogd1htbC5jb250ZW50LFxyXG4gICAgICAgICAgICBoZWFkZXJzOiBoZihcImhlYWRlclwiKSxcclxuICAgICAgICAgICAgZm9vdGVyczogaGYoXCJmb290ZXJcIiksXHJcbiAgICAgICAgICAgIGhhc1RpdGxlUGFnZTogISF3WG1sLmNoaWxkcmVuLmZpbmQoYSA9PiBhLm5hbWUgPT0gXCJ3OnRpdGxlUGdcIilcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG4gICAgcCh3WG1sLCBvZmZpY2VEb2N1bWVudCkge1xyXG4gICAgICAgIGxldCAkID0gb2ZmaWNlRG9jdW1lbnQuY29udGVudCh3WG1sKVxyXG4gICAgICAgIGxldCB0eXBlID0gXCJwXCJcclxuXHJcbiAgICAgICAgbGV0IGlkZW50aXR5ID0ge1xyXG4gICAgICAgICAgICB0eXBlLFxyXG4gICAgICAgICAgICBwcjogd1htbC5jaGlsZHJlbi5maW5kKCh7bmFtZX0pID0+IG5hbWUgPT0gXCJ3OnBQclwiKSxcclxuICAgICAgICAgICAgY2hpbGRyZW46IHdYbWwuY2hpbGRyZW4uZmlsdGVyKCh7bmFtZX0pID0+IG5hbWUgIT0gXCJ3OnBQclwiKVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IHBQciA9ICQuZmluZChcIndcXFxcOnBQclwiKVxyXG4gICAgICAgIGlmIChwUHIubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIGxldCBzdHlsZUlkID0gcFByLmZpbmQoXCJ3XFxcXDpwU3R5bGVcIikuYXR0cihcInc6dmFsXCIpXHJcblxyXG4gICAgICAgICAgICBsZXQgbnVtUHIgPSBwUHIuZmluZChcIndcXFxcOm51bVByPndcXFxcOm51bUlkXCIpXHJcbiAgICAgICAgICAgIGlmICghbnVtUHIubGVuZ3RoICYmIHN0eWxlSWQpIHtcclxuICAgICAgICAgICAgICAgIG51bVByID0gb2ZmaWNlRG9jdW1lbnQuc3R5bGVzKGB3XFxcXDpzdHlsZVt3XFxcXDpzdHlsZUlkPVwiJHtzdHlsZUlkfVwiXSB3XFxcXDpudW1Qcj53XFxcXDpudW1JZGApXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChudW1Qci5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgIGlkZW50aXR5LnR5cGUgPSBcImxpc3RcIlxyXG4gICAgICAgICAgICAgICAgaWRlbnRpdHkubnVtSWQgPSBudW1Qci5maW5kKFwid1xcXFw6bnVtSWRcIikuYXR0cihcInc6dmFsXCIpXHJcbiAgICAgICAgICAgICAgICBpZGVudGl0eS5sZXZlbCA9IG51bVByLmZpbmQoXCJ3XFxcXDppbHZsXCIpLmF0dHIoXCJ3OnZhbFwiKVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgbGV0IG91dGxpbmVMdmwgPSBwUHIuZmluZChcIndcXFxcOm91dGxpbmVMdmxcIikuYXR0cihcInc6dmFsXCIpXHJcbiAgICAgICAgICAgICAgICBpZiAoIW91dGxpbmVMdmwgJiYgc3R5bGVJZClcclxuICAgICAgICAgICAgICAgICAgICBvdXRsaW5lTHZsID0gb2ZmaWNlRG9jdW1lbnQuc3R5bGVzKGB3XFxcXDpzdHlsZVt3XFxcXDpzdHlsZUlkPVwiJHtzdHlsZUlkfVwiXSB3XFxcXDpvdXRsaW5lTHZsYCkuYXR0cihcInc6dmFsXCIpXHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKG91dGxpbmVMdmwpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZGVudGl0eS50eXBlID0gXCJoZWFkaW5nXCJcclxuICAgICAgICAgICAgICAgICAgICBpZGVudGl0eS5sZXZlbCA9IHBhcnNlSW50KG91dGxpbmVMdmwpICsgMVxyXG4gICAgICAgICAgICAgICAgICAgIGlkZW50aXR5LnN0eWxlSWQgPSBzdHlsZUlkXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgaWRlbnRpdHkud3QgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAkLmZpbmQoJ3dcXFxcOnQnKS5tYXAoZnVuY3Rpb24gKGluZGV4LCBlbGVtZW50KSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZWxlbWVudC5jaGlsZHJlbjtcclxuICAgICAgICAgICAgfSkuZ2V0KCk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGlkZW50aXR5XHJcbiAgICB9LFxyXG4gICAgcih3WG1sLCBvZmZpY2VEb2N1bWVudCkge1xyXG4gICAgICAgIGxldCAkID0gb2ZmaWNlRG9jdW1lbnQuY29udGVudCh3WG1sKTtcclxuICAgICAgICBsZXQgcHIgPSB3WG1sLmNoaWxkcmVuLmZpbmQoKHtuYW1lfSkgPT4gbmFtZSA9PSBcInc6clByXCIpXHJcbiAgICAgICAgdmFyIHBhcmVudF9wUHJfclByID0gJC5wYXJlbnQoXCJ3XFxcXDpwXCIpLmZpbmQoXCJ3XFxcXDpwUHI+d1xcXFw6clByXCIpXHJcblxyXG4gICAgICAgIGlmIChwYXJlbnRfcFByX3JQci5sZW5ndGgpIHtcclxuICAgICAgICAgICAgcHIucHVzaChwUHJfclByKVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4ge3R5cGU6IFwiclwiLCBwcjogcHIsIGNoaWxkcmVuOiB3WG1sLmNoaWxkcmVuLmZpbHRlcigoe25hbWV9KSA9PiBuYW1lICE9IFwidzpyUHJcIil9XHJcbiAgICB9LFxyXG4gICAgZmxkQ2hhcih3WG1sLCBvZmZpY2VEb2N1bWVudCkge1xyXG4gICAgICAgIHJldHVybiB3WG1sLmF0dHJpYnNbXCJ3OmZsZENoYXJUeXBlXCJdXHJcbiAgICB9LFxyXG5cclxuICAgIGlubGluZSh3WG1sLCBvZmZpY2VEb2N1bWVudCkge1xyXG4gICAgICAgIGxldCAkID0gb2ZmaWNlRG9jdW1lbnQuY29udGVudCh3WG1sKVxyXG4gICAgICAgIHJldHVybiB7dHlwZTogYGRyYXdpbmcuaW5saW5lYCwgY2hpbGRyZW46ICQuZmluZCgnYVxcXFw6Z3JhcGhpYz5hXFxcXDpncmFwaGljRGF0YScpLmNoaWxkcmVuKCkudG9BcnJheSgpfVxyXG4gICAgfSxcclxuICAgIGFuY2hvcih3WG1sLCBvZmZpY2VEb2N1bWVudCkge1xyXG4gICAgICAgIGxldCAkID0gb2ZmaWNlRG9jdW1lbnQuY29udGVudCh3WG1sKVxyXG4gICAgICAgIGxldCBncmFwaGljRGF0YSA9ICQuZmluZCgnYVxcXFw6Z3JhcGhpYz5hXFxcXDpncmFwaGljRGF0YScpXHJcbiAgICAgICAgbGV0IHR5cGUgPSBncmFwaGljRGF0YS5hdHRyKFwidXJpXCIpLnNwbGl0KFwiL1wiKS5wb3AoKVxyXG4gICAgICAgIGxldCBjaGlsZHJlbiA9IGdyYXBoaWNEYXRhLmNoaWxkcmVuKCkudG9BcnJheSgpXHJcbiAgICAgICAgaWYgKHR5cGUgPT0gXCJ3b3JkcHJvY2Vzc2luZ0dyb3VwXCIpXHJcbiAgICAgICAgICAgIGNoaWxkcmVuID0gY2hpbGRyZW5bMF0uY2hpbGRyZW4uZmlsdGVyKGEgPT4gYS5uYW1lLnNwbGl0KFwiOlwiKVswXSAhPSBcIndwZ1wiKVxyXG5cclxuICAgICAgICByZXR1cm4ge3R5cGU6IFwiZHJhd2luZy5hbmNob3JcIiwgY2hpbGRyZW59XHJcbiAgICB9LFxyXG4gICAgcGljKHdYbWwsIG9mZmljZURvY3VtZW50KSB7XHJcbiAgICAgICAgbGV0IGJsaXAgPSBvZmZpY2VEb2N1bWVudC5jb250ZW50KHdYbWwpLmZpbmQoXCJhXFxcXDpibGlwXCIpXHJcbiAgICAgICAgbGV0IHJpZCA9IGJsaXAuYXR0cigncjplbWJlZCcpIHx8IGJsaXAuYXR0cigncjpsaW5rJylcclxuICAgICAgICByZXR1cm4ge3R5cGU6IFwicGljdHVyZVwiLCAuLi5vZmZpY2VEb2N1bWVudC5nZXRSZWwocmlkKX1cclxuICAgIH0sXHJcbiAgICB3c3Aod1htbCwgb2ZmaWNlRG9jdW1lbnQpIHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICB0eXBlOiBcInNoYXBlXCIsXHJcbiAgICAgICAgICAgIGNoaWxkcmVuOiBvZmZpY2VEb2N1bWVudC5jb250ZW50KHdYbWwpLmZpbmQoXCI+d3BzXFxcXDp0eGJ4PndcXFxcOnR4YnhDb250ZW50XCIpLmNoaWxkcmVuKCkudG9BcnJheSgpXHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIEZhbGxiYWNrKCkge1xyXG4gICAgICAgIHJldHVybiBudWxsXHJcbiAgICB9LFxyXG4gICAgc2R0KHdYbWwsIG9mZmljZURvY3VtZW50KSB7XHJcbiAgICAgICAgbGV0ICQgPSBvZmZpY2VEb2N1bWVudC5jb250ZW50KHdYbWwpXHJcbiAgICAgICAgbGV0IHByID0gJC5maW5kKCc+d1xcXFw6c2R0UHInKVxyXG4gICAgICAgIGxldCBjb250ZW50ID0gJC5maW5kKCc+d1xcXFw6c2R0Q29udGVudCcpXHJcbiAgICAgICAgbGV0IGNoaWxkcmVuID0gY29udGVudC5jaGlsZHJlbigpLnRvQXJyYXkoKVxyXG5cclxuICAgICAgICBsZXQgZWxCaW5kaW5nID0gcHIuZmluZCgnd1xcXFw6ZGF0YUJpbmRpbmcnKS5nZXQoMClcclxuICAgICAgICBpZiAoZWxCaW5kaW5nKSB7Ly9wcm9wZXJ0aWVzXHJcbiAgICAgICAgICAgIGxldCBwYXRoID0gZWxCaW5kaW5nLmF0dHJpYnNbJ3c6eHBhdGgnXSxcclxuICAgICAgICAgICAgICAgIGQgPSBwYXRoLnNwbGl0KC9bXFwvXFw6XFxbXS8pLFxyXG4gICAgICAgICAgICAgICAgbmFtZSA9IChkLnBvcCgpLCBkLnBvcCgpKTtcclxuICAgICAgICAgICAgbGV0IHZhbHVlID0gY29udGVudC50ZXh0KClcclxuXHJcbiAgICAgICAgICAgIHJldHVybiB7dHlwZTogXCJwcm9wZXJ0eVwiLCBuYW1lLCB2YWx1ZSwgY2hpbGRyZW59XHJcbiAgICAgICAgfSBlbHNlIHsvL2NvbnRyb2xzXHJcbiAgICAgICAgICAgIGxldCBwckNoaWxkcmVuID0gcHIuZ2V0KDApLmNoaWxkcmVuXHJcbiAgICAgICAgICAgIGxldCBlbFR5cGUgPSBwckNoaWxkcmVuW3ByQ2hpbGRyZW4ubGVuZ3RoIC0gMV1cclxuICAgICAgICAgICAgbGV0IG5hbWUgPSBlbFR5cGUubmFtZS5zcGxpdChcIjpcIikucG9wKClcclxuICAgICAgICAgICAgbGV0IHR5cGUgPSBcInRleHQscGljdHVyZSxkb2NQYXJ0TGlzdCxjb21ib0JveCxkcm9wRG93bkxpc3QsZGF0ZSxjaGVja2JveCxyZXBlYXRpbmdTZWN0aW9uLHJlcGVhdGluZ1NlY3Rpb25JdGVtXCIuc3BsaXQoXCIsXCIpXHJcbiAgICAgICAgICAgICAgICAuZmluZChhID0+IGEgPT0gbmFtZSlcclxuICAgICAgICAgICAgbGV0IG1vZGVsID0ge2NoaWxkcmVufVxyXG4gICAgICAgICAgICBpZiAodHlwZSkge1xyXG4gICAgICAgICAgICAgICAgbW9kZWwudHlwZSA9IGBjb250cm9sLiR7dHlwZX1gXHJcbiAgICAgICAgICAgIH0gZWxzZSB7Ly9jb250YWluZXJcclxuICAgICAgICAgICAgICAgIGlmIChjb250ZW50LmZpbmQoXCJ3XFxcXDpwLHdcXFxcOnRibCx3XFxcXDp0cix3XFxcXDp0Y1wiKS5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgICAgICBtb2RlbC50eXBlID0gXCJibG9ja1wiXHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIG1vZGVsLnR5cGUgPSBcImlubGluZVwiXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICQgPSBvZmZpY2VEb2N1bWVudC5jb250ZW50XHJcbiAgICAgICAgICAgIHN3aXRjaCAobW9kZWwudHlwZSkge1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcImNvbnRyb2wuZHJvcERvd25MaXN0XCI6XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwiY29udHJvbC5jb21ib0JveFwiOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHNlbGVjdGVkID0gJChjb250ZW50KS50ZXh0KClcclxuICAgICAgICAgICAgICAgICAgICBtb2RlbC5vcHRpb25zID0gJChlbFR5cGUpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5maW5kKFwid1xcXFw6bGlzdEl0ZW1cIilcclxuICAgICAgICAgICAgICAgICAgICAgICAgLm1hcCgoaSwgbGkpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlzcGxheVRleHQ6IGxpLmF0dHJpYnNbXCJ3OmRpc3BsYXlUZXh0XCJdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiBsaS5hdHRyaWJzW1widzp2YWx1ZVwiXVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAuZ2V0KClcclxuICAgICAgICAgICAgICAgICAgICBtb2RlbC52YWx1ZSA9IChtb2RlbC5vcHRpb25zLmZpbmQoYSA9PiBhLmRpc3BsYXlUZXh0ID09IHNlbGVjdGVkKSB8fCB7fSkudmFsdWVcclxuICAgICAgICAgICAgICAgICAgICBicmVha1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgY2FzZSBcImNvbnRyb2wuY2hlY2tib3hcIjoge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBucyA9IGVsVHlwZS5uYW1lLnNwbGl0KFwiOlwiKVswXVxyXG4gICAgICAgICAgICAgICAgICAgIG1vZGVsLmNoZWNrZWQgPSAkKGVsVHlwZSkuZmluZChgJHtuc31cXFxcOmNoZWNrZWRgKS5hdHRyKGAke25zfTp2YWxgKSA9PSBcIjFcIlxyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwiY29udHJvbC50ZXh0XCI6XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNvbnRlbnQuZmluZCgnd1xcXFw6ciBbd1xcXFw6dmFsfj1QbGFjZWhvbGRlcl0nKS5sZW5ndGggPT0gMClcclxuICAgICAgICAgICAgICAgICAgICAgICAgbW9kZWwudmFsdWUgPSBjb250ZW50LnRleHQoKVxyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXHJcbiAgICAgICAgICAgICAgICBjYXNlIFwiY29udHJvbC5kYXRlXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgbW9kZWwudmFsdWUgPSBuZXcgRGF0ZSgkKGVsVHlwZSkuYXR0cihcInc6ZnVsbERhdGVcIikpXHJcbiAgICAgICAgICAgICAgICAgICAgbW9kZWwuZm9ybWF0ID0gJChlbFR5cGUpLmZpbmQoXCJ3XFxcXDpkYXRlRm9ybWF0XCIpLmF0dHIoXCJ3OnZhbFwiKVxyXG4gICAgICAgICAgICAgICAgICAgIG1vZGVsLmxvY2FsZSA9ICQoZWxUeXBlKS5maW5kKFwid1xcXFw6bGlkXCIpLmF0dHIoXCJ3OnZhbFwiKVxyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIG1vZGVsXHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIGh5cGVybGluayh3WG1sLCBvZmZpY2VEb2N1bWVudCkge1xyXG4gICAgICAgIGlmICh3WG1sLmF0dHJpYnNbXCJyOmlkXCJdKSB7XHJcbiAgICAgICAgICAgIGxldCB1cmwgPSBvZmZpY2VEb2N1bWVudC5nZXRSZWwod1htbC5hdHRyaWJzW1wicjppZFwiXSlcclxuICAgICAgICAgICAgcmV0dXJuIHt0eXBlOiBcImh5cGVybGlua1wiLCB1cmx9O1xyXG4gICAgICAgIH0gZWxzZSBpZiAod1htbC5hdHRyaWJzWyd3OmFuY2hvciddKSB7XHJcbiAgICAgICAgICAgIGxldCBuYW1lID0gd1htbC5hdHRyaWJzWyd3OmFuY2hvciddOyAvL1RPRE9cclxuICAgICAgICAgICAgcmV0dXJuIHt0eXBlOiAnYW5jaG9yJywgbmFtZX07XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIHRibCh3WG1sLCBvZmZpY2VEb2N1bWVudCkge1xyXG4gICAgICAgIHJldHVybiB3WG1sLmNoaWxkcmVuLnJlZHVjZSgoc3RhdGUsIG5vZGUpID0+IHtcclxuICAgICAgICAgICAgc3dpdGNoIChub2RlLm5hbWUpIHtcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJ3OnRibFByXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgc3RhdGUucHIgPSBub2RlXHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJ3OnRibEdyaWRcIjpcclxuICAgICAgICAgICAgICAgICAgICBzdGF0ZS5jb2xzID0gbm9kZS5jaGlsZHJlblxyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXHJcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgICAgIHN0YXRlLmNoaWxkcmVuLnB1c2gobm9kZSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gc3RhdGVcclxuICAgICAgICB9LCB7dHlwZTogXCJ0YmxcIiwgY2hpbGRyZW46IFtdLCBwcjogbnVsbCwgY29sczogW119KVxyXG4gICAgfSxcclxuICAgIHRyKHdYbWwsIG9mZmljZURvY3VtZW50KSB7XHJcbiAgICAgICAgcmV0dXJuIHdYbWwuY2hpbGRyZW4ucmVkdWNlKChzdGF0ZSwgbm9kZSkgPT4ge1xyXG4gICAgICAgICAgICBzd2l0Y2ggKG5vZGUubmFtZSkge1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcInc6dHJQclwiOlxyXG4gICAgICAgICAgICAgICAgICAgIHN0YXRlLnByID0gbm9kZVxyXG4gICAgICAgICAgICAgICAgICAgIHN0YXRlLmlzSGVhZGVyID0gISFub2RlLmNoaWxkcmVuLmZpbmQoYSA9PiBhLm5hbWUgPT0gXCJ3OnRibEhlYWRlclwiKVxyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXHJcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgICAgIHN0YXRlLmNoaWxkcmVuLnB1c2gobm9kZSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gc3RhdGVcclxuICAgICAgICB9LCB7dHlwZTogXCJ0clwiLCBjaGlsZHJlbjogW10sIHByOiBudWxsfSlcclxuICAgIH0sXHJcbiAgICB0Yyh3WG1sLCBvZmZpY2VEb2N1bWVudCkge1xyXG4gICAgICAgIHJldHVybiB3WG1sLmNoaWxkcmVuLnJlZHVjZSgoc3RhdGUsIG5vZGUpID0+IHtcclxuICAgICAgICAgICAgc3dpdGNoIChub2RlLm5hbWUpIHtcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJ3OnRjUHJcIjpcclxuICAgICAgICAgICAgICAgICAgICBzdGF0ZS5wciA9IG5vZGVcclxuICAgICAgICAgICAgICAgICAgICBicmVha1xyXG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgICAgICBzdGF0ZS5jaGlsZHJlbi5wdXNoKG5vZGUpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHN0YXRlXHJcbiAgICAgICAgfSwge3R5cGU6IFwidGNcIiwgY2hpbGRyZW46IFtdLCBwcjogbnVsbH0pXHJcbiAgICB9LFxyXG4gICAgYWx0Q2h1bmsod1htbCwgb2ZmaWNlRG9jdW1lbnQpIHtcclxuICAgICAgICBsZXQgcklkID0gd1htbC5hdHRyaWJzWydyOmlkJ11cclxuICAgICAgICBsZXQgZGF0YSA9IG9mZmljZURvY3VtZW50LmdldFJlbChySWQpXHJcblxyXG4gICAgICAgIGxldCBwYXJ0TmFtZSA9IG9mZmljZURvY3VtZW50LmZvbGRlciArIG9mZmljZURvY3VtZW50LnJlbHMoYFtJZD0ke3JJZH1dYCkuYXR0cihcIlRhcmdldFwiKVxyXG4gICAgICAgIGxldCBjb250ZW50VHlwZSA9IG9mZmljZURvY3VtZW50LmRvYy5jb250ZW50VHlwZXMoYE92ZXJyaWRlW1BhcnROYW1lPScke3BhcnROYW1lfSddYCkuYXR0cihcIkNvbnRlbnRUeXBlXCIpXHJcbiAgICAgICAgcmV0dXJuIHt0eXBlOiBcImNodW5rXCIsIGRhdGEsIGNvbnRlbnRUeXBlfVxyXG4gICAgfSxcclxuICAgIGRvY0RlZmF1bHRzKHdYbWwpIHtcclxuICAgICAgICByZXR1cm4ge3R5cGU6IFwic3R5bGVcIn1cclxuICAgIH0sXHJcbiAgICBzdHlsZSh3WG1sKSB7XHJcbiAgICAgICAgcmV0dXJuIHt0eXBlOiBcInN0eWxlXCIsIGlkOiB3WG1sLmF0dHJpYnNbJ3c6c3R5bGVJZCddfVxyXG4gICAgfSxcclxuICAgIGFic3RyYWN0TnVtKHdYbWwpIHtcclxuICAgICAgICByZXR1cm4ge3R5cGU6IFwiYWJzdHJhY3ROdW1cIiwgaWQ6IHdYbWwuYXR0cmlic1tcInc6YWJzdHJhY3ROdW1JZFwiXX1cclxuICAgIH0sXHJcbiAgICBudW0od1htbCkge1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHR5cGU6IFwibnVtXCIsXHJcbiAgICAgICAgICAgIGlkOiB3WG1sLmF0dHJpYnNbXCJ3Om51bUlkXCJdLFxyXG4gICAgICAgICAgICBhYnN0cmFjdE51bTogd1htbC5jaGlsZHJlbi5maW5kKGEgPT4gYS5uYW1lID09IFwidzphYnN0cmFjdE51bUlkXCIpLmF0dHJpYnNbXCJ3OnZhbFwiXVxyXG4gICAgICAgIH1cclxuICAgIH0sXHJcbiAgICBsYXRlbnRTdHlsZXMoKSB7XHJcbiAgICAgICAgcmV0dXJuIG51bGxcclxuICAgIH0sXHJcbiAgICBvYmplY3Qod1htbCwgb2ZmaWNlRG9jdW1lbnQpIHtcclxuICAgICAgICBsZXQgb2xlID0gb2ZmaWNlRG9jdW1lbnQuY29udGVudCh3WG1sKS5maW5kKFwib1xcXFw6T0xFT2JqZWN0XCIpXHJcbiAgICAgICAgbGV0IHR5cGUgPSBvbGUuYXR0cihcIlByb2dJRFwiKVxyXG4gICAgICAgIGxldCBlbWJlZCA9IG9sZS5hdHRyKFwiVHlwZVwiKSA9PT0gXCJFbWJlZFwiXHJcbiAgICAgICAgbGV0IHJJZCA9IG9sZS5hdHRyKFwicjppZFwiKVxyXG4gICAgICAgIHJldHVybiB7dHlwZTogXCJvYmplY3RcIiwgZW1iZWQsIHByb2c6IHR5cGUsIGRhdGE6IG9mZmljZURvY3VtZW50LmdldFJlbE9sZU9iamVjdChySWQpfVxyXG4gICAgfVxyXG59XHJcbiJdfQ==